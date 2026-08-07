import { FlatList, Text, View, Pressable, TextInput, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useEPG } from "@/lib/context/epg-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function EPGSettingsScreen() {
  const colors = useColors();
  const {
    epgSources,
    addEPGSource,
    removeEPGSource,
    setActiveEPGSource,
    refreshEPG,
    isLoading,
    error,
  } = useEPG();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceName, setNewSourceName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddEPGSource = async () => {
    if (!newSourceUrl.trim() || !newSourceName.trim()) {
      Alert.alert("Error", "Please enter both name and URL");
      return;
    }

    setIsAdding(true);
    try {
      await addEPGSource(newSourceUrl, newSourceName);
      setNewSourceUrl("");
      setNewSourceName("");
      setShowAddForm(false);
      Alert.alert("Success", "EPG source added successfully");
    } catch (err) {
      Alert.alert("Error", "Failed to add EPG source. Check the URL and try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveEPGSource = (id: string) => {
    Alert.alert("Remove EPG Source", "Are you sure you want to remove this EPG source?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Remove",
        onPress: () => removeEPGSource(id),
        style: "destructive",
      },
    ]);
  };

  const handleRefreshEPGSource = async (id: string) => {
    try {
      await refreshEPG(id);
      Alert.alert("Success", "EPG source refreshed");
    } catch (err) {
      Alert.alert("Error", "Failed to refresh EPG source");
    }
  };

  const renderEPGSourceItem = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => setActiveEPGSource(item.id)}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        className={`mx-4 mb-3 p-4 rounded-lg border-2 ${
          item.isActive ? "border-primary bg-surface" : "border-border bg-background"
        }`}
        style={{
          borderColor: item.isActive ? colors.primary : colors.border,
          backgroundColor: item.isActive ? colors.surface : colors.background,
        }}
      >
        {/* Source Header */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
          </View>
          {item.isActive && (
            <View className="bg-primary px-2 py-1 rounded">
              <Text className="text-background text-xs font-semibold">Active</Text>
            </View>
          )}
        </View>

        {/* URL (truncated) */}
        <Text className="text-xs text-muted mb-3" numberOfLines={1}>
          {item.url}
        </Text>

        {/* Last Updated */}
        <Text className="text-xs text-muted mb-3">
          Updated: {new Date(item.lastUpdated).toLocaleDateString()}
        </Text>

        {/* Action Buttons */}
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => handleRefreshEPGSource(item.id)}
            className="flex-1 bg-primary/20 px-3 py-2 rounded flex-row items-center justify-center gap-1"
          >
            <MaterialIcons name="refresh" size={16} color={colors.primary} />
            <Text className="text-primary text-xs font-semibold">Refresh</Text>
          </Pressable>

          <Pressable
            onPress={() => handleRemoveEPGSource(item.id)}
            className="flex-1 bg-error/20 px-3 py-2 rounded flex-row items-center justify-center gap-1"
          >
            <MaterialIcons name="delete" size={16} color={colors.error} />
            <Text className="text-error text-xs font-semibold">Remove</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-foreground mb-2">EPG Settings</Text>
      </View>

      {/* Error Message */}
      {error && (
        <View className="mx-4 mb-3 bg-error/20 px-3 py-2 rounded">
          <Text className="text-error text-sm font-semibold mb-1">Failed to fetch EPG:</Text>
          <Text className="text-error text-xs">{error}</Text>
          <Text className="text-error text-xs mt-2">Try adding a different EPG source or check your internet connection.</Text>
        </View>
      )}

      {/* Add EPG Source Form */}
      {showAddForm && (
        <View className="mx-4 mb-4 bg-surface p-4 rounded-lg border border-border">
          <Text className="text-foreground font-semibold mb-3">Add EPG Source</Text>

          <TextInput
            placeholder="EPG source name"
            placeholderTextColor={colors.muted}
            value={newSourceName}
            onChangeText={setNewSourceName}
            className="bg-background border border-border rounded px-3 py-2 text-foreground mb-3"
            style={{ color: colors.foreground }}
          />

          <TextInput
            placeholder="XMLTV URL"
            placeholderTextColor={colors.muted}
            value={newSourceUrl}
            onChangeText={setNewSourceUrl}
            className="bg-background border border-border rounded px-3 py-2 text-foreground mb-3"
            style={{ color: colors.foreground }}
            autoCapitalize="none"
          />

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => {
                setShowAddForm(false);
                setNewSourceUrl("");
                setNewSourceName("");
              }}
              className="flex-1 bg-border px-3 py-2 rounded"
            >
              <Text className="text-foreground text-center font-semibold">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleAddEPGSource}
              disabled={isAdding}
              className="flex-1 bg-primary px-3 py-2 rounded flex-row items-center justify-center"
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-background text-center font-semibold">Add</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {/* EPG Sources List */}
      {epgSources.length > 0 ? (
        <FlatList
          data={epgSources}
          renderItem={renderEPGSourceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 16 }}
          scrollEnabled={true}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-4">
          <MaterialIcons name="schedule" size={48} color={colors.muted} />
          <Text className="text-lg font-semibold text-foreground mt-4 text-center">
            No EPG sources yet
          </Text>
          <Text className="text-sm text-muted mt-2 text-center mb-4">
            Add an XMLTV EPG source to see program guides and schedules
          </Text>
        </View>
      )}

      {/* Add Button (FAB) */}
      {!showAddForm && (
        <Pressable
          onPress={() => setShowAddForm(true)}
          className="absolute bottom-6 right-6 bg-primary rounded-full p-4"
          style={{
            backgroundColor: colors.primary,
          }}
        >
          <MaterialIcons name="add" size={28} color="white" />
        </Pressable>
      )}
    </ScreenContainer>
  );
}
