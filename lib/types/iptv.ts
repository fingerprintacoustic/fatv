/**
 * IPTV Types
 * Defines data structures for M3U playlists, channels, and playback state
 */

export interface Channel {
  id: string; // Unique identifier (e.g., channel name or URL hash)
  name: string;
  logo?: string; // URL to channel logo/thumbnail
  url: string; // Stream URL (HLS, RTMP, etc.)
  group?: string; // Channel group/category
  tvgId?: string; // TVG ID for EPG
  tvgName?: string; // TVG name for EPG
  healthStatus?: "working" | "failed" | "checking"; // Channel health status
  lastHealthCheck?: number; // Timestamp of last health check
  continent?: string; // Continent (e.g., "Africa", "Europe")
  country?: string; // Country (e.g., "Zimbabwe", "Kenya")
  category?: string; // Category (e.g., "Sports", "News", "Entertainment")
}

export interface HierarchicalFilter {
  continent?: string;
  country?: string;
  category?: string;
}

export interface ContinentData {
  name: string;
  countries: Set<string>;
}

export interface CountryData {
  name: string;
  categories: Set<string>;
}

export interface CategoryData {
  name: string;
  channelCount: number;
}

export interface Playlist {
  id: string; // Unique identifier
  name: string; // User-friendly name
  url: string; // M3U URL
  channels: Channel[];
  lastUpdated: number; // Timestamp of last refresh
  isActive: boolean; // Currently active playlist
}

export interface PlaybackState {
  currentChannelId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export interface FavoriteChannel {
  channelId: string;
  playlistId: string;
  addedAt: number;
}

export interface AppState {
  playlists: Playlist[];
  favorites: FavoriteChannel[];
  playbackState: PlaybackState;
  lastPlayedChannelId: string | null;
  hierarchicalFilter: HierarchicalFilter;
}
