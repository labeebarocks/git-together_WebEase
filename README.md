# WebEase

**An adaptive accessibility Chrome extension that makes any webpage easier to use.**  
Toggle modes like high contrast, reading fonts, seizure-safe, focus highlighting, and motor (keyboard) support-per tab.

---

## Features

| Mode | What it does |
|------|----------------|
| **Seizure Safe** | Stops CSS animations and transitions, pauses all video and audio, disables smooth scroll. Turn off to restore. Aligns with WCAG 2.3. |
| **High Contrast** | Black background, white text, cyan links, yellow focus rings. Reduces eye strain and improves readability. |
| **Reading Mode** | Applies a reading-friendly font (OpenDyslexic, Lexend, or Comic Sans), increased line height and letter spacing. Keeps code blocks in monospace. |
| **Focus Mode** | Dims the page and highlights the block under your cursor (paragraph/section). Helps focus on one area (ADHD-friendly). |
| **Motor Accessibility** | Visible focus outlines, “Skip to main content” link, larger click targets (44×44px min), and keyboard activation for clickable elements. |

Modes are **saved per tab**: switch tabs and come back, or refresh the page, and your choices are restored.

---

## Installation

1. Clone or download this repo.
2. Open Chrome and go to **chrome://extensions**.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the **ease-extension** folder.
5. Pin the WebEase icon in the toolbar if you like.

---

## How to use

1. Open any normal webpage (e.g. wikipedia.org, a news site).  
   *(Does not run on chrome://, New Tab, or the Chrome Web Store.)*
2. Click the **WebEase** icon in the toolbar.
3. Turn on any mode with its button; turn it off again to restore the page.
4. Use the **Reading Mode Font** dropdown to pick OpenDyslexic, Lexend, or Comic Sans when Reading Mode is on.

---

## Tech

- **Chrome Extension Manifest V3**
- Content scripts inject styles and a skip link; no remote APIs
- Per-tab state stored in `chrome.storage.local`; background script serves state so modes re-apply after reload

---

## Project structure

```
WebEase/
├── ease-extension/
│   ├── manifest.json
│   ├── popup.html, popup.js, popup.css
│   ├── background.js
│   ├── content/
│   │   ├── contentScript.js      # message handling + reapply state
│   │   ├── utils/dom.js          # inject/remove style tags
│   │   └── modes/
│   │       ├── contrastMode.js
│   │       ├── readingMode.js
│   │       ├── seizureSafe.js
│   │       ├── focusMode.js
│   │       └── motorMode.js
│   ├── content/assets/           # reading fonts (woff2/ttf)
│   ├── icons/
│   └── styles.css
└── README.md
```

---

## Credits

Built for **HackED 2026** - DivE 
