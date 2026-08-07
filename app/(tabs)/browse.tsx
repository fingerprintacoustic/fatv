import { FlatList, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useIPTV } from "@/lib/context/iptv-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function BrowseScreen() {
  const router = useRouter();
  const colors = useColors();
  const { getContinents, setHierarchicalFilter, hierarchicalFilter } = useIPTV();

  const continents = getContinents();

  const handleContinentSelect = (continent: string) => {
    setHierarchicalFilter({ continent });
    router.push({
      pathname: "/browse-country",
      params: { continent },
    });
  };

  const handleReset = () => {
    setHierarchicalFilter({});
  };

  const renderContinentItem = ({ item }: { item: string }) => (
    <Pressable
      onPress={() => handleContinentSelect(item)}
      style={({ pressed }) => [
        {
          flex: 1,
          margin: 8,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        className="bg-surface rounded-lg p-4 items-center justify-center"
        style={{ minHeight: 100 }}
      >
        <MaterialIcons name="public" size={40} color={colors.primary} />
        <Text className="text-lg font-semibold text-foreground mt-2 text-center">
          {item}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-foreground mb-2">Browse</Text>
        <Text className="text-sm text-muted">Select a continent to get started</Text>
      </View>

      {/* Current Filter Display */}
      {hierarchicalFilter.continent && (
        <View className="px-4 pb-3 flex-row items-center justify-between bg-surface rounded-lg mx-4 p-3">
          <Text className="text-sm text-foreground font-medium">
            📍 {hierarchicalFilter.continent}
            {hierarchicalFilter.country && ` > ${hierarchicalFilter.country}`}
            {hierarchicalFilter.category && ` > ${hierarchicalFilter.category}`}
          </Text>
          <Pressable onPress={handleReset}>
            <MaterialIcons name="close" size={20} color={colors.primary} />
          </Pressable>
        </View>
      )}

      {/* Continents Grid */}
      {continents.length > 0 ? (
        <FlatList
          data={continents}
          renderItem={renderContinentItem}
          keyExtractor={(item) => item}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 4 }}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-4">
          <MaterialIcons name="language" size={48} color={colors.muted} />
          <Text className="text-lg font-semibold text-foreground mt-4 text-center">
            No continents available
          </Text>
          <Text className="text-sm text-muted mt-2 text-center">
            Load a playlist to browse channels by continent
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}
