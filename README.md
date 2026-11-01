# 📺 Teleprompter App

> A simple, responsive web-based teleprompter for public speakers, presenters, and content creators. Perfect for PC, tablets, phones, and other screen ratios / sizes.

Note: 99% of the content in this repo was written by Copilot.

---

## ✨ Features

- **📝 Direct Text Editing** - Edit your script directly on the main screen with contenteditable interface
- **📺 Adjustable Text Display** - Font size from 18px to 160px for optimal readability
- **🔤 Multiple Font Families** - Choose between Verdana, Georgia, and Arial for screen optimization
- **⚙️ Smart Auto-Scroll** - Smooth, adjustable scrolling from 0-5 with 0.25 increments
- **📐 Text Alignment Controls** - Toggle between center and left alignment
- **↔️ Horizontal Mirror** - Flip text left-right for teleprompter mirrors and reflectors
- **⬍ Vertical Mirror** - Flip text up-down for specialized displays
- **🎨 Padding Control** - Adjust viewport margins (0-200px) for perfect framing
- **💾 Automatic Persistence** - All settings and content saved to browser localStorage
- **📱 Fully Responsive** - Optimized for iPad Pro 11", tablets, and mobile devices
- **🔌 Offline Support** - Progressive Web App with service worker for offline access
- **⌨️ Keyboard Shortcuts** - Quick control without touching screen
- **🎯 PWA Installation** - Add to home screen on iOS/Android for native app feel

---

## 🚀 Getting Started

### Quick Start

