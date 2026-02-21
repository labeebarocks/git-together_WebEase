const TAB_STATES_KEY = "ease_tab_states";
const READING_FONT_KEY = "easeReadingFont";
const DEFAULT_READING_FONT = "opendyslexic";
const ALLOWED_READING_FONTS = new Set(["opendyslexic", "lexend", "comicsans"]);

let enabled = false;
let readingEnabled = false;
let focusEnabled = false;

const CONTENT_SCRIPT_FILES = [
  "content/utils/dom.js",
  "content/modes/contrastMode.js",
  "content/modes/readingMode.js",
  "content/modes/focusMode.js",
  "content/contentScript.js"
];

function sendMessageWithInjection(tabId, message, callback) {
  chrome.tabs.sendMessage(tabId, message, async (res) => {
    if (chrome.runtime.lastError) {
      if (chrome.runtime.lastError.message.includes("Receiving end does not exist")) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: CONTENT_SCRIPT_FILES
          });

          chrome.tabs.sendMessage(tabId, message, (res2) => {
            if (chrome.runtime.lastError) {
              callback(chrome.runtime.lastError);
              return;
            }
            callback(null, res2);
          });
          return;
        } catch (e) {
          callback(e);
          return;
        }
      }

      callback(chrome.runtime.lastError);
      return;
    }

    callback(null, res);
  });
}

function getTabState(tabId) {
  return new Promise((resolve) => {
    chrome.storage.local.get([TAB_STATES_KEY], (result) => {
      const all = result[TAB_STATES_KEY] || {};
      resolve(all[tabId] || {});
    });
  });
}

function setTabState(tabId, partial) {
  chrome.storage.local.get([TAB_STATES_KEY], (result) => {
    const all = result[TAB_STATES_KEY] || {};
    const current = all[tabId] || {};
    all[tabId] = { ...current, ...partial };
    chrome.storage.local.set({ [TAB_STATES_KEY]: all });
  });
}

function getStoredReadingFont() {
  return new Promise((resolve) => {
    chrome.storage.local.get([READING_FONT_KEY], (result) => {
      const storedFont = result?.[READING_FONT_KEY];
      if (!ALLOWED_READING_FONTS.has(storedFont)) {
        resolve({ font: DEFAULT_READING_FONT, normalized: true });
        return;
      }
      resolve({ font: storedFont, normalized: false });
    });
  });
}

function setStoredReadingFont(font) {
  chrome.storage.local.set({ [READING_FONT_KEY]: font });
}

async function applyReadingFontToActiveTab(font) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  sendMessageWithInjection(tab.id, { type: "SET_READING_FONT", font }, (err, res) => {
    if (err) {
      console.error("SendMessage error:", err.message);
      return;
    }
    console.log("Reading Font response:", res);
  });
}

function sendToggleHighContrast(tabId, enabled, callback) {
  sendMessageWithInjection(tabId, { type: "TOGGLE_HIGH_CONTRAST", enabled }, callback);
}

document.getElementById("highContrast").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  enabled = !enabled;
  setTabState(tab.id, { highContrast: enabled });

  sendToggleHighContrast(tab.id, enabled, (err, res) => {
    if (err) console.error("SendMessage error:", err.message);
    else console.log("Response:", res);
  });
});

document.getElementById("reading").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  readingEnabled = !readingEnabled;
  setTabState(tab.id, { readingMode: readingEnabled });

  sendMessageWithInjection(tab.id, { type: "TOGGLE_READING_MODE", enabled: readingEnabled }, (err, res) => {
    if (err) {
      console.error("SendMessage error:", err.message);
      return;
    }
    console.log("Reading Mode response:", res);
  });
});

document.getElementById("readingFont").addEventListener("change", async (event) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const selectedFont = event.target.value;
  setStoredReadingFont(selectedFont);
  if (tab?.id) setTabState(tab.id, { readingFont: selectedFont });
  await applyReadingFontToActiveTab(selectedFont);
});

async function syncPopupToTabState(tabId) {
  const state = await getTabState(tabId);
  enabled = Boolean(state.highContrast);
  readingEnabled = Boolean(state.readingMode);
  focusEnabled = Boolean(state.focusMode);

  const selectEl = document.getElementById("readingFont");
  if (selectEl) {
    const font = state.readingFont && ALLOWED_READING_FONTS.has(state.readingFont)
      ? state.readingFont
      : (await getStoredReadingFont()).font;
    selectEl.value = font;
    if (!state.readingFont) setStoredReadingFont(font);
  }
}

async function initializePopup() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  await syncPopupToTabState(tab.id);

  const selectEl = document.getElementById("readingFont");
  if (selectEl) await applyReadingFontToActiveTab(selectEl.value);
}

initializePopup();

document.getElementById("focus").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  focusEnabled = !focusEnabled;
  setTabState(tab.id, { focusMode: focusEnabled });

  sendMessageWithInjection(tab.id, {
    type: "TOGGLE_FOCUS_MODE",
    enabled: focusEnabled
  }, (err, res) => {
    if (err) {
      console.error("SendMessage error:", err.message);
      return;
    }
    console.log("Focus Mode response:", res);
  });
});