# FatTV - Android App Bundle Build Instructions

## Overview

This document provides step-by-step instructions for generating an Android App Bundle (.aab) for Google Play Store submission.

## Prerequisites

- **Package Name:** `com.app.fatv`
- **App Name:** fatv
- **Version:** 1.0.0
- **Signing Keystore:** `fatv-release-key.jks` (included in project root)

## Signing Keystore Details

| Property | Value |
|----------|-------|
| **Keystore File** | `fatv-release-key.jks` |
| **Alias** | `fatv-key` |
| **Store Password** | `fatv@2026` |
| **Key Password** | `fatv@2026` |
| **Validity** | 10,000 days (until Oct 17, 2053) |
| **Certificate Owner** | CN=FatTV, OU=Development, O=FatTV, L=Harare, ST=Harare, C=ZW |
| **SHA256 Fingerprint** | `43:8F:4B:E6:C6:00:8F:B4:E3:C7:85:DF:83:31:6A:A4:E0:71:85:FD:D6:0A:12:C1:C2:12:B5:FE:BE:E1:1E:52` |

## Method 1: Using Manus UI (Recommended)

1. Click the **Publish** button in the Manus Management UI
2. Select **Android** as the target platform
3. Choose **App Bundle (.aab)** as the build type
4. The system will automatically use the signing keystore to build and sign the app
5. Download the generated `.aab` file

## Method 2: Using Expo CLI Locally

If you have Node.js and Expo CLI installed locally:

```bash
# Install Expo CLI if not already installed
npm install -g eas-cli

# Authenticate with Expo
eas login

# Build Android App Bundle
eas build --platform android --type app-bundle

# The .aab file will be available for download after the build completes
```

## Method 3: Manual Build with Gradle (Advanced)

If you need to build locally:

```bash
# Build the app for production
npx expo prebuild --clean

# Build the App Bundle
cd android
./gradlew bundleRelease -Pandroid.injected.signing.store.file=../fatv-release-key.jks \
  -Pandroid.injected.signing.store.password=fatv@2026 \
  -Pandroid.injected.signing.key.alias=fatv-key \
  -Pandroid.injected.signing.key.password=fatv@2026

# The .aab file will be located at:
# android/app/build/outputs/bundle/release/app-release.aab
```

## Uploading to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app or select existing app
3. Navigate to **Release** → **Production**
4. Click **Create new release**
5. Upload the `.aab` file
6. Add release notes and complete the submission form
7. Review and publish

## App Store Listing Information

| Field | Value |
|-------|-------|
| **App Name** | fatv |
| **Package Name** | com.app.fatv |
| **Category** | Entertainment |
| **Content Rating** | TV (Parental Guidance) |
| **Supported Languages** | English |
| **Minimum SDK** | 24 (Android 7.0) |
| **Target SDK** | 34 (Android 14) |

## Features Included

- **IPTV Playlist Support:** M3U format with default IPTV-Org playlist (12,000+ channels)
- **Video Playback:** HLS and RTMP stream support with native controls
- **EPG Integration:** XMLTV Electronic Program Guide with program search
- **Channel Management:** Add, edit, delete, and organize playlists
- **Favorites:** Save and organize favorite channels
- **Dark Theme:** Optimized for evening viewing
- **No Watermarks:** Clean video player interface
- **Local Storage:** All data stored locally on device

## Troubleshooting

### Build Fails with Signing Error

Ensure the keystore file path and passwords are correct:

```bash
# Verify keystore
keytool -list -v -keystore fatv-release-key.jks -storepass fatv@2026
```

### App Not Appearing on Google Play

- Verify the package name matches exactly: `com.app.fatv`
- Ensure version code is incremented for updates
- Check that all required assets are included (icons, screenshots, descriptions)
- Review Google Play's content policies

### Build Size Too Large

The app includes video playback libraries. To reduce size:

1. Remove unused Expo modules from `app.config.ts`
2. Enable ProGuard/R8 minification
3. Use dynamic feature modules for optional features

## Support

For issues with the build process, refer to:

- [Expo Documentation](https://docs.expo.dev/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [React Native Documentation](https://reactnative.dev/)

## Next Steps

After successful .aab generation:

1. Test the app on multiple Android devices
2. Gather user feedback
3. Monitor crash reports in Google Play Console
4. Plan future updates (v1.1, v1.2, etc.)

---

**Generated:** June 1, 2026
**App Version:** 1.0.0
**Build Target:** Android 7.0+ (API 24+)
