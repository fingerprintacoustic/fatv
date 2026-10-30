import { View, Text, Pressable, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/App";
import { useRef, useState, useEffect } from "react";
import Video from "react-native-video";
import type { VideoRef } from "react-native-video";
import KeepAwake from "react-native-keep-awake";
import { ScreenContainer } from "@/components/screen-container";
import { useIPTV } from "@/lib/context/iptv-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

type Props = NativeStackScreenProps<RootStackParamList, "Player">;

export default function PlayerScreen({ navigation, route }: Props) {
  const colors = useColors();
  const channelId = route.params?.channelId;
  const { channels, isFavorite, toggleFavorite } = useIPTV();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef<VideoRef>(null);

  const currentChannel = channels.find((ch) => ch.id === channelId);

  useEffect(() => {
    KeepAwake.activate();
    return () => KeepAwake.deactivate();
  }, []);

  useEffect(() => {
    if (!currentChannel) {
      setError("Channel not found");
    } else {
      setError(null);
    }
  }, [currentChannel]);

  if (!currentChannel) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center bg-black">
        <Text className="text-foreground text-lg">Channel not found</Text>
        <Pressable
          onPress={() => navigation.goBack()}
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
            <Video
              ref={videoRef}
              source={{ uri: currentChannel.url }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
              controls
              playInBackground={false}
              enterPictureInPictureOnLeave
              onLoadStart={() => setIsLoading(true)}
              onLoad={() => setIsLoading(false)}
              onBuffer={({ isBuffering }) => setIsLoading(isBuffering)}
              onError={() => {
                setIsLoading(false);
                setError("Unable to play this stream");
              }}
            />
          )}

          {/* Overlay Controls */}
          {showControls && (
            <View className="absolute inset-0 flex-row items-start justify-between p-4">
              {/* Back Button */}
              <Pressable
                onPress={() => navigation.goBack()}
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
