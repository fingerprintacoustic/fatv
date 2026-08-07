import { FlatList, Text, View, Pressable, TextInput, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useIPTV } from "@/lib/context/iptv-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function PlaylistsScreen() {
  const colors = useColors();
  const {
    playlists,
    activePlaylist,
    addPlaylist,
    removePlaylist,
    setActivePlaylist,
    refreshPlaylist,
    isLoading,
    error,
  } = useIPTV();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlaylistUrl, setNewPlaylistUrl] = useState("");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddPlaylist = async () => {
    if (!newPlaylistUrl.trim() || !newPlaylistName.trim()) {
      Alert.alert("Error", "Please enter both name and URL");
      return;
    }

    setIsAdding(true);
    try {
      await addPlaylist(newPlaylistUrl, newPlaylistName);
      setNewPlaylistUrl("");
      setNewPlaylistName("");
      setShowAddForm(false);
      Alert.alert("Success", "Playlist added successfully");
    } catch (err) {
      Alert.alert("Error", "Failed to add playlist. Check the URL and try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemovePlaylist = (id: string) => {
    Alert.alert("Remove Playlist", "Are you sure you want to remove this playlist?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Remove",
        onPress: () => removePlaylist(id),
        style: "destructive",
      },
    ]);
  };

  const handleRefreshPlaylist = async (id: string) => {
    try {
      await refreshPlaylist(id);
      Alert.alert("Success", "Playlist refreshed");
    } catch (err) {
      Alert.alert("Error", "Failed to refresh playlist");
    }
  };

  const renderPlaylistItem = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => setActivePlaylist(item.id)}
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
        {/* Playlist Header */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
            <Text className="text-xs text-muted mt-1">{item.channels.length} channels</Text>
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
            onPress={() => handleRefreshPlaylist(item.id)}
            className="flex-1 bg-primary/20 px-3 py-2 rounded flex-row items-center justify-center gap-1"
          >
            <MaterialIcons name="refresh" size={16} color={colors.primary} />
            <Text className="text-primary text-xs font-semibold">Refresh</Text>
          </Pressable>

          <Pressable
            onPress={() => handleRemovePlaylist(item.id)}
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
        <Text className="text-2xl font-bold text-foreground mb-2">Playlists</Text>
      </View>

      {/* Error Message */}
      {error && (
        <View className="mx-4 mb-3 bg-error/20 px-3 py-2 rounded">
          <Text className="text-error text-sm">{error}</Text>
        </View>
      )}

      {/* Add Playlist Form */}
      {showAddForm && (
        <View className="mx-4 mb-4 bg-surface p-4 rounded-lg border border-border">
          <Text className="text-foreground font-semibold mb-3">Add New Playlist</Text>

          <TextInput
            placeholder="Playlist name"
            placeholderTextColor={colors.muted}
            value={newPlaylistName}
            onChangeText={setNewPlaylistName}
            className="bg-background border border-border rounded px-3 py-2 text-foreground mb-3"
            style={{ color: colors.foreground }}
          />

          <TextInput
            placeholder="M3U URL"
            placeholderTextColor={colors.muted}
            value={newPlaylistUrl}
            onChangeText={setNewPlaylistUrl}
            className="bg-background border border-border rounded px-3 py-2 text-foreground mb-3"
            style={{ color: colors.foreground }}
            autoCapitalize="none"
          />

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => {
                setShowAddForm(false);
                setNewPlaylistUrl("");
                setNewPlaylistName("");
              }}
              className="flex-1 bg-border px-3 py-2 rounded"
            >
              <Text className="text-foreground text-center font-semibold">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleAddPlaylist}
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

      {/* Playlists List */}
      {playlists.length > 0 ? (
        <FlatList
          data={playlists}
          renderItem={renderPlaylistItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 16 }}
          scrollEnabled={true}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-4">
          <MaterialIcons name="playlist-play" size={48} color={colors.muted} />
          <Text className="text-lg font-semibold text-foreground mt-4 text-center">
            No playlists yet
          </Text>
          <Text className="text-sm text-muted mt-2 text-center">
            Add your first M3U playlist to get started
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
