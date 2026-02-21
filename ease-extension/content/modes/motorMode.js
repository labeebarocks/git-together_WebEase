(() => {
  const STYLE_ID = "ease-motor-mode-style";
  const SKIP_LINK_ID = "ease-skip-to-content";
  const MIN_TOUCH_PX = 44;

  const CSS = `
    /* Visible focus outlines (WCAG-compliant) */
    .ease-motor-mode *:focus {
      outline: 3px solid #0066cc !important;
      outline-offset: 2px !important;
    }
    .ease-motor-mode *:focus:not(:focus-visible) {
      outline: none !important;
    }
    .ease-motor-mode *:focus-visible {
      outline: 3px solid #0066cc !important;
      outline-offset: 2px !important;
    }

    /* Larger click/touch targets (min 44x44px) */
    .ease-motor-mode a:not([role="button"]),
    .ease-motor-mode button,
    .ease-motor-mode input:not([type="hidden"]),
    .ease-motor-mode select,
    .ease-motor-mode textarea,
    .ease-motor-mode [role="button"],
    .ease-motor-mode [role="link"],
    .ease-motor-mode [data-ease-motor-focusable] {
      min-width: ${MIN_TOUCH_PX}px !important;
      min-height: ${MIN_TOUCH_PX}px !important;
      box-sizing: border-box !important;
    }

    /* Skip-to-content link: off-screen until focused */
    #${SKIP_LINK_ID} {
      position: fixed !important;
      left: -9999px !important;
      top: 8px !important;
      z-index: 2147483647 !important;
      padding: 12px 20px !important;
      background: #0066cc !important;
      color: #fff !important;
      font-size: 1rem !important;
      text-decoration: none !important;
      border-radius: 4px !important;
      font-family: system-ui, sans-serif !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
      transition: left 0.15s ease !important;
    }
    #${SKIP_LINK_ID}:focus {
      left: 8px !important;
      outline: 3px solid #fff !important;
      outline-offset: 2px !important;
    }
  `;

  let enabled = false;
  let keydownListener = null;
  let enhancedElements = [];

  function getMainContent() {
    const root = document.documentElement;
    return (
      root.querySelector("main") ||
      root.querySelector("[role='main']") ||
      root.querySelector("#content") ||
      root.querySelector("#main") ||
      root.querySelector(".main") ||
      root.querySelector("article") ||
      root.querySelector("h1") ||
      document.body
    );
  }

  function createSkipLink() {
    const existing = document.getElementById(SKIP_LINK_ID);
    if (existing) return existing;

    const link = document.createElement("a");
    link.id = SKIP_LINK_ID;
    link.href = "#";
    link.textContent = "Skip to main content";
    link.setAttribute("tabindex", "0");

    link.addEventListener("click", (e) => {
      e.preventDefault();
      const main = getMainContent();
      if (main) {
        main.setAttribute("tabindex", "-1");
        main.focus({ preventScroll: false });
        window.scrollTo(0, 0);
      }
    });

    document.body.insertBefore(link, document.body.firstChild);
    return link;
  }

  function removeSkipLink() {
    const el = document.getElementById(SKIP_LINK_ID);
    if (el) el.remove();
  }

  function isFocusable(el) {
    if (!el || el.nodeType !== 1) return false;
    const tag = el.tagName.toLowerCase();
    if (tag === "a" && el.getAttribute("href")) return true;
    if (["button", "input", "select", "textarea"].indexOf(tag) >= 0) return true;
    const tabindex = el.getAttribute("tabindex");
    if (tabindex !== null && tabindex !== "") return true;
    if (el.getAttribute("contenteditable") === "true") return true;
    return false;
  }

  function findClickableNotFocusable() {
    const candidates = document.querySelectorAll(
      "[onclick], [role='button'], [role='link']"
    );
    const out = [];
    candidates.forEach((el) => {
      if (isFocusable(el)) return;
      if (el.id === SKIP_LINK_ID) return;
      out.push(el);
    });
    return out;
  }

  function enhanceKeyboardNav() {
    enhancedElements = findClickableNotFocusable();
    enhancedElements.forEach((el) => {
      el.setAttribute("tabindex", "0");
      el.setAttribute("data-ease-motor-focusable", "true");
    });

    keydownListener = (e) => {
      if (!enabled) return;
      const target = e.target;
      if (!target || target.getAttribute("data-ease-motor-focusable") !== "true")
        return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        target.click();
      }
    };
    document.addEventListener("keydown", keydownListener, true);
  }

  function unenhanceKeyboardNav() {
    if (keydownListener) {
      document.removeEventListener("keydown", keydownListener, true);
      keydownListener = null;
    }
    enhancedElements.forEach((el) => {
      el.removeAttribute("tabindex");
      el.removeAttribute("data-ease-motor-focusable");
    });
    enhancedElements = [];
  }

  function enable() {
    if (enabled) return;
    enabled = true;

    document.documentElement.classList.add("ease-motor-mode");
    window.__EASE_DOM__.injectStyleTag(STYLE_ID, CSS);
    createSkipLink();
    enhanceKeyboardNav();
  }

  function disable() {
    if (!enabled) return;
    enabled = false;

    document.documentElement.classList.remove("ease-motor-mode");
    window.__EASE_DOM__.removeStyleTag(STYLE_ID);
    removeSkipLink();
    unenhanceKeyboardNav();
  }

  window.__EASE_MODES__ = window.__EASE_MODES__ || {};
  window.__EASE_MODES__.motorMode = { enable, disable };
})();
