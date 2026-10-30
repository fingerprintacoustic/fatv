import { FlatList, Text, View, Pressable } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/App";
import { ScreenContainer } from "@/components/screen-container";
import { useIPTV } from "@/lib/context/iptv-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

export default function BrowseCategoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "BrowseCategory">>();
  const colors = useColors();
  const { continent, country } = route.params;
  const { getCategories, setHierarchicalFilter, hierarchicalFilter, getFilteredChannels } = useIPTV();

  if (!continent || !country) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-foreground">Invalid selection</Text>
      </ScreenContainer>
    );
  }

  const categories = getCategories(country);

  const handleCategorySelect = (category: string) => {
    setHierarchicalFilter({ ...hierarchicalFilter, category });
    navigation.navigate("BrowseChannels", { continent, country, category });
  };

  const handleViewAll = () => {
    // View all channels without category filter
    navigation.navigate("BrowseChannels", { continent, country, category: "all" });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderCategoryItem = ({ item }: { item: string }) => (
    <Pressable
      onPress={() => handleCategorySelect(item)}
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
        <MaterialIcons name="category" size={40} color={colors.primary} />
        <Text className="text-base font-semibold text-foreground mt-2 text-center" numberOfLines={2}>
          {item}
        </Text>
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
            </Text>
          </View>
        </Pressable>
        <Text className="text-2xl font-bold text-foreground">Categories</Text>
        <Text className="text-sm text-muted">Select a category or view all</Text>
      </View>

      {/* View All Button */}
      {categories.length > 0 && (
        <Pressable
          onPress={handleViewAll}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, marginHorizontal: 16, marginBottom: 12 }]}
        >
          <View className="bg-primary rounded-lg p-3 flex-row items-center justify-center">
            <MaterialIcons name="view-list" size={20} color={colors.background} />
            <Text className="text-base font-semibold text-background ml-2">View All Channels</Text>
          </View>
        </Pressable>
      )}

      {/* Categories Grid */}
      {categories.length > 0 ? (
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 4 }}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-4">
          <MaterialIcons name="inbox" size={48} color={colors.muted} />
          <Text className="text-lg font-semibold text-foreground mt-4 text-center">
            No categories found
          </Text>
          <Text className="text-sm text-muted mt-2 text-center">
            No channels available for {country}
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}
