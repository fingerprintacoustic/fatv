# FATV: Expo → Bare React Native CLI migration

## ✅ Phase 1 — done
- Real `android/` and `ios/` native projects generated (RN 0.81.5), renamed to
  `com.fingerprintacoustic.app` / "fatv"
- `package.json` rewritten: all `expo-*` packages replaced with bare RN
  equivalents (see mapping table from chat)
- `App.tsx` + `navigation/TabNavigator.tsx` created using
  `@react-navigation/native-stack` + `bottom-tabs`, replacing
  `app/_layout.tsx` and `app/(tabs)/_layout.tsx`'s expo-router `Stack`/`Tabs`
- `app.json` renamed

## ⬜ Phase 2 — per-file Expo import cleanup
These files still import Expo packages and won't compile until converted.
Screens using `useRouter()`, `<Link>`, or `useLocalSearchParams()` need those
swapped for `useNavigation()` / `useRoute()` from `@react-navigation/native`.

- [x] `app/(tabs)/_layout.tsx` — deleted, superseded by `navigation/TabNavigator.tsx`
- [x] `app/_layout.tsx` — deleted, superseded by `App.tsx`
- [x] `app/(tabs)/index.tsx` — done: `useRouter().push` → `navigation.navigate("Player", {...})`
- [x] `app/(tabs)/browse.tsx` — done: navigates to `BrowseCountry` via react-navigation
- [x] `app/(tabs)/cache.tsx` — done: `@expo/vector-icons` → `react-native-vector-icons`
- [x] `app/(tabs)/epg-settings.tsx` — done: same icon swap
- [x] `app/(tabs)/favorites.tsx` — done: `useRouter().push` → `navigation.navigate("Player", {...})`, icon swap
- [x] `app/(tabs)/guide.tsx` — done: icon swap
- [x] `app/(tabs)/playlists.tsx` — done: icon swap
- [x] `app/browse-category.tsx` — done: registered on root stack as `BrowseCategory`, uses `useRoute`/`useNavigation`
- [x] `app/browse-channels.tsx` — done: registered on root stack as `BrowseChannels`
- [x] `app/browse-country.tsx` — done: registered on root stack as `BrowseCountry`

