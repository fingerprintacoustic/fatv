# fatv - IPTV Mobile App Design

## Overview
fatv is a clean, no-watermark IPTV streaming app for browsing and watching live TV channels from M3U playlists. The app prioritizes simplicity and fast channel access.

## Screen List

1. **Home Screen** - Channel Grid
2. **Channel Detail Screen** - Video Player
3. **Playlist Management Screen** - Add/Edit M3U URLs
4. **Search Screen** - Find channels by name
5. **Favorites Screen** - Quick access to saved channels

## Primary Content and Functionality

### Home Screen (Channel Grid)
- **Content**: Grid of channel logos/thumbnails with channel names
- **Functionality**:
  - Display all channels from loaded M3U playlist
  - Tap channel to play
  - Long-press to add/remove from favorites
  - Pull-to-refresh to reload playlist
  - Search bar at top to filter channels

### Channel Detail Screen (Video Player)
- **Content**: Full-screen video player with channel name, current time
- **Functionality**:
  - Play/pause controls
  - Volume control
  - Fullscreen toggle
  - Back button to return to grid
  - Add/remove from favorites button
  - Swipe left/right to switch channels

### Playlist Management Screen
- **Content**: List of saved M3U playlist URLs
- **Functionality**:
  - Add new playlist URL via text input
  - Edit existing playlist URL
  - Delete playlist
  - Set active/default playlist
  - Manual refresh button

### Search Screen
- **Content**: Search results showing matching channels
- **Functionality**:
  - Real-time search as user types
  - Tap result to play channel
  - Filter by channel name or group

### Favorites Screen
- **Content**: Grid of favorited channels
- **Functionality**:
  - Display only saved favorite channels
  - Tap to play
  - Swipe to remove from favorites

## Key User Flows

### Flow 1: First-Time Setup
1. User opens app → Playlist Management screen
2. User enters M3U playlist URL
3. App fetches and parses playlist
4. User returns to Home Screen
5. Channel grid loads with all channels

### Flow 2: Watch a Channel
1. User on Home Screen
2. Tap channel thumbnail
3. Navigate to Channel Detail Screen
4. Video player loads and plays stream
5. User can switch channels via swipe or back button

### Flow 3: Save Favorite
1. User on Home Screen or Channel Detail Screen
2. Long-press channel (Home) or tap star icon (Detail)
3. Channel added to Favorites
4. User can access via Favorites tab

### Flow 4: Search for Channel
1. User taps search bar on Home Screen
2. Type channel name
3. Results filter in real-time
4. Tap result to play

## Color Choices

- **Primary Brand Color**: `#FF6B35` (vibrant orange-red) - energetic, modern feel
- **Background**: `#0F0F0F` (deep black) - ideal for video playback, reduces eye strain
- **Surface/Cards**: `#1A1A1A` (dark gray) - subtle contrast for UI elements
- **Text Primary**: `#FFFFFF` (white) - high contrast on dark backgrounds
- **Text Secondary**: `#A0A0A0` (light gray) - secondary information
- **Accent/Highlight**: `#FF6B35` (matches primary) - active states, selected items
- **Success**: `#4CAF50` (green) - playlist loaded, connection good
- **Error**: `#FF5252` (red) - connection failed, invalid URL

## Design Principles

- **Minimal UI**: Focus on video playback, hide controls when not needed
- **Fast Access**: Channel grid prioritizes quick browsing and switching
- **No Watermarks**: Clean video player without overlays or branding
- **Dark Theme**: Optimized for evening viewing, reduces battery drain on OLED screens
- **One-Handed**: All interactive elements within thumb reach on 6" phones
- **Responsive**: Adapts to different screen sizes and orientations
