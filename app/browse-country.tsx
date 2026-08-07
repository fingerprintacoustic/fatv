import { FlatList, Text, View, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useIPTV } from "@/lib/context/iptv-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function BrowseCountryScreen() {
  const router = useRouter();
  const colors = useColors();
  const { continent } = useLocalSearchParams<{ continent: string }>();
  const { getCountries, setHierarchicalFilter, hierarchicalFilter } = useIPTV();

  if (!continent) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-foreground">Invalid continent</Text>
      </ScreenContainer>
    );
  }

  const countries = getCountries(continent);

  const handleCountrySelect = (country: string) => {
    setHierarchicalFilter({ ...hierarchicalFilter, country });
    router.push({
      pathname: "/browse-category",
      params: { continent, country },
    });
  };

  const handleBack = () => {
    router.back();
  };

  const renderCountryItem = ({ item }: { item: string }) => (
    <Pressable
      onPress={() => handleCountrySelect(item)}
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
        style={{ minHeight: 80 }}
      >
        <MaterialIcons name="flag" size={32} color={colors.primary} />
        <Text className="text-base font-semibold text-foreground mt-2 text-center" numberOfLines={2}>
          {item}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-2 pb-4 flex-row items-center justify-between">
        <View className="flex-1">
          <Pressable onPress={handleBack} className="mb-2">
            <View className="flex-row items-center">
              <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
              <Text className="text-sm text-primary ml-1">{continent}</Text>
            </View>
          </Pressable>
          <Text className="text-2xl font-bold text-foreground">Countries</Text>
          <Text className="text-sm text-muted">Select a country</Text>
        </View>
      </View>

      {/* Countries Grid */}
      {countries.length > 0 ? (
        <FlatList
          data={countries}
          renderItem={renderCountryItem}
          keyExtractor={(item) => item}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 4 }}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-4">
          <MaterialIcons name="location-off" size={48} color={colors.muted} />
          <Text className="text-lg font-semibold text-foreground mt-4 text-center">
            No countries found
          </Text>
          <Text className="text-sm text-muted mt-2 text-center">
            No channels available for {continent}
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}
