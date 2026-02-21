console.log("[Ease] content script loaded");

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  try {
    if (msg?.type === "TOGGLE_HIGH_CONTRAST") {
      const mode = window.__EASE_MODES__?.highContrast;
      if (!mode) return sendResponse({ ok: false, error: "highContrast mode not found" });

      msg.enabled ? mode.enable() : mode.disable();
      return sendResponse({ ok: true });
    }

    return sendResponse({ ok: false, error: "unknown message type" });
  } catch (e) {
    return sendResponse({ ok: false, error: String(e) });
  }
});

// Reading Mode
if (msg?.type === "TOGGLE_READING_MODE") {
  const mode = window.__EASE_MODES__?.readingMode;
  if (!mode) return sendResponse({ ok: false, error: "readingMode not found" });

  msg.enabled ? mode.enable() : mode.disable();
  return sendResponse({ ok: true });
}