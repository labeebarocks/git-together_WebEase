console.log("[Ease] content script loaded");

function reapplySavedState() {
  chrome.runtime.sendMessage({ type: "GET_TAB_STATE" }, (state) => {
    if (!state || typeof state !== "object") return;
    try {
      if (state.highContrast) window.__EASE_MODES__?.highContrast?.enable();
      if (state.readingMode) {
        window.__EASE_MODES__?.readingMode?.enable();
        if (state.readingFont) window.__EASE_MODES__?.readingMode?.setFont(state.readingFont);
      }
      if (state.focusMode) window.__EASE_MODES__?.focusMode?.enable();
      if (state.motorMode) window.__EASE_MODES__?.motorMode?.enable();
    } catch (e) {
      console.warn("[Ease] reapplySavedState:", e);
    }
  });
}

reapplySavedState();

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  try {
    if (msg?.type === "TOGGLE_HIGH_CONTRAST") {
      const mode = window.__EASE_MODES__?.highContrast;
      if (!mode) return sendResponse({ ok: false, error: "highContrast mode not found" });

      msg.enabled ? mode.enable() : mode.disable();
      return sendResponse({ ok: true });
    }

    if (msg?.type === "TOGGLE_READING_MODE") {
      const mode = window.__EASE_MODES__?.readingMode;
      if (!mode) return sendResponse({ ok: false, error: "readingMode mode not found" });

      msg.enabled ? mode.enable() : mode.disable();
      return sendResponse({ ok: true });
    }

    if (msg?.type === "SET_READING_FONT") {
      const mode = window.__EASE_MODES__?.readingMode;
      if (!mode?.setFont) return sendResponse({ ok: false, error: "readingMode setFont not found" });

      mode.setFont(msg.font);
      return sendResponse({ ok: true });
    }

    if (msg?.type === "TOGGLE_FOCUS_MODE") {
      const mode = window.__EASE_MODES__?.focusMode;
      if (!mode) return sendResponse({ ok: false, error: "focusMode not found" });

      msg.enabled ? mode.enable() : mode.disable();
      return sendResponse({ ok: true });
    }

    if (msg?.type === "TOGGLE_MOTOR_MODE") {
      const mode = window.__EASE_MODES__?.motorMode;
      if (!mode) return sendResponse({ ok: false, error: "motorMode not found" });
      msg.enabled ? mode.enable() : mode.disable();
      return sendResponse({ ok: true });
    }

    return sendResponse({ ok: false, error: "unknown message type" });
  } catch (e) {
    return sendResponse({ ok: false, error: String(e) });
  }
});