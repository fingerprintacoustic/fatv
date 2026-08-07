/**
 * IPTV Context Provider
 * Manages playlists, channels, favorites, and playback state
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Channel, Playlist, FavoriteChannel, PlaybackState, HierarchicalFilter } from "@/lib/types/iptv";
import { fetchAndParseM3U } from "@/lib/utils/m3u-parser";
import { filterWorkingChannels, enrichChannelsWithHealthStatus, clearHealthCheckCache } from "@/lib/utils/channel-health-check";
import { initLogoCacheDir } from "@/lib/utils/channel-logo-cache";
import { parseChannelHierarchy, filterChannelsByHierarchy, getUniqueContinents, getUniqueCountries, getUniqueCategories } from "@/lib/utils/hierarchical-parser";

interface IPTVContextType {
  // Playlists
  playlists: Playlist[];
  activePlaylist: Playlist | null;
  addPlaylist: (url: string, name: string) => Promise<void>;
  removePlaylist: (id: string) => Promise<void>;
  setActivePlaylist: (id: string) => Promise<void>;
  refreshPlaylist: (id: string) => Promise<void>;

  // Channels
  channels: Channel[];
  searchChannels: (query: string) => Channel[];

  // Hierarchical filtering
  hierarchicalFilter: HierarchicalFilter;
  setHierarchicalFilter: (filter: HierarchicalFilter) => void;
  getContinents: () => string[];
  getCountries: (continent: string) => string[];
  getCategories: (country: string) => string[];
  getFilteredChannels: () => Channel[];

  // Favorites
  favorites: FavoriteChannel[];
  isFavorite: (channelId: string) => boolean;
  toggleFavorite: (channelId: string) => Promise<void>;
  favoriteChannels: Channel[];

  // Playback
  playbackState: PlaybackState;
  playChannel: (channelId: string) => void;
  stopPlayback: () => void;

  // Loading states
  isLoading: boolean;
  error: string | null;
}

const IPTVContext = createContext<IPTVContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PLAYLISTS: "@fatv_playlists",
  FAVORITES: "@fatv_favorites",
  PLAYBACK_STATE: "@fatv_playback_state",
  DEFAULT_PLAYLIST_LOADED: "@fatv_default_playlist_loaded",
};

const DEFAULT_IPTV_URL = "https://iptv-org.github.io/iptv/index.m3u";
const DEFAULT_IPTV_NAME = "IPTV-Org";

export function IPTVProvider({ children }: { children: React.ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favorites, setFavorites] = useState<FavoriteChannel[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentChannelId: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
  });
  const [hierarchicalFilter, setHierarchicalFilter] = useState<HierarchicalFilter>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved state on mount
  useEffect(() => {
    loadSavedState();
    initLogoCacheDir();
  }, []);

  // Set up periodic health check every 10 minutes
  useEffect(() => {
    const healthCheckInterval = setInterval(() => {
      console.log("Running periodic channel health check...");
      // Trigger a refresh of the active playlist to re-filter channels
      const activePlaylistId = playlists.find((p) => p.isActive)?.id;
      if (activePlaylistId) {
        refreshPlaylist(activePlaylistId).catch((err) =>
          console.warn("Periodic health check failed:", err)
        );
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(healthCheckInterval);
  }, [playlists]);

  // Save state to AsyncStorage whenever it changes
  useEffect(() => {
    savePlaylists();
  }, [playlists]);

  useEffect(() => {
    saveFavorites();
  }, [favorites]);

  async function loadSavedState() {
    try {
      const [playlistsData, favoritesData, playbackData, defaultLoaded] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PLAYLISTS),
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
        AsyncStorage.getItem(STORAGE_KEYS.PLAYBACK_STATE),
        AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_PLAYLIST_LOADED),
      ]);

      if (playlistsData) {
        setPlaylists(JSON.parse(playlistsData));
      } else if (defaultLoaded !== "true") {
        // Load default IPTV-Org playlist on first launch
        await loadDefaultPlaylist();
      }

      if (favoritesData) setFavorites(JSON.parse(favoritesData));
      if (playbackData) setPlaybackState(JSON.parse(playbackData));
    } catch (err) {
      console.error("Error loading saved state:", err);
    }
  }

  async function loadDefaultPlaylist() {
    try {
      console.log("Loading default IPTV-Org playlist...");
      
      let channels: Channel[] = [];
      let retries = 0;
      const maxRetries = 2;
      
      // Retry logic for network failures
      while (retries < maxRetries && channels.length === 0) {
        try {
          channels = await fetchAndParseM3U(DEFAULT_IPTV_URL);
          if (channels.length > 0) {
            console.log(`Fetched ${channels.length} channels from IPTV-Org`);
            break;
          }
        } catch (fetchErr) {
          retries++;
          console.warn(`Fetch attempt ${retries} failed:`, fetchErr);
          if (retries < maxRetries) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      // If still no channels, create empty playlist
      if (channels.length === 0) {
        console.warn("Failed to fetch channels after retries, creating empty playlist");
        channels = [];
      }

      const defaultPlaylist: Playlist = {
        id: `playlist-default-${Date.now()}`,
        name: DEFAULT_IPTV_NAME,
        url: DEFAULT_IPTV_URL,
        channels: channels,
        lastUpdated: Date.now(),
        isActive: true,
      };

      setPlaylists([defaultPlaylist]);
      await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_PLAYLIST_LOADED, "true");
      console.log(`Default playlist loaded with ${channels.length} channels`);

      // Run health check in background (don't block UI)
      if (channels.length > 0) {
        filterWorkingChannels(channels)
          .then((workingChannels) => {
            if (workingChannels.length > 0) {
              console.log(`Health check found ${workingChannels.length} working channels`);
              setPlaylists((prev) =>
                prev.map((p) =>
                  p.id === defaultPlaylist.id ? { ...p, channels: workingChannels } : p
                )
              );
            }
          })
          .catch((err) => console.warn("Background health check failed:", err));
      }
    } catch (err) {
      console.error("Error loading default playlist:", err);
      // Create empty playlist so user can add one manually
      const emptyPlaylist: Playlist = {
        id: `playlist-default-${Date.now()}`,
        name: DEFAULT_IPTV_NAME,
        url: DEFAULT_IPTV_URL,
        channels: [],
        lastUpdated: Date.now(),
        isActive: true,
      };
      setPlaylists([emptyPlaylist]);
      await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_PLAYLIST_LOADED, "true");
    }
  }

  async function savePlaylists() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    } catch (err) {
      console.error("Error saving playlists:", err);
    }
  }

  async function saveFavorites() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (err) {
      console.error("Error saving favorites:", err);
    }
  }

  async function addPlaylist(url: string, name: string) {
    setIsLoading(true);
    setError(null);
    try {
      const channels = await fetchAndParseM3U(url);
      // Filter to only working channels
      const workingChannels = await filterWorkingChannels(channels);

      const newPlaylist: Playlist = {
        id: `playlist-${Date.now()}`,
        name,
        url,
        channels: workingChannels.length > 0 ? workingChannels : channels, // Use filtered if available
        lastUpdated: Date.now(),
        isActive: playlists.length === 0, // First playlist is active by default
      };

      setPlaylists((prev) => [...prev, newPlaylist]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load playlist";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function removePlaylist(id: string) {
    setPlaylists((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      // If removed playlist was active, activate another one
      if (updated.length > 0 && !updated.some((p) => p.isActive)) {
        updated[0].isActive = true;
      }
      return updated;
    });
  }

  async function setActivePlaylist(id: string) {
    setPlaylists((prev) =>
      prev.map((p) => ({
        ...p,
        isActive: p.id === id,
      }))
    );
  }

  async function refreshPlaylist(id: string) {
    setIsLoading(true);
    setError(null);
    try {
      const playlist = playlists.find((p) => p.id === id);
      if (!playlist) throw new Error("Playlist not found");

      const channels = await fetchAndParseM3U(playlist.url);
      // Filter to only working channels
      const workingChannels = await filterWorkingChannels(channels);

      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                channels: workingChannels.length > 0 ? workingChannels : channels, // Use filtered if available
                lastUpdated: Date.now(),
              }
            : p
        )
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to refresh playlist";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  const activePlaylist = playlists.find((p) => p.isActive) || null;
  const [enrichedChannels, setEnrichedChannels] = useState<Channel[]>([]);

  // Parse hierarchy for all channels when they load
  useEffect(() => {
    if (activePlaylist?.channels) {
      activePlaylist.channels.forEach((channel) => {
        if (!channel.continent && !channel.country && !channel.category) {
          parseChannelHierarchy(channel);
        }
      });
    }
  }, [activePlaylist?.channels]);

  // Enrich channels with health status whenever they change
  useEffect(() => {
    if (activePlaylist?.channels) {
      enrichChannelsWithHealthStatus(activePlaylist.channels).then(setEnrichedChannels);
    }
  }, [activePlaylist?.channels]);

  const channels = enrichedChannels.length > 0 ? enrichedChannels : activePlaylist?.channels || [];

  // Hierarchical filter methods
  const getContinents = () => getUniqueContinents(channels);
  const getCountries = (continent: string) => getUniqueCountries(channels, continent);
  const getCategories = (country: string) => getUniqueCategories(channels, country);
  const getFilteredChannels = () => filterChannelsByHierarchy(channels, hierarchicalFilter);

  function searchChannels(query: string): Channel[] {
    const lowerQuery = query.toLowerCase();
    return channels.filter(
      (ch) =>
        ch.name.toLowerCase().includes(lowerQuery) ||
        ch.group?.toLowerCase().includes(lowerQuery)
    );
  }

  function isFavorite(channelId: string): boolean {
    return favorites.some((fav) => fav.channelId === channelId);
  }

  async function toggleFavorite(channelId: string) {
    setFavorites((prev) => {
      if (prev.some((fav) => fav.channelId === channelId)) {
        return prev.filter((fav) => fav.channelId !== channelId);
      } else {
        return [
          ...prev,
          {
            channelId,
            playlistId: activePlaylist?.id || "",
            addedAt: Date.now(),
          },
        ];
      }
    });
  }

  const favoriteChannels = channels.filter((ch) => isFavorite(ch.id));

  // Export enrichChannelsWithHealthStatus for manual updates
  const getEnrichedChannels = enrichChannelsWithHealthStatus;

  function playChannel(channelId: string) {
    setPlaybackState((prev) => ({
      ...prev,
      currentChannelId: channelId,
      isPlaying: true,
      currentTime: 0,
    }));
  }

  function stopPlayback() {
    setPlaybackState((prev) => ({
      ...prev,
      isPlaying: false,
      currentTime: 0,
    }));
  }

  const value: IPTVContextType = {
    playlists,
    activePlaylist,
    addPlaylist,
    removePlaylist,
    setActivePlaylist,
    refreshPlaylist,
    channels,
    searchChannels,
    hierarchicalFilter,
    setHierarchicalFilter,
    getContinents,
    getCountries,
    getCategories,
    getFilteredChannels,
    favorites,
    isFavorite,
    toggleFavorite,
    favoriteChannels,
    playbackState,
    playChannel,
    stopPlayback,
    isLoading,
    error,
  };

  return <IPTVContext.Provider value={value}>{children}</IPTVContext.Provider>;
}

export function useIPTV() {
  const context = useContext(IPTVContext);
  if (!context) {
    throw new Error("useIPTV must be used within IPTVProvider");
  }
  return context;
}
