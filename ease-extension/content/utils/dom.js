(function () {
  function injectStyleTag(id, cssText) {
    const existing = document.getElementById(id);
    if (existing) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = cssText;
    document.documentElement.appendChild(style);
  }

  function removeStyleTag(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  window.easeDOM = { injectStyleTag, removeStyleTag };
})();
