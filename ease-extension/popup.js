let enabled = false;
let seizureEnabled = false;

const CONTENT_SCRIPT_FILES = [
  "content/utils/dom.js",
  "content/modes/contrastMode.js",
  "content/modes/seizureSafe.js",
  "content/contentScript.js"
];

function sendMessageWithInjection(tabId, message, callback) {
  chrome.tabs.sendMessage(tabId, message, async (res) => {
    if (chrome.runtime.lastError) {
      const err = chrome.runtime.lastError;
      if (err.message && err.message.includes("Receiving end does not exist")) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: CONTENT_SCRIPT_FILES
          });
          chrome.tabs.sendMessage(tabId, message, (res2) => {
            if (chrome.runtime.lastError) callback(chrome.runtime.lastError);
            else callback(null, res2);
          });
          return;
        } catch (e) {
          callback(e);
          return;
        }
      }
      callback(err);
      return;
    }
    callback(null, res);
  });
}

document.getElementById("highContrast").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  enabled = !enabled;

  sendMessageWithInjection(tab.id, { type: "TOGGLE_HIGH_CONTRAST", enabled }, (err, res) => {
    if (err) console.error("SendMessage error:", err.message);
    else console.log("Response:", res);
  });
});

document.getElementById("seizure").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  seizureEnabled = !seizureEnabled;

  sendMessageWithInjection(tab.id, { type: "TOGGLE_SEIZURE_SAFE", enabled: seizureEnabled }, (err, res) => {
    if (err) console.error("Seizure Safe error:", err.message);
    else console.log("Response:", res);
  });
});