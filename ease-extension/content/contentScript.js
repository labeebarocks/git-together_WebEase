chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.type === "TOGGLE_SEIZURE_SAFE") {
    if (msg.enabled) window.easeSeizureSafe.enableSeizureSafe();
    else window.easeSeizureSafe.disableSeizureSafe();
    sendResponse({ ok: true });
    return;
  }

  if (msg.type === "TOGGLE_HIGH_CONTRAST") {
    if (msg.enabled) window.easeHighContrast.enableHighContrast();
    else window.easeHighContrast.disableHighContrast();
    sendResponse({ ok: true });
    return;
  }
});
