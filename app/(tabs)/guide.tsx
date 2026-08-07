import { FlatList, Text, View, Pressable, RefreshControl, TextInput, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useIPTV } from "@/lib/context/iptv-context";
import { useEPG } from "@/lib/context/epg-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { formatProgramTime, getProgramDuration } from "@/lib/utils/xmltv-parser";

export default function GuideScreen() {
  const colors = useColors();
  const { channels } = useIPTV();
  const { programs, isLoading, refreshEPG, epgSources, searchPrograms } = useEPG();

  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const activeSource = epgSources.find((s) => s.isActive);

  const handleRefresh = useCallback(async () => {
    if (!activeSource) return;
    setRefreshing(true);
    try {
      await refreshEPG(activeSource.id);
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  }, [activeSource, refreshEPG]);

  const displayPrograms = searchQuery ? searchPrograms(searchQuery) : programs;

  const renderProgramItem = ({ item }: { item: any }) => {
    const channel = channels.find((ch) => ch.id === item.channelId);
    const duration = getProgramDuration(item);
    const timeStr = formatProgramTime(item.startTime, item.endTime);

    return (
      <Pressable
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View className="mx-4 mb-3 p-3 bg-surface rounded-lg border border-border">
          {/* Channel Name */}
          <Text className="text-xs text-muted mb-1">{channel?.name || item.channelId}</Text>

          {/* Program Title */}
          <Text className="text-base font-semibold text-foreground mb-1">{item.title}</Text>

          {/* Time and Duration */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs text-muted">{timeStr}</Text>
            <Text className="text-xs text-muted">{duration} min</Text>
          </View>

          {/* Description */}
          {item.description && (
            <Text className="text-xs text-muted mb-2" numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {/* Category and Rating */}
          <View className="flex-row gap-2">
            {item.category && (
              <View className="bg-primary/20 px-2 py-1 rounded">
                <Text className="text-xs text-primary">{item.category}</Text>
              </View>
            )}
            {item.rating && (
              <View className="bg-warning/20 px-2 py-1 rounded">
                <Text className="text-xs text-warning">{item.rating}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-foreground mb-4">Program Guide</Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-surface rounded-lg px-3 py-2 mb-3">
          <MaterialIcons name="search" size={20} color={colors.muted} />
          <TextInput
            placeholder="Search programs..."
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
      </View>

      {/* EPG Source Info */}
      {activeSource && (
        <View className="px-4 pb-2">
          <Text className="text-xs text-muted">
            {activeSource.name} • {programs.length} programs
          </Text>
        </View>
      )}

      {/* Programs List */}
      {displayPrograms.length > 0 ? (
        <FlatList
          data={displayPrograms}
          renderItem={renderProgramItem}
          keyExtractor={(item) => item.id}
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
          {isLoading ? (
            <>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-foreground mt-4">Loading programs...</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="schedule" size={48} color={colors.muted} />
              <Text className="text-lg font-semibold text-foreground mt-4 text-center">
                {searchQuery ? "No programs found" : "No EPG data"}
              </Text>
              <Text className="text-sm text-muted mt-2 text-center">
                {searchQuery
                  ? "Try a different search term"
                  : "Go to Settings to add an EPG source"}
              </Text>
            </>
          )}
        </View>
      )}
    </ScreenContainer>
  );
}
