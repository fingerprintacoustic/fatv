/**
 * Channel Health Check Utility
 * Validates channel stream URLs and filters out non-working channels
 */

import { Channel } from "@/lib/types/iptv";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HEALTH_CHECK_STORAGE_KEY = "@fatv_channel_health_check";
const HEALTH_CHECK_TIMEOUT = 5000; // 5 second timeout per channel
const HEALTH_CHECK_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

interface ChannelHealthStatus {
  channelId: string;
  isWorking: boolean;
  lastChecked: number;
  failureCount?: number;
}

/**
 * Check if a single channel's stream URL is accessible
 * Uses a HEAD request with timeout to quickly verify channel availability
 */
export async function checkChannelHealth(channel: Channel): Promise<boolean> {
  try {
    // Skip health check for channels without URLs
    if (!channel.url || channel.url.trim() === "") {
      return false;
    }

    // Add timeout to prevent hanging on dead streams
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    try {
      // Try to fetch just the headers (HEAD request)
      // If that fails, try a GET request with range header to avoid downloading the whole stream
      const response = await fetch(channel.url, {
        method: "HEAD",
        signal: controller.signal,
      }).catch(() =>
        // Fallback to GET with range header if HEAD fails
        fetch(channel.url, {
          method: "GET",
          headers: { Range: "bytes=0-1" },
          signal: controller.signal,
        })
      );

      clearTimeout(timeoutId);

      // Consider 2xx and 3xx status codes as working
      // Some streams return 206 (Partial Content) which is fine
      return response.status >= 200 && response.status < 400;
    } catch (err) {
      clearTimeout(timeoutId);
      return false;
    }
  } catch (err) {
    console.warn(`Health check failed for channel ${channel.name}:`, err);
    return false;
  }
}

/**
 * Check multiple channels in parallel with concurrency limit
 * Limits concurrent requests to avoid overwhelming the network
 */
export async function checkMultipleChannels(
  channels: Channel[],
  concurrency: number = 5
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  const queue = [...channels];
  const active: Promise<void>[] = [];

  // Create worker coroutines
  for (let i = 0; i < concurrency; i++) {
    const worker = async () => {
      while (queue.length > 0) {
        const channel = queue.shift();
        if (!channel) break;

        try {
          const isWorking = await checkChannelHealth(channel);
          results.set(channel.id, isWorking);
        } catch (err) {
          results.set(channel.id, false);
        }
      }
    };
    active.push(worker());
  }

  await Promise.all(active);
  return results;
}

/**
 * Enrich channels with health status information
 * Adds healthStatus and lastHealthCheck fields to channels
 */
export async function enrichChannelsWithHealthStatus(channels: Channel[]): Promise<Channel[]> {
  try {
    const cachedData = await AsyncStorage.getItem(HEALTH_CHECK_STORAGE_KEY);
    const healthStatus: Map<string, ChannelHealthStatus> = cachedData
      ? new Map(JSON.parse(cachedData))
      : new Map();

    const enrichedChannels = channels.map((channel) => {
      const status = healthStatus.get(channel.id);
      return {
        ...channel,
        healthStatus: (status?.isWorking ? "working" : status ? "failed" : "checking") as "working" | "failed" | "checking" | undefined,
        lastHealthCheck: status?.lastChecked,
      };
    });

    return enrichedChannels as Channel[];
  } catch (err) {
    console.error("Error enriching channels with health status:", err);
    return channels;
  }
}

/**
 * Filter channels to only include working ones
 * Uses cached health check results when available
 */
export async function filterWorkingChannels(channels: Channel[]): Promise<Channel[]> {
  try {
    // Load cached health check data
    const cachedData = await AsyncStorage.getItem(HEALTH_CHECK_STORAGE_KEY);
    const healthStatus: Map<string, ChannelHealthStatus> = cachedData
      ? new Map(JSON.parse(cachedData))
      : new Map();

    const now = Date.now();
    const needsCheck: Channel[] = [];
    const working: Channel[] = [];

    // Separate channels into those that need checking and those with valid cache
    for (const channel of channels) {
      const status = healthStatus.get(channel.id);

      if (status && now - status.lastChecked < HEALTH_CHECK_CACHE_DURATION) {
        // Use cached result
        if (status.isWorking) {
          working.push(channel);
        }
      } else {
        // Needs health check
        needsCheck.push(channel);
      }
    }

    // Check channels that need verification (in background, don't block UI)
    if (needsCheck.length > 0) {
      // Run health checks in background
      checkMultipleChannels(needsCheck, 3).then((results) => {
        // Update cache with new results
        results.forEach((isWorking, channelId) => {
          healthStatus.set(channelId, {
            channelId,
            isWorking,
            lastChecked: Date.now(),
            failureCount: isWorking ? 0 : (healthStatus.get(channelId)?.failureCount || 0) + 1,
          });
        });

        // Save updated cache
        AsyncStorage.setItem(
          HEALTH_CHECK_STORAGE_KEY,
          JSON.stringify(Array.from(healthStatus.entries()))
        ).catch((err) => console.error("Failed to save health check cache:", err));
      });

      // Return immediately with cached working channels
      // New checks will update the list in the background
      return working;
    }

    return working;
  } catch (err) {
    console.error("Error filtering working channels:", err);
    // If filtering fails, return all channels
    return channels;
  }
}

/**
 * Clear health check cache to force re-validation
 */
export async function clearHealthCheckCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HEALTH_CHECK_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear health check cache:", err);
  }
}

/**
 * Get health check statistics
 */
export async function getHealthCheckStats(): Promise<{
  totalChannels: number;
  workingChannels: number;
  deadChannels: number;
  lastUpdated: number;
}> {
  try {
    const cachedData = await AsyncStorage.getItem(HEALTH_CHECK_STORAGE_KEY);
    if (!cachedData) {
      return {
        totalChannels: 0,
        workingChannels: 0,
        deadChannels: 0,
        lastUpdated: 0,
      };
    }

    const healthStatus: ChannelHealthStatus[] = JSON.parse(cachedData).map(
      ([_, status]: [string, ChannelHealthStatus]) => status
    );

    const working = healthStatus.filter((s) => s.isWorking).length;
    const dead = healthStatus.filter((s) => !s.isWorking).length;

    return {
      totalChannels: healthStatus.length,
      workingChannels: working,
      deadChannels: dead,
      lastUpdated: Math.max(...healthStatus.map((s) => s.lastChecked), 0),
    };
  } catch (err) {
    console.error("Error getting health check stats:", err);
    return {
      totalChannels: 0,
      workingChannels: 0,
      deadChannels: 0,
      lastUpdated: 0,
    };
  }
}
