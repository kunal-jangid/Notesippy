# Notesippy 📝⚡

A sleek, premium, minimal note-taking mobile application built with **React Native** and **Expo SDK 57**. Designed for speed, glanceable utility, and absolute simplicity. 

Notesippy integrates native Android features, including interactive home screen widgets, persistent foreground service status bar countdowns, and specialized compatibility for Samsung's One UI Lock Screen / Now Bar live capsules.

---

## ✨ Features

- **Sleek & Minimal UI**: A beautifully clean, gesture-driven interface designed for frictionless quick notes, supporting system Dark and Light modes.
- **Ultra-Fast Local Storage**: Powered by [`react-native-mmkv`](https://github.com/mrousavy/react-native-mmkv) for high-performance, synchronous data reads and writes.
- **Home Screen Grid Widgets**: Fully integrated home screen widgets built with [`react-native-android-widget`](https://github.com/svbutko/react-native-android-widget), displaying your notes grid directly on your launcher.
- **Live Lock Screen Capsules**: A custom native Android foreground service (`NowBarService`) with Android 15/16 promoted ongoing notification parameters, showing real-time countdown timers directly on your lock screen and Samsung's Now Bar.
- **Auto-Tear Down Timer**: Persistent live notification cards automatically stop their foreground service and update the app's database state to clean up once the countdown timer reaches zero.
- **Clean Architecture**: Designed with decoupled native configuration modules, keeping whitelisted metadata out of source control.

---

## 🛠️ Tech Stack

* **Framework**: React Native (Expo SDK 57)
* **Navigation**: Expo Router (File-based routing)
* **Local Database**: Tencent MMKV (`react-native-mmkv`)
* **Notifications**: Notifee & Custom Android Service (`NowBarService`)
* **Widget Engine**: RemoteViews via `react-native-android-widget`
* **Development Language**: TypeScript & Kotlin/Java

---

## 📂 Project Structure

```text
notesippy/
├── .github/workflows/  # CI/CD deployment pipelines (GitHub Actions)
├── assets/             # Branding assets, icons, and splash screens
├── src/
│   ├── app/            # Expo Router page routes (index, note/[id], widget-select)
│   ├── components/     # Reusable UI components
│   ├── constants/      # App constants (Colors, styles, configurations)
│   ├── services/       # Core business logic & storage providers (e.g., notesStore.ts, notificationService.ts)
│   └── widgets/        # React Native Android Widget layouts and entrypoints
├── app.config.js       # Dynamic Expo project configuration
├── notifee-plugin.js   # Local Expo config plugin for native dependency & file injection
├── package.json        # Project scripts and dependency declarations
└── tsconfig.json       # TypeScript compiler settings
```

---

## 🚀 Getting Started

### Prerequisites

- Ensure you have **Node.js** and **npm** installed.
- Ensure your environment is configured for React Native / Expo development (JDK 17+, Android SDK/Android Studio, or Xcode if developing for iOS on macOS).

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Development Server

Start the local Expo bundler:

```bash
npm run start
```

### 3. Build & Run on Emulator / Device

Run directly on your target platform to trigger native prebuild and compilation:

- **Android (USB Debugging / Emulator)**:
  ```bash
  npm run android
  ```
- **iOS (Simulator / Device)**:
  ```bash
  npm run ios
  ```

---

## 🔐 CI/CD & Production Release Workflow

Notesippy supports dynamic package name overriding during compilation to facilitate vendor-specific release configurations (e.g., Samsung Galaxy Store Now Bar whitelists) without polluting the main codebase with restricted identifiers.

### Environment Variable Injection
The configuration is handled dynamically in [`app.config.js`](file:///D:/projects/notesippy/app.config.js):

```javascript
package: process.env.ANDROID_PACKAGE_NAME || "com.kunaljangid2k3.notesippy"
```

To build locally with a specific target package identifier, run:
```bash
$env:ANDROID_PACKAGE_NAME="your.package.identifier"; npx expo prebuild --platform android --clean && npm run android
```

### GitHub Actions Secrets Setup
For automated releases, configure your secret values in your GitHub repository:
1. Navigate to **Settings > Secrets and variables > Actions**.
2. Create a new repository secret:
   * **Name**: `ANDROID_PACKAGE_NAME`
   * **Value**: `com.package.name` (Note: **Do not include quotes** in the text field).
3. The Automated Release workflow ([`release.yml`](file:///D:/projects/notesippy/.github/workflows/release.yml)) will automatically pick up this secret, compile the signed production APK, update the package versions, and release the binary.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](file:///D:/projects/notesippy/LICENSE) file for details.
