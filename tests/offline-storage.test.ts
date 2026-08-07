import { describe, it, expect, beforeEach, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  cachePlaylist,
  getCachedPlaylist,
  getCacheMetadata,
  clearPlaylistCache,
  getTotalCacheSize,
  formatCacheSize,
} from "../lib/utils/offline-storage";
import { Playlist } from "../lib/types/iptv";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn(),
    multiRemove: vi.fn(),
    getAllKeys: vi.fn(),
  },
}));

describe("Offline Storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("cachePlaylist", () => {
    it("should cache a playlist with metadata", async () => {
      const mockPlaylist: Playlist = {
        id: "test-playlist",
        name: "Test Playlist",
        url: "https://example.com/playlist.m3u",
        channels: [
          {
            id: "ch1",
            name: "Channel 1",
            url: "https://example.com/stream1.m3u8",
            group: "Sports",
          },
        ],
        lastUpdated: Date.now(),
        isActive: true,
      };

      await cachePlaylist(mockPlaylist);

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
    });
  });

  describe("formatCacheSize", () => {
    it("should format bytes correctly", () => {
      expect(formatCacheSize(0)).toBe("0 B");
      expect(formatCacheSize(1024)).toBe("1 KB");
      expect(formatCacheSize(1024 * 1024)).toBe("1 MB");
      expect(formatCacheSize(1024 * 1024 * 1024)).toBe("1 GB");
    });

    it("should handle decimal values", () => {
      const result = formatCacheSize(1536); // 1.5 KB
      expect(result).toContain("KB");
    });
  });

  describe("getCachedPlaylist", () => {
    it("should return null if playlist not cached", async () => {
      (AsyncStorage.getItem as any).mockResolvedValueOnce(null);

      const result = await getCachedPlaylist("non-existent");

      expect(result).toBeNull();
    });

    it("should return cached playlist", async () => {
      const mockPlaylist: Playlist = {
        id: "test-playlist",
        name: "Test Playlist",
        url: "https://example.com/playlist.m3u",
        channels: [],
        lastUpdated: Date.now(),
        isActive: true,
      };

      (AsyncStorage.getItem as any).mockResolvedValueOnce(JSON.stringify(mockPlaylist));

      const result = await getCachedPlaylist("test-playlist");

      expect(result).toEqual(mockPlaylist);
    });
  });

  describe("clearPlaylistCache", () => {
    it("should remove playlist cache and metadata", async () => {
      await clearPlaylistCache("test-playlist");

      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(2);
    });
  });

  describe("getTotalCacheSize", () => {
    it("should calculate total cache size", async () => {
      const mockMetadata = [
        JSON.stringify({ size: 1024 }),
        JSON.stringify({ size: 2048 }),
      ];

      (AsyncStorage.getAllKeys as any).mockResolvedValueOnce([
        "@fatv_cache_metadata_1",
        "@fatv_cache_metadata_2",
      ]);

      (AsyncStorage.getItem as any)
        .mockResolvedValueOnce(mockMetadata[0])
        .mockResolvedValueOnce(mockMetadata[1]);

      const result = await getTotalCacheSize();

      expect(result).toBe(3072);
    });
  });
});
