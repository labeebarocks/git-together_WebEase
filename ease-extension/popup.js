let enabled = false;

const CONTENT_SCRIPT_FILES = [
  "content/utils/dom.js",
  "content/modes/contrastMode.js",
  "content/contentScript.js"
];

function sendToggleHighContrast(tabId, enabled, callback) {
  chrome.tabs.sendMessage(
    tabId,
    { type: "TOGGLE_HIGH_CONTRAST", enabled },
    (res) => {
      if (chrome.runtime.lastError) {
        callback(chrome.runtime.lastError);
        return;
      }
      callback(null, res);
    }
  );
}

document.getElementById("highContrast").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  enabled = !enabled;

  sendToggleHighContrast(tab.id, enabled, async (err, res) => {
    if (err && err.message && err.message.includes("Receiving end does not exist")) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: CONTENT_SCRIPT_FILES
        });
        sendToggleHighContrast(tab.id, enabled, (err2, res2) => {
          if (err2) console.error("SendMessage error:", err2.message);
          else console.log("Response:", res2);
        });
      } catch (e) {
        console.error("Inject error:", e);
      }
      return;
    }
    if (err) console.error("SendMessage error:", err.message);
    else console.log("Response:", res);
  });
});

let readingEnabled = false;

document.getElementById("reading").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  readingEnabled = !readingEnabled;

  chrome.tabs.sendMessage(
    tab.id,
    { type: "TOGGLE_READING_MODE", enabled: readingEnabled },
    (res) => {
      if (chrome.runtime.lastError) {
        console.error("SendMessage error:", chrome.runtime.lastError.message);
        return;
      }
      console.log("Reading Mode response:", res);
    }
  );
});