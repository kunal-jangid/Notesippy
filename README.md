# Notesippy 📝⚡

A sleek, premium, minimal note-taking mobile application built with **React Native** and **Expo SDK 57**. Designed for speed, utility, and absolute simplicity.

---

## ✨ Features

- **Sleek & Minimal UI**: A beautifully clean interface that supports system Dark and Light modes.
- **Ultra-Fast Local Storage**: Powered by [`react-native-mmkv`](https://github.com/mrousavy/react-native-mmkv) for high-performance, synchronous data reads and writes.
- **Home Screen Android Widgets**: Fully integrated home screen widget using [`react-native-android-widget`](https://github.com/svbutko/react-native-android-widget), displaying your notes grid directly on your Android launcher.
- **Rich Notifications**: Rich, local notifications built on [`@notifee/react-native`](https://notifee.app) for task reminders and alerts.
- **Modern Routing**: Utilizes Expo Router's file-based navigation system under the `src/` directory.

---

## 📂 Project Structure

```text
notesippy/
├── assets/             # Branding assets, icons, and splash screens
├── src/
│   ├── app/            # Expo Router page routes (index, explore, note/[id], widget-select)
│   ├── components/     # Reusable UI components
│   ├── constants/      # App constants (Colors, styles, configurations)
│   ├── hooks/          # Custom React hooks
│   ├── services/       # Core business logic & storage providers (e.g., notesStore.ts)
│   └── widgets/        # React Native Android Widget layouts and entrypoints
├── app.json            # Expo configuration
├── package.json        # Project scripts and dependency declarations
└── tsconfig.json       # TypeScript compiler settings
```

---

## 🚀 Getting Started

### Prerequisites

- Ensure you have **Node.js** and **npm** installed.
- Ensure your environment is configured for React Native / Expo development (JDK, Android SDK/Android Studio for Android, or Xcode for iOS if on macOS).

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Development Server

Start the local Expo bundler:

```bash
npm run start
```

### 3. Run on Emulator / Device

Run directly on your target platform to build and test:

- **Android**:
  ```bash
  npm run android
  ```
- **iOS**:
  ```bash
  npm run ios
  ```

---

## 🧩 Android Widgets Integration

This project configures a custom native Android Widget `NotesGridWidget`. 

- **Custom Native Plugin**: Defined in [`notifee-plugin.js`](file:///D:/projects/notesippy/notifee-plugin.js) and configured under the `plugins` field of [`app.json`](file:///D:/projects/notesippy/app.json).
- **Preview / Selection**: Access the widget configuration through the `/widget-select` screen inside the application.
