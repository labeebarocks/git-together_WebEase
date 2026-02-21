(() => {
  const STYLE_ID = "ease-focus-mode-style";
  const BLOCK_CLASS = "ease-focus-block";
  const DIM_CLASS = "ease-focus-dim";
  const ACTIVE_CLASS = "ease-focus-active";

  const CSS = `
    .${BLOCK_CLASS}.${DIM_CLASS} {
      opacity: 0.22 !important;
      transition: opacity 120ms ease !important;
    }

    .${BLOCK_CLASS}.${ACTIVE_CLASS} {
      opacity: 1 !important;
      background: rgba(196, 167, 255, 0.22) !important;
      outline: 2px solid rgba(176, 132, 255, 0.9) !important;
      outline-offset: 2px !important;
      border-radius: 6px !important;
    }

    /* Keep links inside active block readable */
    .${BLOCK_CLASS}.${ACTIVE_CLASS} a,
    .${BLOCK_CLASS}.${ACTIVE_CLASS} a * {
      opacity: 1 !important;
      text-decoration: underline !important;
    }
  `;

  let enabled = false;
  let blocks = [];
  let lastActive = null;
  let rafPending = false;
  const MIN_TEXT_LENGTH = 60;

  function isVisible(el) {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const cs = window.getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") return false;
    return true;
  }

  function isInIgnoredArea(el) {
    // avoid nav/menus/footers/sidebars
    return Boolean(
      el.closest(
        "nav, header, footer, aside, [role='navigation'], [role='banner'], [role='contentinfo']"
      )
    );
  }

  function getRoot() {
    // Works well on Wikipedia + generic sites
    return (
      document.querySelector("#mw-content-text") ||
      document.querySelector("main") ||
      document.body
    );
  }

  function collectBlocks() {
    const root = getRoot();

    const candidates = root.querySelectorAll(
      "p, li, blockquote, h1, h2, h3, h4, h5, h6, pre, article, section, div"
    );

    const out = [];
    candidates.forEach((el) => {
      if (isInIgnoredArea(el)) return;
      if (!isVisible(el)) return;

      const text = (el.innerText || "").trim();
      // Filter out tiny fragments like menu items
      if (text.length < MIN_TEXT_LENGTH) return;

      if (el.matches("div, section")) {
        const hasTooManyChildren = el.children.length > 10;
        const hasNestedBlocks = el.querySelector("p, li, blockquote, pre, h1, h2, h3, h4, h5, h6");
        if (hasTooManyChildren || hasNestedBlocks) return;
      }

      el.classList.add(BLOCK_CLASS);
      out.push(el);
    });

    if (!out.length) {
      const fallback = root.querySelector("pre") || root.querySelector("article") || root;
      if (fallback && isVisible(fallback)) {
        fallback.classList.add(BLOCK_CLASS);
        out.push(fallback);
      }
    }

    // Dim them by default
    out.forEach((el) => {
      el.classList.add(DIM_CLASS);
      el.classList.remove(ACTIVE_CLASS);
    });

    return out;
  }

  function setActive(el) {
    if (!el || el === lastActive) return;

    if (lastActive) {
      lastActive.classList.remove(ACTIVE_CLASS);
      lastActive.classList.add(DIM_CLASS);
    }

    el.classList.remove(DIM_CLASS);
    el.classList.add(ACTIVE_CLASS);
    lastActive = el;
  }

  function findBlockFromPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    if (el) {
      const tagged = el.closest?.(`.${BLOCK_CLASS}`);
      if (tagged) return tagged;
    }

    if (!blocks.length) return null;

    let nearest = null;
    let nearestDist = Infinity;

    for (const block of blocks) {
      if (!block.isConnected || !isVisible(block)) continue;
      const rect = block.getBoundingClientRect();
      const dx = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
      const dy = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
      const dist = dx * dx + dy * dy;
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = block;
      }
    }

    return nearest;
  }

  function updateFromMouse(e) {
    if (!enabled) return;
    if (rafPending) return;
    rafPending = true;

    const x = e.clientX;
    const y = e.clientY;

    requestAnimationFrame(() => {
      rafPending = false;
      if (!enabled) return;

      const block = findBlockFromPoint(x, y);
      if (block) {
        setActive(block);
      }
    });
  }

  function updateFromScroll() {
    // Optional: if user is scrolling without moving mouse,
    // keep focus near the center of the screen.
    if (!enabled) return;
    if (rafPending) return;
    rafPending = true;

    requestAnimationFrame(() => {
      rafPending = false;
      if (!enabled) return;
      if (!blocks.length) return;

      const targetY = window.innerHeight * 0.35;
      let best = null;
      let bestDist = Infinity;

      for (const b of blocks) {
        const r = b.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) continue;
        const center = (r.top + r.bottom) / 2;
        const dist = Math.abs(center - targetY);
        if (dist < bestDist) {
          bestDist = dist;
          best = b;
        }
      }

      if (best) setActive(best);
    });
  }

  function enable() {
    if (enabled) return;
    enabled = true;

    window.__EASE_DOM__.injectStyleTag(STYLE_ID, CSS);
    blocks = collectBlocks();

    document.addEventListener("mousemove", updateFromMouse, true);
    window.addEventListener("scroll", updateFromScroll, { passive: true });

    // Set an initial active block so it looks like it works immediately
    updateFromScroll();
  }

  function disable() {
    if (!enabled) return;
    enabled = false;

    document.removeEventListener("mousemove", updateFromMouse, true);
    window.removeEventListener("scroll", updateFromScroll);

    // Clean up classes
    if (lastActive) {
      lastActive.classList.remove(ACTIVE_CLASS);
      lastActive.classList.add(DIM_CLASS);
      lastActive = null;
    }

    blocks.forEach((el) => {
      el.classList.remove(BLOCK_CLASS, DIM_CLASS, ACTIVE_CLASS);
    });
    blocks = [];

    window.__EASE_DOM__.removeStyleTag(STYLE_ID);
  }

  window.__EASE_MODES__ = window.__EASE_MODES__ || {};
  window.__EASE_MODES__.focusMode = { enable, disable };
})();