Note: the browse flow (Browse tab → country → category → channels → player) lives
partly outside the tab navigator, so `BrowseCountry`/`BrowseCategory`/`BrowseChannels`
were added to `RootStackParamList` in `App.tsx` alongside `Player`.
- [x] `app/oauth/callback.tsx` — done: `expo-router` → `useRoute`/`useNavigation`, `expo-linking` → RN core `Linking`. `App.tsx` now has a `linking` config so react-navigation parses the deep-link URL's query string into `route.params`, same as expo-router did automatically.
- [x] `app/player.tsx` — done: `expo-video` → `react-native-video`, `expo-router` → `@react-navigation` (`route.params`/`navigation.goBack()`), `expo-keep-awake` → `react-native-keep-awake`, `@expo/vector-icons` → `react-native-vector-icons`. Note: this app only used `expo-video`, not `expo-audio` directly — `expo-audio` was a transitive/unused dependency pulled in by the template (it's what triggered the original Play Console warning). Drop `react-native-track-player` from `package.json` unless another screen turns out to need standalone audio playback.
- [x] `components/cast-button.tsx` — done: `@expo/vector-icons` → `react-native-vector-icons/MaterialIcons`
- [x] `components/external-link.tsx` — done: `expo-router` `Link` + `expo-web-browser` → `Pressable` + `react-native-inappbrowser-reborn`. Web target dropped (bare RN CLI is Android/iOS only now — no react-native-web build).
- [x] `components/haptic-tab.tsx` — done: `expo-haptics` → `react-native-haptic-feedback`, `process.env.EXPO_OS` check → `Platform.OS`
- [x] `components/ui/icon-symbol.tsx` / `icon-symbol.ios.tsx` — done: consolidated to a single MaterialIcons-based `icon-symbol.tsx` (`react-native-vector-icons`) for all platforms; deleted the `.ios.tsx` SF Symbols variant to avoid a separate native module for one platform
- [x] `constants/oauth.ts` — done: `expo-linking` → RN core `Linking`, `process.env.EXPO_PUBLIC_*` → `react-native-config`. Dropped the web-platform branches (no web target in bare RN CLI).
- [x] `lib/_core/auth.ts` — done: `expo-secure-store` → `react-native-keychain` (each key stored as its own Keychain "service"). Dropped web branches.
- [x] `lib/context/notifications-context.tsx` — done: `expo-notifications` → `@notifee/react-native`, with an Android notification channel created on init and trigger-timestamp notifications for scheduled program reminders
- [x] `lib/utils/channel-logo-cache.ts` — done: `expo-file-system` → `react-native-fs`
- [x] `lib/utils/channel-logos.ts` — done: `expo-file-system` → `react-native-fs`

**Phase 2 complete — every app/lib/component/hook file is off Expo.**

## ✅ Manus — fully removed
"No Manus" turned out to mean two very different scopes. Both are done now:

- [x] `lib/_core/manus-runtime.ts` — deleted (already dead code, see earlier note).
- [x] **`server/_core/*` and everything depending on it — deleted entirely.**
  Turned out this wasn't a "replace the backend" project after all: a full
  audit found **zero screens or components actually called any of it** —
  no `useAuth()` call anywhere, no login button anywhere in the UI,
  `server/routers.ts` was still the unmodified template stub with no feature
  routers ever added. The whole OAuth/database/LLM/storage/notification
  backend was unused scaffolding left over from the project template, not
  something FATV's actual channel-browsing functionality depended on.

  Removed: `server/`, `drizzle/`, `shared/`, `app/oauth/`,
  `constants/oauth.ts`, `constants/const.ts`, `lib/_core/auth.ts`,
  `lib/_core/api.ts`, `hooks/use-auth.ts`, `lib/trpc.ts`, `.env.example`.
  Rewrote `App.tsx` to drop the `trpc.Provider`/`QueryClientProvider` wrapper
  and the `OAuthCallback` route + `linking` config. Pruned now-unused
  dependencies from `package.json`: `@trpc/*`, `drizzle-orm`, `drizzle-kit`,
  `mysql2`, `jose`, `cookie`, `dotenv`, `superjson`, `zod`, `qrcode`,
  `esbuild`, `tsx`, `concurrently`, `cross-env`, `vitest`, and
  `react-native-config` (its env vars were only ever used by the deleted
  OAuth code) — plus the matching `dotenv.gradle`/module wiring in
  `android/app/build.gradle`. Cleaned the stale `@shared/*` alias from
  `tsconfig.json` and `babel.config.js`.

  **Left alone deliberately**: the `fingerprintacoustic://`/`manusfatv://`
  deep-link scheme registrations in `AndroidManifest.xml`/`Info.plist`/
  `AppDelegate.swift` — they're harmless now that nothing routes through
  them (no `linking` config left to map them to anything), and re-editing
  three native files for zero functional benefit isn't worth another round
  of manual native edits. Fine to strip later if you want a fully clean
  manifest.

  **If you ever do want real user accounts/cloud sync later**: this is a
  clean slate, not a hole to fill — nothing in the current app expects a
  backend to exist. Worth a fresh conversation then about what stack fits
  (Firebase Auth + Firestore matches your usual pattern from other
  projects).

## ⬜ Phase 3 — native wiring
- [x] Android `AndroidManifest.xml`: added `WAKE_LOCK`, `POST_NOTIFICATIONS`,
  `SCHEDULE_EXACT_ALARM`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`
  permissions (for react-native-video background playback + notifee scheduled
  reminders). Also fixed an unresolved Gradle manifest placeholder
  (`${usesCleartextTraffic}` had no matching `manifestPlaceholders` entry —
  would have failed the build) by hardcoding `usesCleartextTraffic="true"`,
  needed since IPTV M3U streams are often plain HTTP.
- [x] Android + iOS deep-link registration: intent-filter for
  `fingerprintacoustic://` and `manusfatv://` in `AndroidManifest.xml`,
  `CFBundleURLTypes` in `Info.plist`, and `RCTLinkingManager` open-URL /
  `continue userActivity` handlers added to `AppDelegate.swift` (iOS doesn't
  receive deep links at all without these).
- [x] **Found and fixed a real bug**: `AppDelegate.swift` still registered
  the JS module as `"FatvNative"` (the scaffold's placeholder name) instead
  of `"fatv"` (what `app.json`/`index.js` actually register) — this would
  have crashed on launch on iOS. Android's `MainActivity.kt` already had the
  correct name from the earlier rename.
- [x] `react-native-config` wired into `android/app/build.gradle` (applies
  `dotenv.gradle`, adds the module dependency) so `.env` vars are available
  via `import Config from "react-native-config"`. Added `.env.example` with
  the vars `constants/oauth.ts` expects, and fixed `.gitignore` — it only
  ignored `.env*.local`, not a plain `.env`, which would've let real secrets
  get committed.
- [ ] iOS `Podfile` + `pod install` for the new native modules — this needs
  an actual macOS/CocoaPods environment to run; nothing to do in-source
  beyond what's already there, `pod install` should pick up all these via
  autolinking.
- [ ] Splash screen: `react-native-bootsplash` needs its asset generator run
  interactively (`npx react-native-bootsplash generate <your-logo>`) against
  your real logo file to produce all the density variants — not something
  safe to fake without the real asset pipeline. Run it locally, then it
  wires itself into `MainActivity.kt`/`AppDelegate.swift` automatically.
- [ ] iOS `NSAllowsArbitraryLoads`: currently `false` (with a comment warning
  against flipping it, from the original template) — but IPTV apps
  streaming from arbitrary third-party HTTP sources typically need this
  `true` on iOS the same way `usesCleartextTraffic="true"` was needed on
  Android above, or ATS will silently block plain-HTTP streams. This is an
  App Store review trade-off worth deciding deliberately rather than me
  flipping a value that has an explicit warning attached to it.

## ⬜ Phase 4 — build & ship
- [x] `npm install --legacy-peer-deps` — done, actually ran it. 1289 packages
  installed clean (the `--legacy-peer-deps` flag was needed — some packages
  haven't caught up to React 19 peer ranges yet). One deprecation notice
  worth knowing about: `react-native-vector-icons@10.3.0` is being restructured
  into per-icon-family packages in a future major version — the
  `"react-native-vector-icons/MaterialIcons"` import style used throughout
  this codebase still works today, nothing to change now, just something to
  watch for on your next major-version bump of that package.
- [x] `npx tsc --noEmit` — ran it for real and fixed everything it caught in
  the app layer:
  - Added `@types/react-native-vector-icons` and `@types/react-native-keep-awake`
    (both packages ship no types of their own)
  - `player.tsx` used a `pictureInPicture` prop that doesn't exist on
    `react-native-video`'s actual type — the real prop is
    `enterPictureInPictureOnLeave`. Fixed.
  - `components/ui/collapsible.tsx` was still passing a `weight` prop to
    `IconSymbol`, left over from the deleted SF-Symbols variant — MaterialIcons
    has no such concept. Removed.
  - **Found a real missing-file bug**: `lib/_core/theme.ts` imports
    `@/theme.config`, but `theme.config.js`/`theme.config.d.ts` were never
    copied into this project during the initial Phase-1 assembly — pure
    oversight on my part. Copied them over now; without this the app
    wouldn't have built at all.
  - `lib/theme-provider.tsx` had a dead `typeof document !== "undefined"`
    branch (DOM manipulation for the old web target) — removed, plus a
    leftover debug `console.log`.
  - `app/dev/theme-lab.tsx` (an unused dev-only screen, not wired into
    navigation) had a `keyof` type resolving to include `symbol` — narrowed
    it to `string` keys only.
  - `server/_core/voiceTranscription.ts` and `server/storage.ts` still have
    real type errors — left untouched, they're inside the Manus backend SDK
    flagged above as a separate decision, not part of this migration.
- [ ] `cd android && ./gradlew assembleRelease` (or `bundleRelease` for Play Store `.aab`) — local build, no more EAS. Needs a machine with the Android SDK; not runnable in this sandbox.
- [ ] `cd ios && pod install` then archive via Xcode — needs macOS.
- [ ] Optional: GitHub Actions workflow for CI builds
