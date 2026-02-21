// Ease: persist per-tab mode state so content script can re-apply after tab switch/reload.

const STORAGE_KEY = "ease_tab_states";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "GET_TAB_STATE") return false;

  const tabId = sender.tab?.id;
  if (tabId == null) {
    sendResponse({});
    return false;
  }

  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const all = result[STORAGE_KEY] || {};
    const state = all[tabId] || {};
    sendResponse(state);
  });

  return true; // keep channel open for async sendResponse
});
