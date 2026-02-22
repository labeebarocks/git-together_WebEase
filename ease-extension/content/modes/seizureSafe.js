(() => {
  const STYLE_ID = "ease-seizure-safe-style";

  const CSS = `
    * {
      animation: none !important;
      transition: none !important;
      scroll-behavior: auto !important;
    }

    video, audio {
      animation: none !important;
    }
  `;

  let pausedMedia = [];

  function enable() {
    // 1. Stop animations
    window.__EASE_DOM__.injectStyleTag(STYLE_ID, CSS);

    // 2. Pause all videos/audio
    pausedMedia = [];
    document.querySelectorAll("video, audio").forEach((media) => {
      if (!media.paused) {
        media.pause();
        pausedMedia.push(media);
      }
    });
  }

  function disable() {
    // 1. Restore animations
    window.__EASE_DOM__.removeStyleTag(STYLE_ID);

    // 2. Resume only what we paused
    pausedMedia.forEach((media) => {
      try {
        media.play();
      } catch (e) {}
    });

    pausedMedia = [];
  }

  // Register mode
  window.__EASE_MODES__ = window.__EASE_MODES__ || {};
  window.__EASE_MODES__.seizureSafe = { enable, disable };
})();