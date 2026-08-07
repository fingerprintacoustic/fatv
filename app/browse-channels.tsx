import { FlatList, Text, View, Pressable, RefreshControl, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useIPTV } from "@/lib/context/iptv-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function BrowseChannelsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { continent, country, category } = useLocalSearchParams<{
    continent: string;
    country: string;
    category: string;
  }>();
  const {
    getFilteredChannels,
    playChannel,
    isFavorite,
    toggleFavorite,
    hierarchicalFilter,
    setHierarchicalFilter,
    isLoading,
    refreshPlaylist,
    activePlaylist,
  } = useIPTV();

  const [refreshing, setRefreshing] = useState(false);
  const [showOnlyWorking, setShowOnlyWorking] = useState(false);

  if (!continent || !country) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-foreground">Invalid selection</Text>
      </ScreenContainer>
    );
  }

  // Get filtered channels
  let filteredChannels = getFilteredChannels();

  // Apply category filter if specified
  if (category && category !== "all") {
    filteredChannels = filteredChannels.filter((ch) => ch.category === category);
  }

  // Apply working channels filter
  if (showOnlyWorking) {
    filteredChannels = filteredChannels.filter((ch) => ch.healthStatus === "working");
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
      pathname: "../player",
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
    return colors.muted;
  };

  const handleBack = () => {
    router.back();
  };

  const renderChannelItem = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => handleChannelPress(item.id)}
      onLongPress={() => handleLongPress(item)}
      style={({ pressed }) => [{ flex: 1, margin: 8, opacity: pressed ? 0.7 : 1 }]}
    >
      <View className="bg-surface rounded-lg overflow-hidden">
        <View
          className="w-full aspect-square bg-gray-800 items-center justify-center relative"
          style={{ backgroundColor: colors.surface }}
        >
          {item.logo ? (
            <Text className="text-xs text-muted">📺</Text>
          ) : (
            <MaterialIcons name="tv" size={40} color={colors.primary} />
          )}

          {/* Health Status Badge */}
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

          {/* Favorite Badge */}
          {isFavorite(item.id) && (
            <View className="absolute top-1 left-1">
              <MaterialIcons name="favorite" size={16} color={colors.primary} />
            </View>
          )}
        </View>

        {/* Channel Name */}
        <View className="p-2">
          <Text className="text-sm font-semibold text-foreground text-center" numberOfLines={2}>
            {item.name}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-2 pb-4">
        <Pressable onPress={handleBack} className="mb-2">
          <View className="flex-row items-center">
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
            <Text className="text-sm text-primary ml-1">
              {continent} {">"}  {country}
              {category && category !== "all" && ` ${">"}  ${category}`}
            </Text>
          </View>
        </Pressable>
        <Text className="text-2xl font-bold text-foreground">Channels</Text>
      </View>

      {/* Filter Toggle */}
      <View className="px-4 pb-3">
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
            Working channels only ({filteredChannels.filter((c) => c.healthStatus === "working").length})
          </Text>
        </Pressable>
      </View>

      {/* Channels Grid */}
      {filteredChannels.length > 0 ? (
        <FlatList
          data={filteredChannels}
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
            No channels found
          </Text>
          <Text className="text-sm text-muted mt-2 text-center">
            {showOnlyWorking ? "Try disabling the working channels filter" : "No channels available for this selection"}
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}
