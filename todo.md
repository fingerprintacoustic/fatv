# fatv - Project TODO

## Core Features

- [x] M3U playlist parsing and loading
- [x] Channel grid display with thumbnails
- [x] Video player with HLS/RTMP stream support
- [x] Play/pause and volume controls
- [x] Fullscreen video player
- [x] Channel switching (swipe or button)
- [x] Favorites system (save/remove channels)
- [x] Search functionality to filter channels
- [x] Playlist management (add/edit/delete M3U URLs)
- [x] Pull-to-refresh for playlist reload
- [x] Local persistence (AsyncStorage for playlists and favorites)

## UI/UX Polish

- [x] Custom app icon and branding (no watermark)
- [x] Dark theme optimized for video viewing
- [x] Responsive layout for different screen sizes
- [x] Smooth transitions between screens
- [x] Loading states and error handling
- [x] Empty state screens (no channels, no favorites)
- [x] Tab bar navigation (Home, Playlists, Favorites)

## Settings & Configuration

- [ ] Settings screen for app preferences
- [ ] Theme toggle (light/dark)
- [ ] Video quality selection
- [ ] Playback speed control
- [ ] Clear cache option

## Testing & Deployment

- [ ] Test with sample M3U playlists
- [ ] Test video playback on iOS and Android
- [ ] Test search and filter functionality
- [ ] Test favorites persistence
- [ ] Generate app icon and branding assets
- [ ] Create checkpoint before publishing

## EPG (Electronic Program Guide)

- [x] XMLTV parser for EPG data
- [x] EPG data fetching from URL
- [x] Program guide screen showing current and upcoming programs
- [x] Auto-load default EPG source on first launch
- [x] Display program info on channel detail screen
- [x] Search programs by name
- [ ] Set reminders for upcoming programs
- [x] Cache EPG data locally

## Default Content

- [x] Add default IPTV playlist from iptv-org on first launch
- [x] Auto-load channels from default playlist
- [x] Allow users to remove default playlist


## Android Build & Deployment

- [x] Create signing keystore (fatv-release-key.jks)
- [x] Configure app.config.ts with com.app.fatv package name
- [x] Enlarge tab bar icons for better visibility
- [ ] Generate Android App Bundle (.aab) for Google Play
- [ ] Upload .aab to Google Play Console
- [ ] Set up Google Play Store listing


## Offline Playback

- [x] Implement playlist caching to AsyncStorage
- [x] Add cache management (view cache size, clear cache)
- [x] Download M3U playlists for offline access
- [x] Cache EPG data locally
- [x] Display cached status indicator
- [x] Offline mode indicator in UI

## Chromecast Support

- [x] Integrate react-native-google-cast library
- [x] Add Cast button to video player
- [x] Implement stream casting to Chromecast devices
- [x] Display connected device status
- [x] Handle cast session lifecycle
- [x] Support pause/resume on Cast device


## Program Notifications

- [x] Add "Watch Later" functionality for programs
- [x] Schedule push notifications for upcoming programs
- [x] Notification permission handling
- [x] Notification settings screen

## Channel Logos & Thumbnails

- [x] Extract logo URLs from M3U metadata (tvg-logo)
- [x] Display channel logos in grid view
- [x] Cache logos locally
- [x] Fallback to generic icon if logo unavailable
- [x] Logo loading optimization

## Multi-Language EPG Support

- [x] Allow users to add multiple EPG sources
- [x] EPG source language/region labeling
- [x] Switch between EPG sources
- [x] Merge programs from multiple EPG sources
- [x] Region-specific EPG recommendations
