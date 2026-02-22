const TAB_STATES_KEY = "ease_tab_states";
const READING_FONT_KEY = "easeReadingFont";
const DEFAULT_READING_FONT = "opendyslexic";
const ALLOWED_READING_FONTS = new Set(["opendyslexic", "lexend", "comicsans"]);

let enabled = false;
let readingEnabled = false;
let focusEnabled = false;
let motorEnabled = false;
let seizureEnabled = false;

const CONTENT_SCRIPT_FILES = [
  "content/utils/dom.js",
  "content/modes/contrastMode.js",
  "content/modes/seizureSafe.js",
  "content/modes/readingMode.js",
  "content/modes/focusMode.js",
  "content/modes/motorMode.js",
  "content/contentScript.js"
];

const INDICATORS = {
  seizureSafe: document.getElementById("seizureStatus"),
  highContrast: document.getElementById("highContrastStatus"),
  readingMode: document.getElementById("readingStatus"),
  focusMode: document.getElementById("focusStatus"),
  motorMode: document.getElementById("motorStatus")
};

function setIndicator(modeKey, state) {
  const el = INDICATORS[modeKey];
  if (!el) return;

  if (state === "enabled") {
    el.textContent = "Enabled";
    el.dataset.state = "enabled";
  } else if (state === "disabled") {
    el.textContent = "Disabled";
    el.dataset.state = "disabled";
  } else {
    el.textContent = "Not available";
    el.dataset.state = "na";
  }
}

function isRestrictedUrl(url) {
  return (
    !url ||
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:")
  );
}

function renderIndicatorsFromBooleans() {
  setIndicator("seizureSafe", seizureEnabled ? "enabled" : "disabled");
  setIndicator("highContrast", enabled ? "enabled" : "disabled");
  setIndicator("readingMode", readingEnabled ? "enabled" : "disabled");
  setIndicator("focusMode", focusEnabled ? "enabled" : "disabled");
  setIndicator("motorMode", motorEnabled ? "enabled" : "disabled");
}

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


async function syncPopupToTabState(tabId) {
  const state = await getTabState(tabId);
  
  enabled = Boolean(state.highContrast);
  readingEnabled = Boolean(state.readingMode);
  focusEnabled = Boolean(state.focusMode);
  motorEnabled = Boolean(state.motorMode);
  seizureEnabled = Boolean(state.seizureSafe);
  
  const selectEl = document.getElementById("readingFont");
  if (selectEl) {
    const font = state.readingFont && ALLOWED_READING_FONTS.has(state.readingFont)
    ? state.readingFont
    : (await getStoredReadingFont()).font;
      selectEl.value = font;
      if (!state.readingFont) setStoredReadingFont(font);
    }

  renderIndicatorsFromBooleans();
}

async function initializePopup() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  
  if (isRestrictedUrl(tab.url)) {
    // On restricted pages, nothing is injectable
    setIndicator("seizureSafe", "na");
    setIndicator("highContrast", "na");
    setIndicator("readingMode", "na");
    setIndicator("focusMode", "na");
    setIndicator("motorMode", "na");
    return;
  }
  
  await syncPopupToTabState(tab.id);
  
  const selectEl = document.getElementById("readingFont");
  if (selectEl) await applyReadingFontToActiveTab(selectEl.value);
}

initializePopup();

document.getElementById("seizure").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  
  if (isRestrictedUrl(tab.url)) {
    setIndicator("seizureSafe", "na");
    return;
  }
  
  const next = !seizureEnabled;
  
  // optimistic UI is optional; I prefer updating after success
  sendMessageWithInjection(tab.id, { type: "TOGGLE_SEIZURE_SAFE", enabled: next }, (err, res) => {
    if (err) {
      console.error("Seizure Safe error:", err.message);
      setIndicator("seizureSafe", "na");
      return;
    }
    
    seizureEnabled = next;
    setTabState(tab.id, { seizureSafe: seizureEnabled });
    setIndicator("seizureSafe", seizureEnabled ? "enabled" : "disabled");
  });
});

document.getElementById("highContrast").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  
  if (isRestrictedUrl(tab.url)) {
    setIndicator("highContrast", "na");
    return;
  }
  
  enabled = !enabled;
  setTabState(tab.id, { highContrast: enabled });
  
  sendToggleHighContrast(tab.id, enabled, (err, res) => {
    if (err) {
      console.error("SendMessage error:", err.message);
      setIndicator("highContrast", "na");
      return;
    } else console.log("Response:", res);
    
    setIndicator("highContrast", enabled ? "enabled" : "disabled");
  });
});

document.getElementById("reading").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  if (isRestrictedUrl(tab.url)) {
    setIndicator("readingMode", "na");
    return;
  }
  
  readingEnabled = !readingEnabled;
  setTabState(tab.id, { readingMode: readingEnabled });
  
  sendMessageWithInjection(tab.id, { type: "TOGGLE_READING_MODE", enabled: readingEnabled }, (err, res) => {
    if (err) {
      console.error("SendMessage error:", err.message);
      setIndicator("readingMode", "na");
      return;
    }
    // console.log("Reading Mode response:", res);
    setIndicator("readingMode", enabled ? "enabled" : "disabled");
  });
});

document.getElementById("focus").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  
  if (isRestrictedUrl(tab.url)) {
    setIndicator("focusMode", "na");
    return;
  }
  
  focusEnabled = !focusEnabled;
  setTabState(tab.id, { focusMode: focusEnabled });
  
  sendMessageWithInjection(tab.id, {
    type: "TOGGLE_FOCUS_MODE",
    enabled: focusEnabled
  }, (err, res) => {
    if (err) {
      console.error("SendMessage error:", err.message);
      setIndicator("focusMode", "na");
      return;
    }
    // console.log("Focus Mode response:", res);
    setIndicator("focusMode", enabled ? "enabled" : "disabled");
  });
});

document.getElementById("motor").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  if (isRestrictedUrl(tab.url)) {
    setIndicator("motorMode", "na");
    return;
  }
  
  motorEnabled = !motorEnabled;
  setTabState(tab.id, { motorMode: motorEnabled });
  
  sendMessageWithInjection(tab.id, {
    type: "TOGGLE_MOTOR_MODE",
    enabled: motorEnabled
  }, (err, res) => {
    if (err) {
      console.error("SendMessage error:", err.message);
      setIndicator("motorMode", "na");
      return;
    }
    // console.log("Motor Mode response:", res);
    setIndicator("motorMode", enabled ? "enabled" : "disabled");
  });
});

document.getElementById("readingFont").addEventListener("change", async (event) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const selectedFont = event.target.value;
  setStoredReadingFont(selectedFont);
  if (tab?.id) setTabState(tab.id, { readingFont: selectedFont });
  await applyReadingFontToActiveTab(selectedFont);
});