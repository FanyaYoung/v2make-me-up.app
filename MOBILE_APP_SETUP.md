# Mobile App Setup (Android + iOS)

This project uses Capacitor to wrap the web app as native mobile apps.

## 1. Prerequisites

- Node.js + npm
- Android Studio (installed)
- Xcode (for iOS builds/submission)
- Apple Developer account
- Google Play Console account

## 2. One-time setup

From project root:

```bash
npm i
npm run mobile:sync
```

This builds the web app and syncs it to both `android/` and `ios/`.

## 3. Run in Android Studio

```bash
npm run android:open
```

In Android Studio:

1. Let Gradle sync finish.
2. Select `app` run target.
3. Run on emulator or connected device.

## 4. Run in Xcode

```bash
npm run ios:open
```

In Xcode:

1. Select `App` target.
2. Set your Team in Signing & Capabilities.
3. Run on simulator or physical device.

## 5. Day-to-day update workflow

Any time web code changes:

```bash
npm run mobile:sync
```

Then reopen Android Studio/Xcode and rebuild.

## 6. Android release (Google Play)

1. Create the keystore once if you do not already have it:

```bash
mkdir -p /Users/fanyayoung/keystores
keytool -genkeypair -v \
  -keystore /Users/fanyayoung/keystores/makemeup-release.jks \
  -alias makemeup \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

2. Create `android/key.properties` from `android/key.properties.example` and fill in the real passwords.
3. Build a release bundle in Android Studio or with Gradle.

If you build from Terminal on this machine, set Java first:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
```

Then build:

```bash
cd android
./gradlew bundleRelease
```

Expected output bundle:

```bash
android/app/build/outputs/bundle/release/app-release.aab
```
4. Upload the generated `.aab` in Google Play Console -> Production/Testing release.
5. Complete store listing, content rating, privacy policy URL, and submit.

## 7. iOS release (App Store)

1. Open project in Xcode (`npm run ios:open`).
2. Set Team under Signing & Capabilities.
3. Confirm Bundle Identifier is `com.makemeup.app` or update it before release.
4. Set Version (`MARKETING_VERSION`) and Build (`CURRENT_PROJECT_VERSION`).
5. Choose `Any iOS Device (arm64)` or a physical device target.
6. `Product` -> `Archive`.
7. Upload via Organizer to App Store Connect.
8. In App Store Connect, complete listing, screenshots, privacy details, and submit for review.

## 8. App IDs and naming in this project

- App ID: `com.makemeup.app`
- App Name: `Make Me Up`
- Android version: `versionName "1.0"` / `versionCode 1`
- iOS version: `MARKETING_VERSION = 1.0` / `CURRENT_PROJECT_VERSION = 1`
- Config file: `capacitor.config.ts`

If you need to change package/bundle ID later, update `capacitor.config.ts` and re-sync:

```bash
npm run mobile:sync
```

## 9. Notes for affiliate/mobile compliance

- Keep affiliate disclosure visible in-app.
- Ensure privacy policy and affiliate disclosure URLs are live and accessible.
- For Amazon Associates mobile use, a mobile web site alone is not enough. Publish the Android/iOS app, then add the final App Store / Google Play URLs to your Associates account after the listings are live.
- Affiliate retailer links should open through the device browser or native in-app browser, not only with `window.open` inside a webview.
