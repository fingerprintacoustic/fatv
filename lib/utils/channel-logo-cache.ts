/**
 * Channel Logo Cache Utility
 * Manages downloading, caching, and serving channel logos
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import RNFS from "react-native-fs";

const LOGO_CACHE_DIR = `${RNFS.CachesDirectoryPath}/channel-logos/`;
const LOGO_CACHE_INDEX_KEY = "@fatv_logo_cache_index";
const LOGO_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

interface LogoCacheEntry {
  channelId: string;
  logoUrl: string;
  localPath: string;
  cachedAt: number;
  size: number;
}

/**
 * Initialize logo cache directory
 */
export async function initLogoCacheDir(): Promise<void> {
  try {
    const exists = await RNFS.exists(LOGO_CACHE_DIR);
    if (!exists) {
      await RNFS.mkdir(LOGO_CACHE_DIR);
    }
  } catch (err) {
    console.warn("Failed to initialize logo cache directory:", err);
  }
}

/**
 * Download and cache a channel logo
 */
export async function cacheChannelLogo(
  channelId: string,
  logoUrl: string
): Promise<string | null> {
  try {
    if (!logoUrl || logoUrl.trim() === "") {
      return null;
    }

    // Check if logo is already cached
    const cached = await getCachedLogoPath(channelId);
    if (cached) {
      return cached;
    }

    // Download logo
    const filename = `${channelId}-${Date.now()}.png`;
    const localPath = `${LOGO_CACHE_DIR}${filename}`;

    const downloadResult = await RNFS.downloadFile({
      fromUrl: logoUrl,
      toFile: localPath,
    }).promise;

    if (downloadResult.statusCode === 200) {
      // Save to cache index
      await updateLogoCacheIndex(channelId, logoUrl, localPath);
      return localPath;
    } else {
      return null;
    }
  } catch (err) {
    console.warn(`Failed to cache logo for channel ${channelId}:`, err);
    return null;
  }
}

/**
 * Get cached logo path for a channel
 */
export async function getCachedLogoPath(channelId: string): Promise<string | null> {
  try {
    const cacheIndex = await getLogoCacheIndex();
    const entry = cacheIndex.find((e) => e.channelId === channelId);

    if (!entry) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - entry.cachedAt > LOGO_CACHE_DURATION) {
      // Remove expired cache
      await removeLogoCacheEntry(channelId);
      return null;
    }

    // Verify file still exists
    const exists = await RNFS.exists(entry.localPath);
    if (exists) {
      return entry.localPath;
    } else {
      // File was deleted, remove from cache index
      await removeLogoCacheEntry(channelId);
      return null;
    }
  } catch (err) {
    console.warn(`Failed to get cached logo for channel ${channelId}:`, err);
    return null;
  }
}

/**
 * Get or download channel logo
 * Returns cached path if available, otherwise downloads and caches
 */
export async function getChannelLogo(
  channelId: string,
  logoUrl: string
): Promise<string | null> {
  if (!logoUrl) {
    return null;
  }

  // Check cache first
  const cached = await getCachedLogoPath(channelId);
  if (cached) {
    return cached;
  }

  // Download and cache
  return cacheChannelLogo(channelId, logoUrl);
}

/**
 * Get logo cache index
 */
async function getLogoCacheIndex(): Promise<LogoCacheEntry[]> {
  try {
    const indexData = await AsyncStorage.getItem(LOGO_CACHE_INDEX_KEY);
    return indexData ? JSON.parse(indexData) : [];
  } catch (err) {
    console.warn("Failed to load logo cache index:", err);
    return [];
  }
}

/**
 * Update logo cache index
 */
async function updateLogoCacheIndex(
  channelId: string,
  logoUrl: string,
  localPath: string
): Promise<void> {
  try {
    const index = await getLogoCacheIndex();

    // Remove old entry if exists
    const filtered = index.filter((e) => e.channelId !== channelId);

    // Add new entry
    let size = 0;
    try {
      const stat = await RNFS.stat(localPath);
      size = stat.size || 0;
    } catch {
      // file may not exist yet if download failed silently; keep size 0
    }

    filtered.push({
      channelId,
      logoUrl,
      localPath,
      cachedAt: Date.now(),
      size,
    });

    await AsyncStorage.setItem(LOGO_CACHE_INDEX_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn("Failed to update logo cache index:", err);
  }
}

/**
 * Remove logo cache entry
 */
async function removeLogoCacheEntry(channelId: string): Promise<void> {
  try {
    const index = await getLogoCacheIndex();
    const entry = index.find((e) => e.channelId === channelId);

    if (entry) {
      // Delete file
      try {
        await RNFS.unlink(entry.localPath);
      } catch (err) {
        console.warn(`Failed to delete logo file for ${channelId}:`, err);
      }

      // Remove from index
      const filtered = index.filter((e) => e.channelId !== channelId);
      await AsyncStorage.setItem(LOGO_CACHE_INDEX_KEY, JSON.stringify(filtered));
    }
  } catch (err) {
    console.warn("Failed to remove logo cache entry:", err);
  }
}

/**
 * Clear all logo cache
 */
export async function clearLogoCacheDir(): Promise<void> {
  try {
    const exists = await RNFS.exists(LOGO_CACHE_DIR);
    if (exists) {
      await RNFS.unlink(LOGO_CACHE_DIR);
    }
    await AsyncStorage.removeItem(LOGO_CACHE_INDEX_KEY);
  } catch (err) {
    console.warn("Failed to clear logo cache:", err);
  }
}

/**
 * Get logo cache statistics
 */
export async function getLogoCacheStats(): Promise<{
  totalLogos: number;
  totalSize: number;
  oldestCached: number;
  newestCached: number;
}> {
  try {
    const index = await getLogoCacheIndex();
    if (index.length === 0) {
      return {
        totalLogos: 0,
        totalSize: 0,
        oldestCached: 0,
        newestCached: 0,
      };
    }

    const totalSize = index.reduce((sum, e) => sum + e.size, 0);
    const cachedTimes = index.map((e) => e.cachedAt);

    return {
      totalLogos: index.length,
      totalSize,
      oldestCached: Math.min(...cachedTimes),
      newestCached: Math.max(...cachedTimes),
    };
  } catch (err) {
    console.warn("Failed to get logo cache stats:", err);
    return {
      totalLogos: 0,
      totalSize: 0,
      oldestCached: 0,
      newestCached: 0,
    };
  }
}
