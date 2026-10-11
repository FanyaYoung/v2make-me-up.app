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
3. Confirm Bundle Identifier is `com.fanyayoung.makemeupapp`.
4. Set Version (`MARKETING_VERSION`) and Build (`CURRENT_PROJECT_VERSION`).
5. Choose `Any iOS Device (arm64)` or a physical device target.
6. `Product` -> `Archive`.
7. Upload via Organizer to App Store Connect.
8. In App Store Connect, complete listing, screenshots, privacy details, and submit for review.

## 8. App IDs and naming in this project

- App ID: `com.fanyayoung.makemeupapp`
- App Name: `Make Me Up`
- Android version: `versionName "1.0.2"` / `versionCode 3`
- iOS version: `MARKETING_VERSION = 1.0.1` (build number in Xcode)
- Config file: `capacitor.config.ts`

If you need to change package/bundle ID later, update `capacitor.config.ts` and re-sync:

```bash
npm run mobile:sync
```

Capacitor sync copies web assets and plugin configuration. If changing an existing
app identifier, also update Android's applicationId/namespace and Xcode's bundle
identifier explicitly. Keep the current identifier for updates to existing listings.

## Current mobile implementation and verification (September 30, 2026)

- Both native projects bundle the existing Make Me Up React application.
- Phone navigation provides Home, Match, Try On, Products, and Account tabs.
- The Account screen includes sign-in, sign-out, privacy, terms, affiliate disclosure,
  and account deletion links.
- Google/Apple OAuth opens in the native browser and returns through the app's
  registered URL scheme. Native OAuth uses PKCE, and Android Back navigates within
  the app or minimizes it at the root.
- The production Supabase redirect allow list now includes
  `com.fanyayoung.makemeupapp://auth/callback**`; existing URLs were preserved.
- Safe-area padding protects content around system bars and the home indicator.
- iOS camera usage text explains shade matching and makeup previews.
- Retailer links in foundation recommendations, product browsing, Ulta, and
  Rakuten use the existing native browser integration.
- `npm run mobile:sync`, `npm run lint`, TypeScript checking, mobile callback
  validation, and Android `assembleDebug` passed.
- Installable Android test build: `android/app/build/outputs/apk/debug/app-debug.apk`.
- Xcode's framework mismatch was repaired with `xcodebuild -runFirstLaunch`.
  iOS 26.5 was subsequently installed after freeing disk space.
- The iPhone simulator build and unsigned iPhone Release archive both succeeded.
- Make Me Up was installed and launched on the iPhone 17 / iOS 26.5 simulator.
  Home, Account, Products (including the bundled catalog), and Shade Match were
  visually checked. The bottom navigation and safe-area layout rendered correctly.
- The iOS app icon now uses the project's existing compact-makeup artwork, and
  the launch screen uses that artwork with the Make Me Up name.
- Required product CSVs and page images removed during disk cleanup were restored
  from Git before rebuilding. npm's replaceable download cache was cleared to
  make room for the Release archive; installed dependencies were preserved.
- Unsigned archive: `ios/App/output/MakeMeUp.xcarchive`.
- Simulator app: `/tmp/makemeup-mobile-build/Build/Products/Debug-iphonesimulator/App.app`.
- This Mac has no valid Apple code-signing identities, and the Xcode project has
  no development team configured. Select your Apple Developer team in Xcode to
  sign a physical-device build or upload a signed archive to TestFlight/App Store.
  The unsigned archive cannot be installed directly on a physical iPhone.
- Camera capture, live shade matching, sign-in, and retailer checkout still need
  testing on physical iPhone and Android devices before store submission.

Build an Android test APK from this Mac:

```bash
cd android
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew assembleDebug
```

Build for an iPhone simulator:

```bash
npm run ios:build:simulator
```

Create an unsigned iPhone Release archive:

```bash
npm run ios:archive:unsigned
```

## 9. Notes for affiliate/mobile compliance

- Keep affiliate disclosure visible in-app.
- Ensure privacy policy and affiliate disclosure URLs are live and accessible.
- For Amazon Associates mobile use, a mobile web site alone is not enough. Publish the Android/iOS app, then add the final App Store / Google Play URLs to your Associates account after the listings are live.
- Affiliate retailer links should open through the device browser or native in-app browser, not only with `window.open` inside a webview.
