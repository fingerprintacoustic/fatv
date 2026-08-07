import { FlatList, Text, View, Pressable, RefreshControl, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useIPTV } from "@/lib/context/iptv-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const {
    channels,
    playChannel,
    searchChannels,
    isFavorite,
    toggleFavorite,
    isLoading,
    activePlaylist,
    refreshPlaylist,
  } = useIPTV();

  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showOnlyWorking, setShowOnlyWorking] = useState(false);

  // Filter channels based on search and working status
  let displayChannels = searchQuery ? searchChannels(searchQuery) : channels;
  if (showOnlyWorking) {
    displayChannels = displayChannels.filter((ch) => ch.healthStatus === "working");
  }

  const handleRefresh = useCallback(async () => {
    if (!activePlaylist) return;
    setRefreshing(true);
    try {
      await refreshPlaylist(activePlaylist.id);
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  }, [activePlaylist, refreshPlaylist]);

  const handleChannelPress = (channelId: string) => {
    playChannel(channelId);
    router.push({
      pathname: "/player",
      params: { channelId },
    });
  };

  const handleLongPress = (channel: any) => {
    if (channel.lastHealthCheck) {
      const lastChecked = new Date(channel.lastHealthCheck);
      const now = new Date();
      const diffMs = now.getTime() - lastChecked.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let timeAgo = "";
      if (diffMins < 1) {
        timeAgo = "Just now";
      } else if (diffMins < 60) {
        timeAgo = `${diffMins}m ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours}h ago`;
      } else {
        timeAgo = `${diffDays}d ago`;
      }

      Alert.alert(
        `${channel.name}`,
        `Status: ${channel.healthStatus === "working" ? "✓ Live" : channel.healthStatus === "failed" ? "✗ Dead" : "⏱ Checking"}\n\nLast checked: ${timeAgo}`,
        [{ text: "Close" }]
      );
    } else {
      toggleFavorite(channel.id);
    }
  };

  const getStatusColor = (healthStatus?: string) => {
    if (healthStatus === "working") return colors.success;
    if (healthStatus === "failed") return colors.error;
    return colors.muted; // checking
  };

  const renderChannelItem = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => handleChannelPress(item.id)}
      onLongPress={() => handleLongPress(item)}
      style={({ pressed }) => [
        {
          flex: 1,
          margin: 8,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View className="bg-surface rounded-lg overflow-hidden">
        {/* Channel Logo/Thumbnail */}
        <View
          className="w-full aspect-square bg-gray-800 items-center justify-center relative"
          style={{ backgroundColor: colors.surface }}
        >
          {item.logo ? (
            <Text className="text-xs text-muted">📺</Text>
          ) : (
            <MaterialIcons name="tv" size={40} color={colors.primary} />
          )}

          {/* Health Status Badge - Top Right */}
          <View className="absolute top-1 right-1">
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: getStatusColor(item.healthStatus),
                borderWidth: 2,
                borderColor: "rgba(255,255,255,0.3)",
              }}
            />
          </View>
        </View>

        {/* Channel Name */}
        <View className="p-2">
          <Text
            className="text-sm font-semibold text-foreground text-center"
            numberOfLines={2}
          >
            {item.name}
          </Text>

          {/* Favorite Badge */}
          {isFavorite(item.id) && (
            <View className="absolute top-1 left-1">
              <MaterialIcons name="favorite" size={16} color={colors.primary} />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-foreground mb-4">fatv</Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-surface rounded-lg px-3 py-2 mb-3">
          <MaterialIcons name="search" size={20} color={colors.muted} />
          <TextInput
            placeholder="Search channels..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-foreground"
            style={{ color: colors.foreground }}
          />
          {searchQuery && (
            <Pressable onPress={() => setSearchQuery("")}>
              <MaterialIcons name="close" size={20} color={colors.muted} />
            </Pressable>
          )}
        </View>

        {/* Filter Toggle */}
        <Pressable
          onPress={() => setShowOnlyWorking(!showOnlyWorking)}
          style={({ pressed }) => [
            {
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: showOnlyWorking ? colors.primary : colors.surface,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialIcons
            name={showOnlyWorking ? "check-circle" : "radio-button-unchecked"}
            size={18}
            color={showOnlyWorking ? colors.background : colors.muted}
          />
          <Text
            className="ml-2 text-sm font-medium"
            style={{
              color: showOnlyWorking ? colors.background : colors.foreground,
            }}
          >
            Working channels only
          </Text>
        </Pressable>
      </View>

      {/* Playlist Info */}
      {activePlaylist && (
        <View className="px-4 pb-2">
          <Text className="text-xs text-muted">
            {activePlaylist.name} • {displayChannels.length} of {channels.length} channels
            {showOnlyWorking && " (filtered)"}
          </Text>
          <Text className="text-xs text-muted mt-1">
            Long-press a channel to see last check time
          </Text>
        </View>
      )}

      {/* Channel Grid */}
      {displayChannels.length > 0 ? (
        <FlatList
          data={displayChannels}
          renderItem={renderChannelItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 4 }}
          contentContainerStyle={{ paddingBottom: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isLoading}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <View className="flex-1 items-center justify-center px-4">
          <MaterialIcons name="tv-off" size={48} color={colors.muted} />
          <Text className="text-lg font-semibold text-foreground mt-4 text-center">
            {searchQuery
              ? "No channels found"
              : showOnlyWorking
                ? "No working channels"
                : "No playlist loaded"}
          </Text>
          <Text className="text-sm text-muted mt-2 text-center">
            {searchQuery
              ? "Try a different search term"
              : showOnlyWorking
                ? "Try disabling the working channels filter"
                : "Go to Settings to add a playlist"}
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}
