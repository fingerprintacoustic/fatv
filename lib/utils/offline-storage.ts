/**
 * Offline Storage Utilities
 * Handles caching of M3U playlists and EPG data for offline access
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Playlist } from "@/lib/types/iptv";
import { Program, ChannelProgram } from "@/lib/types/epg";

const STORAGE_KEYS = {
  CACHED_PLAYLISTS: "@fatv_cached_playlists",
  CACHED_EPG: "@fatv_cached_epg",
  CACHE_METADATA: "@fatv_cache_metadata",
  OFFLINE_MODE: "@fatv_offline_mode",
};

export interface CacheMetadata {
  playlistId: string;
  playlistName: string;
  cachedAt: number;
  expiresAt: number;
  size: number;
  channelCount: number;
}

export interface OfflinePlaylist extends Playlist {
  isCached: boolean;
  cachedAt?: number;
  cacheSize?: number;
}

/**
 * Cache a playlist for offline access
 */
export async function cachePlaylist(playlist: Playlist): Promise<void> {
  try {
    // Store playlist data
    const cacheKey = `${STORAGE_KEYS.CACHED_PLAYLISTS}_${playlist.id}`;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(playlist));

    // Update metadata
    const metadata: CacheMetadata = {
      playlistId: playlist.id,
      playlistName: playlist.name,
      cachedAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      size: JSON.stringify(playlist).length,
      channelCount: playlist.channels.length,
    };

    const metadataKey = `${STORAGE_KEYS.CACHE_METADATA}_${playlist.id}`;
    await AsyncStorage.setItem(metadataKey, JSON.stringify(metadata));

    console.log(`Playlist cached: ${playlist.name} (${playlist.channels.length} channels)`);
  } catch (err) {
    console.error("Error caching playlist:", err);
    throw err;
  }
}

/**
 * Get a cached playlist
 */
export async function getCachedPlaylist(playlistId: string): Promise<Playlist | null> {
  try {
    const cacheKey = `${STORAGE_KEYS.CACHED_PLAYLISTS}_${playlistId}`;
    const data = await AsyncStorage.getItem(cacheKey);

    if (!data) return null;

    const playlist = JSON.parse(data) as Playlist;
    return playlist;
  } catch (err) {
    console.error("Error retrieving cached playlist:", err);
    return null;
  }
}

/**
 * Get cache metadata for a playlist
 */
export async function getCacheMetadata(playlistId: string): Promise<CacheMetadata | null> {
  try {
    const metadataKey = `${STORAGE_KEYS.CACHE_METADATA}_${playlistId}`;
    const data = await AsyncStorage.getItem(metadataKey);

    if (!data) return null;

    const metadata = JSON.parse(data) as CacheMetadata;
    return metadata;
  } catch (err) {
    console.error("Error retrieving cache metadata:", err);
    return null;
  }
}

/**
 * Get all cached playlists
 */
export async function getAllCachedPlaylists(): Promise<OfflinePlaylist[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const playlistKeys = keys.filter((key) => key.startsWith(STORAGE_KEYS.CACHED_PLAYLISTS));

    const playlists: OfflinePlaylist[] = [];

    for (const key of playlistKeys) {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const playlist = JSON.parse(data) as Playlist;
        const metadata = await getCacheMetadata(playlist.id);

        playlists.push({
          ...playlist,
          isCached: true,
          cachedAt: metadata?.cachedAt,
          cacheSize: metadata?.size,
        });
      }
    }

    return playlists;
  } catch (err) {
    console.error("Error retrieving all cached playlists:", err);
    return [];
  }
}

/**
 * Clear cache for a specific playlist
 */
export async function clearPlaylistCache(playlistId: string): Promise<void> {
  try {
    const cacheKey = `${STORAGE_KEYS.CACHED_PLAYLISTS}_${playlistId}`;
    const metadataKey = `${STORAGE_KEYS.CACHE_METADATA}_${playlistId}`;

    await Promise.all([
      AsyncStorage.removeItem(cacheKey),
      AsyncStorage.removeItem(metadataKey),
    ]);

    console.log(`Cache cleared for playlist: ${playlistId}`);
  } catch (err) {
    console.error("Error clearing playlist cache:", err);
    throw err;
  }
}

/**
 * Clear all cached playlists
 */
export async function clearAllPlaylistCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(
      (key) =>
        key.startsWith(STORAGE_KEYS.CACHED_PLAYLISTS) ||
        key.startsWith(STORAGE_KEYS.CACHE_METADATA)
    );

    await AsyncStorage.multiRemove(cacheKeys);
    console.log("All playlist caches cleared");
  } catch (err) {
    console.error("Error clearing all caches:", err);
    throw err;
  }
}

/**
 * Get total cache size in bytes
 */
export async function getTotalCacheSize(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const metadataKeys = keys.filter((key) => key.startsWith(STORAGE_KEYS.CACHE_METADATA));

    let totalSize = 0;

    for (const key of metadataKeys) {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const metadata = JSON.parse(data) as CacheMetadata;
        totalSize += metadata.size;
      }
    }

    return totalSize;
  } catch (err) {
    console.error("Error calculating cache size:", err);
    return 0;
  }
}

/**
 * Cache EPG data
 */
export async function cacheEPGData(epgId: string, channels: ChannelProgram[]): Promise<void> {
  try {
    const cacheKey = `${STORAGE_KEYS.CACHED_EPG}_${epgId}`;
    const data = {
      channels,
      cachedAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    console.log(`EPG cached: ${epgId} (${channels.length} channels)`);
  } catch (err) {
    console.error("Error caching EPG data:", err);
    throw err;
  }
}

/**
 * Get cached EPG data
 */
export async function getCachedEPGData(epgId: string): Promise<ChannelProgram[] | null> {
  try {
    const cacheKey = `${STORAGE_KEYS.CACHED_EPG}_${epgId}`;
    const data = await AsyncStorage.getItem(cacheKey);

    if (!data) return null;

    const parsed = JSON.parse(data);

    // Check if cache is expired
    if (parsed.expiresAt < Date.now()) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    return parsed.channels;
  } catch (err) {
    console.error("Error retrieving cached EPG data:", err);
    return null;
  }
}

/**
 * Set offline mode status
 */
export async function setOfflineMode(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, JSON.stringify(enabled));
  } catch (err) {
    console.error("Error setting offline mode:", err);
  }
}

/**
 * Get offline mode status
 */
export async function getOfflineMode(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_MODE);
    return data ? JSON.parse(data) : false;
  } catch (err) {
    console.error("Error getting offline mode:", err);
    return false;
  }
}

/**
 * Format bytes to human-readable size
 */
export function formatCacheSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
