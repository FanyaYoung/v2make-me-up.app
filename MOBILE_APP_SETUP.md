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

1. In Android Studio: `Build` -> `Generate Signed Bundle / APK`.
2. Choose `Android App Bundle (AAB)`.
3. Create/use keystore and build release bundle.
4. Upload `.aab` in Google Play Console -> Production/Testing release.
5. Complete store listing, content rating, privacy policy URL, and submit.

## 7. iOS release (App Store)

1. Open project in Xcode (`npm run ios:open`).
2. Set unique Bundle Identifier (matches `appId`).
3. Set Version/Build number.
4. `Product` -> `Archive`.
5. Upload via Organizer to App Store Connect.
6. In App Store Connect, complete listing, screenshots, privacy details, and submit for review.

## 8. App IDs and naming in this project

- App ID: `com.makemeup.app`
- App Name: `Make Me Up`
- Config file: `capacitor.config.ts`

If you need to change package/bundle ID later, update `capacitor.config.ts` and re-sync:

```bash
npm run mobile:sync
```

## 9. Notes for affiliate/mobile compliance

- Keep affiliate disclosure visible in-app.
- Ensure privacy policy and affiliate disclosure URLs are live and accessible.
- For Amazon Associates mobile use, add your final App Store/Play Store URLs in Associates account after publish.
