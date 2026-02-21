(function () {
  const STYLE_ID = "ease-seizure-safe-style";
  const CSS = `
  * {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
`;

  function enableSeizureSafe() {
    window.easeDOM.injectStyleTag(STYLE_ID, CSS);
    document.querySelectorAll("video, audio").forEach(function (m) {
      try { m.pause(); } catch (_) {}
    });
  }

  function disableSeizureSafe() {
    window.easeDOM.removeStyleTag(STYLE_ID);
  }

  window.easeSeizureSafe = { enableSeizureSafe, disableSeizureSafe };
})();
