# Automate AI — Cross-Platform Build, Signing & Release Guide

This repository builds **Automate AI** as a native mobile and desktop application across **Android**, **iOS (iPhone & iPad)**, **Windows**, **macOS**, and **Linux** while preserving the full Liquid Glass interface, Firebase Authentication, Firestore profile persistence, multi-model streaming chat, autonomous agents, scheduled tasks, and live audio/vision capabilities.

---

## 1. Platform Architecture Overview

| Platform | Runtime Stack | Output Formats | Configuration Files |
|---|---|---|---|
| **Android** | Capacitor 8 + Native WebView + Plugins (`Haptics`, `StatusBar`, `Keyboard`, `Network`, `LocalNotifications`, `App`) | `.apk`, `.aab` (Play Store) | `capacitor.config.ts`, `src/utils/platform.ts` |
| **iOS (iPhone & iPad)** | Capacitor 8 + WKWebView + Safe Area insets + Plugins | Xcode `.xcarchive`, App Store / TestFlight `.ipa` | `capacitor.config.ts`, `index.html`, `src/index.css` |
| **Windows** | Electron 45 + Embedded Static Origin + Cloud API Proxy | `.exe` (NSIS), `.msi` | `electron/main.cjs`, `electron/preload.cjs`, `electron-builder.yml` |
| **macOS** | Electron 45 Universal (`arm64` + `x64`) + Vibrancy / Hardened Runtime | `.dmg`, `.pkg` | `electron/main.cjs`, `electron/entitlements.mac.plist`, `electron-builder.yml` |
| **Linux** | Electron 45 (`x64`) + Tray & Native Notifications | `.AppImage`, `.deb`, `.rpm` | `electron/main.cjs`, `electron-builder.yml` |

### Why Electron Proxies `/api/*` Locally
Desktop builds serve `dist/` on an ephemeral localhost port (`http://127.0.0.1:<port>`) and proxy `/api/*` requests directly inside Node (`electron/main.cjs`) to `AUTOMATE_API_BASE_URL`. This preserves clean same-origin requests, Firebase OAuth popup authentication, and full Gemini / Live Audio streaming with zero CORS friction.

Mobile Capacitor builds route `/api/*` calls via `apiUrl()` (`src/utils/platform.ts`) directly to `VITE_API_BASE_URL`.

---

## 2. Automated Multi-OS Release Pipeline (GitHub Actions)

Workflow file: `.github/workflows/release-cross-platform.yml`

### Triggering a Cross-Platform Release
1. **By Git Tag** (recommended):
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. **Manual Dispatch**:
   Go to **GitHub Repository -> Actions -> Build and Release Automate AI Cross-Platform -> Run workflow**, enter a version such as `v1.0.0`, and click **Run workflow**.

The pipeline runs native builds across `ubuntu-latest`, `windows-latest`, and `macos-latest` runners, generates `SHA256SUMS.txt`, and publishes a GitHub Release with a structured multi-platform download matrix.

> Note: `.github/workflows/build-apk.yml` remains intact and continues producing quick Android debug APKs on every push to `main`.

---

## 3. GitHub Secrets Reference (Optional Signing & Store Distribution)

Without signing secrets, the CI pipeline still builds an installable Android debug `.apk`, unsigned Android `.aab`, unsigned iOS `.xcarchive` verification archive, Windows `.exe`/`.msi`, macOS universal `.dmg`/`.pkg`, and Linux `.AppImage`/`.deb`/`.rpm`. Configure the secrets below in **Repository Settings -> Secrets and variables -> Actions** for production store-signed artifacts:

