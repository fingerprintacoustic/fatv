import { FlatList, Text, View, Pressable, RefreshControl, TextInput, Alert } from "react-native";
import FastImage from "@d11/react-native-fast-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/App";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { SubscriptionLinks } from "@/components/subscription-links";
import { useIPTV } from "@/lib/context/iptv-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
  const [failedLogoIds, setFailedLogoIds] = useState<Set<string>>(new Set());

  const markLogoFailed = useCallback((channelId: string) => {
    setFailedLogoIds((prev) => {
      if (prev.has(channelId)) return prev;
      const next = new Set(prev);
      next.add(channelId);
      return next;
    });
  }, []);

  // Filter channels based on search and working status
  let displayChannels = searchQuery ? searchChannels(searchQuery) : channels;
  if (showOnlyWorking) {
    // With thousands of channels and only a few checked concurrently in the
    // background, most channels sit in "checking" for a long time — strictly
    // requiring "working" would show almost nothing. Excluding only
    // confirmed failures keeps the toggle actually useful.
    displayChannels = displayChannels.filter((ch) => ch.healthStatus !== "failed");
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
    navigation.navigate("Player", { channelId });
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
      <View className="bg-surface rounded-lg overflow-hidden border border-border" style={{ borderColor: "#3A3A3A" }}>
        {/* Channel Logo/Thumbnail */}
        <View
          className="w-full aspect-square bg-gray-800 items-center justify-center relative"
          style={{ backgroundColor: colors.surface, aspectRatio: 1 }}
        >
          {item.logo && !failedLogoIds.has(item.id) ? (
            <FastImage
              source={{ uri: item.logo, priority: FastImage.priority.normal }}
              style={{ width: "100%", height: "100%" }}
              resizeMode={FastImage.resizeMode.contain}
              onError={() => markLogoFailed(item.id)}
            />
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

      <SubscriptionLinks />

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
