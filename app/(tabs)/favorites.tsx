import { FlatList, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useIPTV } from "@/lib/context/iptv-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function FavoritesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { favoriteChannels, playChannel, toggleFavorite } = useIPTV();

  const handleChannelPress = (channelId: string) => {
    playChannel(channelId);
    router.push({
      pathname: "/player",
      params: { channelId },
    });
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
      <View className="bg-surface rounded-lg overflow-hidden">
        {/* Channel Logo/Thumbnail */}
        <View
          className="w-full aspect-square bg-gray-800 items-center justify-center"
          style={{ backgroundColor: colors.surface }}
        >
          {item.logo ? (
            <Text className="text-xs text-muted">📺</Text>
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
