/**
 * Channel Logo Utilities
 * Handles fetching, caching, and displaying channel logos
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { ChannelLogo } from "@/lib/types/channel-logos";

const LOGO_CACHE_DIR = `${FileSystem.cacheDirectory}channel-logos/`;
const STORAGE_KEY = "@fatv_channel_logos";

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(LOGO_CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(LOGO_CACHE_DIR, { intermediates: true });
    }
  } catch (err) {
    console.error("Error ensuring cache directory:", err);
  }
}

/**
 * Extract logo URL from M3U metadata
 * M3U format: #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="..."
 */
export function extractLogoFromM3ULine(line: string): string | undefined {
  const logoMatch = line.match(/tvg-logo="([^"]*)"/);
  return logoMatch ? logoMatch[1] : undefined;
}

/**
 * Download and cache channel logo
 */
export async function downloadAndCacheLogo(channelId: string, logoUrl: string): Promise<ChannelLogo> {
  try {
    await ensureCacheDir();

    const fileName = `${channelId}.png`;
    const cachedPath = `${LOGO_CACHE_DIR}${fileName}`;

    // Check if already cached
    const fileInfo = await FileSystem.getInfoAsync(cachedPath);
    if (fileInfo.exists) {
      const logo: ChannelLogo = {
        channelId,
        logoUrl,
        cachedPath,
        lastUpdated: Date.now(),
      };
      return logo;
    }

    // Download logo
    const downloadResult = await FileSystem.downloadAsync(logoUrl, cachedPath);

    if (downloadResult.status === 200) {
      const logo: ChannelLogo = {
        channelId,
        logoUrl,
        cachedPath,
        lastUpdated: Date.now(),
      };
      return logo;
    }

    throw new Error(`Download failed with status ${downloadResult.status}`);
  } catch (err) {
    console.error(`Error downloading logo for channel ${channelId}:`, err);
    // Return logo without cache path on error
    return {
      channelId,
      logoUrl,
      lastUpdated: Date.now(),
    };
  }
}

/**
 * Get cached logo for channel
 */
export async function getCachedLogo(channelId: string): Promise<ChannelLogo | null> {
  try {
    const logosData = await AsyncStorage.getItem(STORAGE_KEY);
    if (!logosData) return null;

    const logos: Record<string, ChannelLogo> = JSON.parse(logosData);
    return logos[channelId] || null;
  } catch (err) {
    console.error("Error getting cached logo:", err);
    return null;
  }
}

/**
 * Save logo to cache
 */
export async function saveLogo(logo: ChannelLogo): Promise<void> {
  try {
    const logosData = await AsyncStorage.getItem(STORAGE_KEY);
    const logos: Record<string, ChannelLogo> = logosData ? JSON.parse(logosData) : {};

    logos[logo.channelId] = logo;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logos));
  } catch (err) {
    console.error("Error saving logo:", err);
  }
}

/**
 * Get or download logo (with caching)
 */
export async function getChannelLogo(channelId: string, logoUrl?: string): Promise<ChannelLogo | null> {
  try {
    // Check if already cached
    const cached = await getCachedLogo(channelId);
    if (cached) return cached;

    // If no URL provided, return null
    if (!logoUrl) return null;

    // Download and cache
    const logo = await downloadAndCacheLogo(channelId, logoUrl);
    await saveLogo(logo);

    return logo;
  } catch (err) {
    console.error("Error getting channel logo:", err);
    return null;
  }
}

/**
 * Clear logo cache
 */
export async function clearLogoCache(): Promise<void> {
  try {
    await FileSystem.deleteAsync(LOGO_CACHE_DIR, { idempotent: true });
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Error clearing logo cache:", err);
  }
}

/**
 * Get total logo cache size
 */
export async function getLogoCacheSize(): Promise<number> {
  try {
    const files = await FileSystem.readDirectoryAsync(LOGO_CACHE_DIR);
    let totalSize = 0;

    for (const file of files) {
      const fileInfo = await FileSystem.getInfoAsync(`${LOGO_CACHE_DIR}${file}`);
      if (fileInfo.exists && "size" in fileInfo && fileInfo.size) {
        totalSize += fileInfo.size as number;
      }
    }

    return totalSize;
  } catch (err) {
    console.error("Error getting logo cache size:", err);
    return 0;
  }
}
