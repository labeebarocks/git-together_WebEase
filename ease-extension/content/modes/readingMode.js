(() => {
  const STYLE_ID = "ease-reading-mode-style";

  // IMPORTANT: this path must match where you placed the font file
  const fontUrl = chrome.runtime.getURL("content/assets/WebEase/ease-extension/content/assets/opendyslexic-regular-webfont.woff2");

  const CSS = `
    @font-face {
      font-family: "OpenDyslexic";
      src: url("${fontUrl}") format("woff2");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    /* Reading mode typography */
    body {
      font-family: "OpenDyslexic", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif !important;
      line-height: 1.8 !important;
      letter-spacing: 0.05em !important;
      word-spacing: 0.12em !important;
    }

    /* Ensure form controls match */
    input, textarea, select, button {
      font-family: "OpenDyslexic", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif !important;
      line-height: 1.6 !important;
      letter-spacing: 0.04em !important;
    }

    /* Do not override code blocks */
    pre, code, kbd, samp {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
      letter-spacing: 0 !important;
      word-spacing: normal !important;
      line-height: 1.5 !important;
    }
  `;

  function enable() {
    window.__EASE_DOM__.injectStyleTag(STYLE_ID, CSS);
  }

  function disable() {
    window.__EASE_DOM__.removeStyleTag(STYLE_ID);
  }

  window.__EASE_MODES__ = window.__EASE_MODES__ || {};
  window.__EASE_MODES__.readingMode = { enable, disable };
})();