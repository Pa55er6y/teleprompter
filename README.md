# 📺 Teleprompter App

> A simple, responsive web-based teleprompter for public speakers, presenters, and content creators. Perfect for PC, tablets, phones, and other screen ratios / sizes.

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

### Installation

Simply clone this repository and open it in a web browser:

```bash
git clone https://github.com/yourusername/teleprompter.git
cd teleprompter
```

Then open `index.html` in your browser, or serve with a local HTTP server:

```bash
# Python 3
python -m http.server 8000

# Node.js (with npx)
npx http-server
```

### Quick Start

1. **Visit the app**: Open your browser to `index.html` (or `http://localhost:8000`)
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

## 🎮 Controls

### Button Controls (Top Bar)

| Button | Function | Icon |
|--------|----------|------|
| **Align** | Toggle between center and left text alignment | ⬅️/➡️ |
| **Flip H** | Mirror text horizontally (left-right) | ↔️ |
| **Flip V** | Mirror text vertically (up-down) | ⬍ |
| **Font** | Cycle through Verdana → Georgia → Arial | Ⓐ |
| **Play** | Start automatic scrolling | ▶️ |
| **Pause** | Stop automatic scrolling | ⏸️ |
| **Reset** | Clear content and restore default settings | 🔄 |

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