1. **Visit the app**: Open the app in your browser [https://tp.pa55er6y.com](https://tp.pa55er6y.com)
2. **Enter your script**: Click on the text area and paste or type your script
3. **Adjust settings**: Use the control buttons to customize font size, speed, alignment, and fonts
4. **Start scrolling**: Click ▶️ or press Spacebar to begin auto-scrolling
5. **Your settings are saved**: Everything persists automatically to localStorage

### Add to iPad Home Screen

For a native app-like experience on iPad:

1. Open Safari and navigate to the app URL
2. Tap the **Share** button
3. Select **"Add to Home Screen"**
4. Name it "Teleprompter" and tap **"Add"**
5. The app opens fullscreen like a native application

---

## Full screen and keeping the screen awake

- Tap **Full screen** to hide Safari's address and tab bars while reading. Tap **Exit full screen** to return. Safari on iPad supports the standard Fullscreen API from iPadOS 16.4. If the browser cannot enter fullscreen, the app shows instructions for opening it from the Home Screen instead.
- The script scrolls inside a fixed panel, so Safari's usual page-scroll bar collapsing can behave differently. Full screen explicitly requests the extra space. The app also uses dynamic viewport height to fit when Safari's visible area changes.
- The app automatically requests that the screen stay awake while its tab is visible, including during pauses and manual reading. **Screen awake** means that the device granted the request. Tap it to allow normal sleep; tap **Keep awake** to enable it again.
- The wake lock is released when the page is hidden or left, and requested again when you return, unless you turned it off. The device can decline or release the lock, for example in power-saving conditions; **Retry keep awake** means that the screen may sleep.
- Wake locks require HTTPS and browser support. Safari added this API in iPadOS 16.4; support in Home Screen web apps arrived later, in iPadOS 18.4. Unsupported browsers show **Keep awake unavailable**. These controls do not change the iPad's Auto-Lock setting.

To test on your iPad, open the updated main page in Safari, tap **Full screen**, check that **Screen awake** appears, and leave it untouched for longer than your normal Auto-Lock interval. Switch to another tab or app and return: the wake lock should be requested again. Actual Safari browser-bar and physical screen-lock behavior must be checked on the iPad; local tests verify API handling and layout.

## Follow my voice

On the main teleprompter page, tap **Follow my voice**, allow microphone and speech access, and read your English script aloud. Your current word is highlighted and kept near the green reading marker. Recognition uses the same matching logic as the Voice test page, including interim results as they arrive; a short recognition delay is normal.

- Tap **Stop listening**, the **Pause** button, or press **Escape** to stop and resume editing. Your original text and formatting are restored.
- To change your reading position, tap the desired word while voice following is active, then tap **Follow my voice** again.
- Voice following and fixed-speed scrolling run one at a time. The speed slider controls fixed-speed scrolling.
- Voice following stops at the end of the script and when you leave or hide the page. It never starts the microphone automatically when opening or reloading the app.
- Use Safari over HTTPS on iPad. The recognizer uses your browser's English locale, falling back to Australian English when your browser locale is not English. The **Voice test** page remains available for recognition diagnostics and dialect selection.

## Voice-following test (experimental)

The separate [Voice test page](voice-test.html) is preloaded with the password-storage paragraph. It listens for English speech, matches recent phrases against the script, highlights the current word, and scrolls to keep your place visible. It does not replace your saved teleprompter script.

### Test on an iPad

1. Serve these updated files on an **HTTPS** website, then open `voice-test.html` in Safari. A plain HTTP address on your home network is insufficient for microphone access. Start in Safari before trying a Home Screen shortcut.
2. Choose your English dialect and a readable text size. Tap **Follow my voice** and allow microphone and speech access. If Safari cannot start recognition, check that Siri is enabled.
3. Read “Have you ever wondered how passwords are stored on the server?” and pause for five seconds. The highlight and scrolling should hold after any brief scrolling animation finishes.
4. Continue with “In this video…” slowly, then speed up. Your current phrase should remain visible near the green marker once scrolling is needed. Scrolling starts only when the text reaches the marker.
5. Say “I am taking a quick break from the script.” The reading position should hold. Return to the next sentence and check that tracking resumes.
6. Finish the paragraph. Inspect **What the iPad hears**, especially the words “hashing”, “salts”, and “peppers”. Listening stops at the end of the script.
7. To recover manually, tap **Stop listening**, tap the word you want to read next, then tap **Follow my voice**. **Back to start** stops listening and resets the test.
8. Repeat with your normal teleprompter, speaking distance, and microphone. Then use **Use another script** for a five-minute test, including long pauses. Check that returning from another app requires an explicit tap to resume listening.

If testing fails, report the iPad/iPadOS version, status message, recognised phrase, and highlighted word. Recognition accuracy and session continuity still need testing on the actual iPad; desktop tests use simulated recognition results. No separate speech-provider account or API key is required for this prototype.

### Local checks

Run `node --test tests/voice-matcher.test.mjs` with Node.js 20 or newer. For a desktop microphone test, run `python -m http.server 8000 --bind 127.0.0.1` and open `http://localhost:8000/voice-test.html` in a browser that supports speech recognition. This loopback address is for the same computer; use HTTPS hosting for an iPad test.

---

## 🎮 Controls

### Button Controls (Top Bar)

| Button | Function |
|--------|----------|
| **Align** | Toggle between center and left text alignment | 
| **Flip H** | Mirror text horizontally (left-right) | 
| **Flip V** | Mirror text vertically (up-down) | 
| **Font** | Cycle through Verdana → Georgia → Arial | 
| **Play** | Start automatic scrolling | 
| **Pause** | Stop automatic scrolling | 
| **Full screen** | Hide browser bars; tap again to exit |
| **Screen awake / Keep awake** | Show and control screen wake-lock status |
| **Reset** | Clear content and restore default settings | 

### Adjustment Controls

| Control | Range | Use Case |
|---------|-------|----------|
| **Size** | 18–160px | Adjust font size for visibility (48–56px recommended for iPad Pro 11") |
| **Scroll Speed** | 0–5 (0.25 increments) | Control auto-scroll pace (1.5–2.5 typical for speech) |
| **Padding** | 0–200px | Add margins around text for better framing |

### ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Spacebar** | Toggle auto-scroll on/off |
| **A** | Toggle left/center alignment |
| **H** | Toggle horizontal flip |
| **V** | Toggle vertical flip |
| **↑/↓ Arrows** | Manual scroll up/down |

---

## 💾 Data Storage

- **All settings are saved automatically** to your browser's `localStorage`
- **Persisted data includes:**
  - Script text content
  - Font size preference
  - Selected font family (Verdana, Georgia, or Arial)
  - Text alignment (center/left)
  - Horizontal and vertical flip states
  - Scroll speed setting
  - Padding/margin value
  - Auto-scroll playback state

**⚠️ Important:** Data is stored per browser/device. Clearing browser cache/cookies will erase saved content. Export your scripts if you need backup.

---

## 🌐 Browser Support

| Browser | Desktop | iOS | Android |
|---------|---------|-----|---------|
| **Safari** | ✅ | ✅ | • |
| **Chrome** | ✅ | ✅ | ✅ |
| **Firefox** | ✅ | ✅ | ✅ |
| **Edge** | ✅ | ✅ | ✅ |

**Requirements:**
- Modern browser with ES6 JavaScript support
- localStorage API
- Service Workers (for offline support)
- CSS Flexbox/Grid

---

## 🛠️ Technology Stack

- **Frontend:** Vanilla ES6 JavaScript, HTML5, CSS3
- **Storage:** Browser localStorage API
- **PWA:** Service Worker (sw.js) + Web Manifest (manifest.json)
- **Icons:** SVG/Unicode emoji controls
- **Fonts:** Web-safe system fonts (Verdana, Georgia, Arial)

---

## 📋 Project Structure

```
teleprompter/
├── index.html          # Main app HTML structure
├── styles.css          # Styling and responsive design
├── script.js           # JavaScript logic and state management
├── manifest.json       # PWA configuration
├── sw.js              # Service worker for offline support
├── README.md          # This file
└── LICENSE            # MIT License
```

---

## 💡 Pro Tips

1. **iPad Landscape Mode** - Lock screen orientation for consistent layout during presentations
2. **Text Framing** - Use the Padding control to frame your text optimally
3. **Font Selection** - 
   - **Verdana**: Modern, clear on bright screens
   - **Georgia**: Serif elegance for formal presentations
   - **Arial**: Classic, highly readable sans-serif
4. **Scroll Speed** - Test your scroll speed during rehearsal; 1.5–2.5 is typical for natural speech
5. **Mirror Mode** - Combine H and V flips for specialized teleprompter glass or reflector setups
6. **Fullscreen** - Use browser fullscreen mode (F11) or iPad app mode for distraction-free presenting
7. **Direct Editing** - Edit your script live without switching modes; just click and type

---

## 🔒 Privacy

The following applies with voice following turned off. **Follow my voice** and the optional Voice test page use your browser's speech recognition, which may send microphone audio to the browser's speech service. This app does not record or store that audio or the recognised transcript. Voice following asks you to start listening explicitly, and stops when you leave or hide the page.

✅ **Your data stays private:**
- All information is stored **only on your device** in localStorage
- **No data is sent** to any remote server
- **No analytics or tracking**
- **No cookies** or external services
- **100% offline capable** with PWA service worker

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

You are free to use, modify, and distribute this software for personal or commercial purposes.

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome! Feel free to:
1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📧 Support

For questions, issues, or feature requests, please open an issue on GitHub.

---

**Made with ❤️ for speakers, presenters, and content creators.**
