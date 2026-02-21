(() => {
  const STYLE_ID = "ease-reading-mode-style";
  const FONT_CONFIG = {
    opendyslexic: {
      family: "OpenDyslexic",
      file: "content/assets/opendyslexic-regular-webfont.woff2",
      format: "woff2"
    },
    lexend: {
      family: "Lexend",
      file: "content/assets/Lexend-VariableFont_wght.ttf",
      format: "truetype"
    },
    comicsans: {
      family: "LdfComicSans",
      file: "content/assets/Ldfcomicsansbold-zgma.ttf",
      format: "truetype"
    }
  };

  let currentFontKey = "opendyslexic";
  let isEnabled = false;

  function getCssForFont(fontKey) {
    const selected = FONT_CONFIG[fontKey] || FONT_CONFIG.opendyslexic;
    const fontUrl = chrome.runtime.getURL(selected.file);

    return `
      @font-face {
        font-family: "${selected.family}";
        src: url("${fontUrl}") format("${selected.format}");
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }

      body {
        font-family: "${selected.family}", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif !important;
        line-height: 1.8 !important;
        letter-spacing: 0.05em !important;
        word-spacing: 0.12em !important;
      }

      input, textarea, select, button {
        font-family: "${selected.family}", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif !important;
        line-height: 1.6 !important;
        letter-spacing: 0.04em !important;
      }

      pre, code, kbd, samp {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        letter-spacing: 0 !important;
        word-spacing: normal !important;
        line-height: 1.5 !important;
      }
    `;
  }

  function enable() {
    isEnabled = true;
    window.__EASE_DOM__.injectStyleTag(STYLE_ID, getCssForFont(currentFontKey));
  }

  function disable() {
    isEnabled = false;
    window.__EASE_DOM__.removeStyleTag(STYLE_ID);
  }

  function setFont(fontKey) {
    currentFontKey = FONT_CONFIG[fontKey] ? fontKey : "opendyslexic";

    if (isEnabled) {
      window.__EASE_DOM__.removeStyleTag(STYLE_ID);
      window.__EASE_DOM__.injectStyleTag(STYLE_ID, getCssForFont(currentFontKey));
    }
  }

  window.__EASE_MODES__ = window.__EASE_MODES__ || {};
  window.__EASE_MODES__.readingMode = { enable, disable, setFont };
})();