# ZenStudy • Minimal Android-Style Study Planner & Timetable

A minimal, light solid-coloured, clean study companion designed with an Android app aesthetic. Features offline Progressive Web App (PWA) installation to your phone or desktop home screen.

---

## ✨ Features

1. **Customizable To-Do List with Months & Years**:
   - Organize and filter study tasks by **Year** and **Month**.
   - Quick chips: `Today`, `Upcoming`, `High Priority`, `Completed`.
   - Priority badges: Low (Calm Sage), Medium (Warm Amber), High (Soft Rose).
   - Subject tags (Mathematics, Physics, Chemistry, History, etc.) with custom tags.
   - Subtasks / Checklist items with progress counter.
   - Instant search bar.

2. **Weekly Timetable & Live Session Tracker**:
   - Class and study slot scheduler for Monday through Sunday.
   - **Live Study Status Banner**: Automatically detects what class or revision session is happening right now in real time, or what is coming up next.
   - Room, teacher, and subject color labels.

3. **Background Selector (Folder + Minimal Solid Colors)**:
   - **Workspace Folder Backgrounds**: Seamlessly select from all the wallpapers placed in the `background/` folder.
   - **Minimal Solid Colours**: Clean distraction-free solid palettes (Pure White, Warm Linen, Sage Matcha, Pale Sky, Soft Lilac, Sand Oat, Night Charcoal).
   - **Custom Upload**: Upload your own wallpaper from device storage.
   - **Background Contrast Slider**: Fine-tune backdrop overlay opacity so task cards always remain 100% legible.

4. **Focus Pomodoro Timer**:
   - 25m Focus, 5m Short Break, 15m Long Break (adjustable intervals).
   - Minimalist circular progress ring with digital clock.
   - Offline synthesizer chime upon completion (built via Web Audio API, no internet required).

5. **Ambient Study Audio**:
   - Built-in soothing soundscapes: 🌧️ Gentle Rain, 🍃 Soft Breeze, 📚 Quiet Library.
   - Volume control and quick toggle from the top bar.

6. **Study Scratchpad / Notes**:
   - Auto-saving memo pad for formulas, ideas, and lecture notes.
   - Word count & character count with instant clipboard copy.

7. **Download to Home Screen (PWA)**:
   - Web App Manifest + Service Worker for 100% offline usage.
   - Native Android install prompt integration (`beforeinstallprompt`).

---

## 🚀 How to Run & Download to Android Home Screen

### Option 1: Quick Launch (Windows PC)
1. Double-click [run-app.bat](file:///c:/Users/pc/new%20app/to%20do/run-app.bat) to start the local server.
2. Open `http://localhost:3000` in your browser.

### Option 2: Download / Install onto your Android Phone
1. Ensure your phone and PC are connected to the same Wi-Fi network.
2. Run `run-app.bat` on your PC. It will display an address such as:
   ```
   http://192.168.x.x:3000
   ```
3. On your Android phone, open Chrome and type that URL.
4. Tap the **"Install"** button in the top bar, or tap Chrome's three dots (`⋮`) and select **"Add to Home screen"** or **"Install app"**.
5. ZenStudy will now appear as an icon on your Android home screen and open as a fullscreen native app!
