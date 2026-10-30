import { FlatList, Text, View, Pressable } from "react-native";
import FastImage from "@d11/react-native-fast-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/App";
import { useCallback, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useIPTV } from "@/lib/context/iptv-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

export default function FavoritesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = useColors();
  const { favoriteChannels, playChannel, toggleFavorite } = useIPTV();
  const [failedLogoIds, setFailedLogoIds] = useState<Set<string>>(new Set());

  const markLogoFailed = useCallback((channelId: string) => {
    setFailedLogoIds((prev) => {
      if (prev.has(channelId)) return prev;
      const next = new Set(prev);
      next.add(channelId);
      return next;
    });
  }, []);

  const handleChannelPress = (channelId: string) => {
    playChannel(channelId);
    navigation.navigate("Player", { channelId });
  };

  const renderChannelItem = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => handleChannelPress(item.id)}
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
          className="w-full aspect-square bg-gray-800 items-center justify-center"
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
        </View>

        {/* Channel Name */}
        <View className="p-2">
          <Text
            className="text-sm font-semibold text-foreground text-center"
            numberOfLines={2}
          >
            {item.name}
          </Text>

          {/* Remove Button */}
          <Pressable
            onPress={() => toggleFavorite(item.id)}
            className="absolute top-1 right-1"
          >
            <MaterialIcons name="close" size={16} color={colors.error} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-4 pb-4">
        <Text className="text-2xl font-bold text-foreground">Favorites</Text>
      </View>

      {/* Favorites Grid */}
      {favoriteChannels.length > 0 ? (
        <FlatList
          data={favoriteChannels}
          renderItem={renderChannelItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 4 }}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-4">
          <MaterialIcons name="favorite-border" size={48} color={colors.muted} />
          <Text className="text-lg font-semibold text-foreground mt-4 text-center">
            No favorites yet
          </Text>
          <Text className="text-sm text-muted mt-2 text-center">
            Long-press a channel to add it to your favorites
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}
