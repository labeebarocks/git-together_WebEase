let enabled = false;
let readingEnabled = false;
const READING_FONT_KEY = "easeReadingFont";
const DEFAULT_READING_FONT = "opendyslexic";
const ALLOWED_READING_FONTS = new Set(["opendyslexic", "lexend", "comicsans"]);

const CONTENT_SCRIPT_FILES = [
  "content/utils/dom.js",
  "content/modes/contrastMode.js",
  "content/modes/readingMode.js",
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

  sendToggleHighContrast(tab.id, enabled, (err, res) => {
    if (err) console.error("SendMessage error:", err.message);
    else console.log("Response:", res);
  });
});

document.getElementById("reading").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  readingEnabled = !readingEnabled;

  sendMessageWithInjection(tab.id, { type: "TOGGLE_READING_MODE", enabled: readingEnabled }, (err, res) => {
    if (err) {
      console.error("SendMessage error:", err.message);
      return;
    }
    console.log("Reading Mode response:", res);
  });
});

document.getElementById("readingFont").addEventListener("change", async (event) => {
  const selectedFont = event.target.value;
  setStoredReadingFont(selectedFont);
  await applyReadingFontToActiveTab(selectedFont);
});

async function initializeReadingFontSelection() {
  const selectEl = document.getElementById("readingFont");
  if (!selectEl) return;

  const { font: storedFont, normalized } = await getStoredReadingFont();
  selectEl.value = storedFont;
  if (normalized) {
    setStoredReadingFont(DEFAULT_READING_FONT);
  }
  await applyReadingFontToActiveTab(storedFont);
}

initializeReadingFontSelection();