| Platform | Secret Name | Purpose |
|---|---|---|
| **Android** | `ANDROID_KEYSTORE_BASE64` | Base64-encoded `.jks` upload/release keystore (`base64 -w 0 release.jks`) |
| **Android** | `ANDROID_KEYSTORE_PASS` | Keystore store password |
| **Android** | `ANDROID_KEY_ALIAS` | Signing key alias inside keystore |
| **Android** | `ANDROID_KEY_PASS` | Key password (defaults to `ANDROID_KEYSTORE_PASS`) |
| **iOS** | `IOS_CERTIFICATE_BASE64` | Base64-encoded Apple Distribution `.p12` certificate |
| **iOS** | `IOS_CERTIFICATE_PASSWORD` | Password for the `.p12` file |
| **iOS** | `IOS_PROVISIONING_PROFILE_BASE64` | Base64-encoded App Store / Ad-Hoc `.mobileprovision` profile |
| **iOS / macOS** | `APPLE_TEAM_ID` | 10-character Apple Developer Team ID |
| **macOS** | `MAC_CSC_LINK` | Base64 Developer ID Application `.p12` certificate |
| **macOS** | `MAC_CSC_KEY_PASSWORD` | Password for `MAC_CSC_LINK` |
| **macOS** | `APPLE_ID` | Apple ID email for macOS notarization |
| **macOS** | `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password generated in `appleid.apple.com` |
| **Windows** | `WIN_CSC_LINK` | Base64 Authenticode code-signing `.pfx` certificate |
| **Windows** | `WIN_CSC_KEY_PASSWORD` | Password for `WIN_CSC_LINK` |

---

## 4. Building Locally on Your Machine

### Prerequisites
- Node.js 22+
- Install dependencies:
  ```bash
  npm install --legacy-peer-deps
  ```
- Generate application icons (`.ico`, `.icns`, `.png`):
  ```bash
  npm run build:icons
  ```

### Windows (`.exe` & `.msi`)
Run on Windows:
```bash
npm run build
npm run build:icons
npx electron-builder --config electron-builder.yml --win nsis msi --x64 --publish never
```
Outputs appear inside `release/`.

### macOS (`.dmg` & `.pkg` Universal)
Run on macOS:
```bash
npm run build
npm run build:icons
npx electron-builder --config electron-builder.yml --mac dmg pkg --universal --publish never
```
Outputs appear inside `release/`.

### Linux (`.AppImage`, `.deb`, `.rpm`)
Run on Ubuntu/Debian (with `rpm` installed via `sudo apt-get install -y rpm`):
```bash
npm run build
npm run build:icons
npx electron-builder --config electron-builder.yml --linux AppImage deb rpm --x64 --publish never
```

### Android (`.apk` & Play Store `.aab`)
Requires **Java 21 (Temurin)** and **Android SDK**:
```bash
npm run build
npx cap add android   # first time only
npx cap sync android
cd android
./gradlew assembleRelease bundleRelease
```
- Direct APK: `android/app/build/outputs/apk/release/app-release.apk` (or `debug/app-debug.apk`)
- Play Store AAB: `android/app/build/outputs/bundle/release/app-release.aab`

### iOS (iPhone & iPad — TestFlight / App Store)
Requires **macOS + Xcode + CocoaPods**:
```bash
npm run build
npx cap add ios       # first time only
npx cap sync ios
npx cap open ios
```
Inside Xcode:
1. Select your **Team** and **Bundle Identifier** (`com.automateai.app`) under **Signing & Capabilities**.
2. Set destination to **Any iOS Device (arm64)**.
3. Choose **Product -> Archive -> Distribute App -> App Store Connect** (for TestFlight & App Store).

---

## 5. End-User Installation Guide

- **Android (`.apk`)**: Download from the in-app **Download Center** or **GitHub Releases**, tap the `.apk`, and allow installation from your browser/files app if prompted.
- **Google Play Store (`.aab`)**: Upload the signed `.aab` in Google Play Console under Production or Internal Testing.
- **iPhone & iPad (iOS)**: Install via **TestFlight** or the **App Store** once distributed via Apple App Store Connect.
- **Windows (`.exe` / `.msi`)**: Run `Automate-AI-Windows-<version>-x64.exe` (wizard with desktop shortcut & Windows Add/Remove Programs uninstaller) or `Automate-AI-Windows-<version>-x64.msi`.
- **macOS (`.dmg` / `.pkg`)**: Open `Automate-AI-macOS-<version>-universal.dmg` and drag **Automate AI** into **Applications**, or run the `.pkg` installer.
- **Linux**:
  - `.AppImage`: `chmod +x Automate-AI-Linux-*.AppImage && ./Automate-AI-Linux-*.AppImage`
  - `.deb` (Ubuntu/Debian): `sudo apt install ./Automate-AI-Linux-*.deb`
  - `.rpm` (Fedora/RHEL): `sudo dnf install ./Automate-AI-Linux-*.rpm`
