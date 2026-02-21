(function () {
  const STYLE_ID = "ease-high-contrast-style";
  const CSS = `
  /* High contrast overrides (MVP) */
  html, body {
    background: #000 !important;
    color: #fff !important;
  }

  * {
    color: #fff !important;
    background-color: transparent !important;
    border-color: #fff !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  a, a * {
    color: #00ffff !important;
    text-decoration: underline !important;
  }

  button, input, select, textarea {
    background: #000 !important;
    color: #fff !important;
    border: 2px solid #fff !important;
  }

  :focus {
    outline: 3px solid #ffff00 !important;
    outline-offset: 2px !important;
  }
`;

  function enableHighContrast() {
    window.easeDOM.injectStyleTag(STYLE_ID, CSS);
  }

  function disableHighContrast() {
    window.easeDOM.removeStyleTag(STYLE_ID);
  }

  window.easeHighContrast = { enableHighContrast, disableHighContrast };
})();
