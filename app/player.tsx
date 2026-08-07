import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { VideoView, useVideoPlayer } from "expo-video";
import { ScreenContainer } from "@/components/screen-container";
import { useIPTV } from "@/lib/context/iptv-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useKeepAwake } from "expo-keep-awake";

export default function PlayerScreen() {
  useKeepAwake();

  const router = useRouter();
  const colors = useColors();
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { channels, isFavorite, toggleFavorite } = useIPTV();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);

  const currentChannel = channels.find((ch) => ch.id === channelId);

  const player = useVideoPlayer(currentChannel?.url || "", (player) => {
    player.play();
  });

  useEffect(() => {
    if (!currentChannel) {
      setError("Channel not found");
    } else {
      setIsLoading(false);
    }
  }, [currentChannel]);

  if (!currentChannel) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center bg-black">
        <Text className="text-foreground text-lg">Channel not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-6 py-3 bg-primary rounded-lg"
        >
          <Text className="text-background font-semibold">Go Back</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 bg-black" edges={["left", "right"]}>
      <View className="flex-1 bg-black">
        {/* Video Player */}
        <View className="flex-1 bg-black items-center justify-center">
          {isLoading && (
            <View className="absolute inset-0 items-center justify-center bg-black z-10">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-foreground mt-4">Loading stream...</Text>
            </View>
          )}

          {error ? (
            <View className="absolute inset-0 items-center justify-center bg-black z-10">
              <MaterialIcons name="error-outline" size={48} color={colors.error} />
              <Text className="text-foreground mt-4 text-center px-4">{error}</Text>
            </View>
          ) : (
            <VideoView
              player={player}
              style={{ width: "100%", height: "100%" }}
              nativeControls={true}
            />
          )}

          {/* Overlay Controls */}
          {showControls && (
            <View className="absolute inset-0 flex-row items-start justify-between p-4">
              {/* Back Button */}
              <Pressable
                onPress={() => router.back()}
                className="bg-black/50 rounded-full p-2"
              >
                <MaterialIcons name="arrow-back" size={24} color="white" />
              </Pressable>

              {/* Channel Info & Favorite */}
              <View className="flex-1 ml-4">
                <Text className="text-white font-bold text-lg">{currentChannel.name}</Text>
                {currentChannel.group && (
                  <Text className="text-white/70 text-sm">{currentChannel.group}</Text>
                )}
              </View>

              {/* Favorite Button */}
              <Pressable
                onPress={() => toggleFavorite(currentChannel.id)}
                className="bg-black/50 rounded-full p-2"
              >
                <MaterialIcons
                  name={isFavorite(currentChannel.id) ? "favorite" : "favorite-border"}
                  size={24}
                  color={isFavorite(currentChannel.id) ? colors.primary : "white"}
                />
              </Pressable>
            </View>
          )}
        </View>

        {/* Bottom Info Bar (always visible) */}
        <View className="bg-black/80 px-4 py-3 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-foreground font-semibold">{currentChannel.name}</Text>
            <Text className="text-muted text-xs mt-1">
              {currentChannel.group || "No category"}
            </Text>
          </View>
          <Pressable
            onPress={() => setShowControls(!showControls)}
            className="p-2"
          >
            <MaterialIcons
              name={showControls ? "visibility" : "visibility-off"}
              size={20}
              color={colors.primary}
            />
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
