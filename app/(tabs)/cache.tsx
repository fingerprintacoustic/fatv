/**
 * Cache Management Screen
 * Allows users to view and manage offline playlist cache
 */

import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import {
  getAllCachedPlaylists,
  getTotalCacheSize,
  clearPlaylistCache,
  clearAllPlaylistCache,
  formatCacheSize,
  OfflinePlaylist,
} from "@/lib/utils/offline-storage";

export default function CacheScreen() {
  const colors = useColors();
  const [cachedPlaylists, setCachedPlaylists] = useState<OfflinePlaylist[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCacheInfo();
  }, []);

  const loadCacheInfo = async () => {
    try {
      setIsLoading(true);
      const playlists = await getAllCachedPlaylists();
      const size = await getTotalCacheSize();
      setCachedPlaylists(playlists);
      setTotalSize(size);
    } catch (err) {
      console.error("Error loading cache info:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearPlaylist = (playlistId: string, playlistName: string) => {
    Alert.alert(
      "Clear Cache",
      `Remove cached data for "${playlistName}"?`,
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Clear",
          onPress: async () => {
            try {
              await clearPlaylistCache(playlistId);
              await loadCacheInfo();
            } catch (err) {
              Alert.alert("Error", "Failed to clear cache");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Cache",
      "Remove all cached playlists and EPG data?",
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Clear All",
          onPress: async () => {
            try {
              await clearAllPlaylistCache();
              await loadCacheInfo();
            } catch (err) {
              Alert.alert("Error", "Failed to clear cache");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-2">Offline Storage</Text>
          <Text className="text-muted">Manage cached playlists and EPG data</Text>
        </View>

        {/* Storage Summary */}
        <View
          className="bg-surface rounded-lg p-4 mb-6 border border-border"
          style={{ borderColor: colors.border }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-muted">Total Cache Size</Text>
            <Text className="text-lg font-bold text-primary">{formatCacheSize(totalSize)}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-muted">Cached Playlists</Text>
            <Text className="text-lg font-bold text-foreground">{cachedPlaylists.length}</Text>
          </View>
        </View>

        {/* Cached Playlists List */}
        {cachedPlaylists.length > 0 ? (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">Cached Playlists</Text>
            {cachedPlaylists.map((playlist) => (
              <View
                key={playlist.id}
                className="bg-surface rounded-lg p-4 mb-3 border border-border flex-row items-center justify-between"
                style={{ borderColor: colors.border }}
              >
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{playlist.name}</Text>
                  <Text className="text-sm text-muted mt-1">
                    {playlist.channels.length} channels • {formatCacheSize(playlist.cacheSize || 0)}
                  </Text>
                  {playlist.cachedAt && (
                    <Text className="text-xs text-muted mt-1">
                      Cached: {new Date(playlist.cachedAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={() => handleClearPlaylist(playlist.id, playlist.name)}
                  style={({ pressed }) => [
                    {
                      padding: 8,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <MaterialIcons name="delete" size={24} color={colors.error} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View className="flex-1 justify-center items-center">
            <MaterialIcons name="cloud-off" size={48} color={colors.muted} />
            <Text className="text-muted text-center mt-4">No cached playlists</Text>
            <Text className="text-muted text-center text-sm mt-2">
              Cache playlists from the Playlists tab for offline access
            </Text>
          </View>
        )}

        {/* Clear All Button */}
        {cachedPlaylists.length > 0 && (
          <Pressable
            onPress={handleClearAll}
            style={({ pressed }) => [
              {
                backgroundColor: colors.error,
                padding: 12,
                borderRadius: 8,
                marginTop: 16,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text className="text-white text-center font-semibold">Clear All Cache</Text>
          </Pressable>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
