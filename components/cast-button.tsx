/**
 * Cast Button Component
 * Displays Chromecast button and device selection
 */

import React, { useState } from "react";
import { View, Pressable, Text, Modal, FlatList, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useChromecast } from "@/lib/context/chromecast-context";
import { useColors } from "@/hooks/use-colors";
import { CastDevice } from "@/lib/utils/chromecast";

export function CastButton() {
  const colors = useColors();
  const chromecast = useChromecast();
  const [showDeviceList, setShowDeviceList] = useState(false);

  if (!chromecast.isAvailable) {
    return null; // Don't show button if Chromecast not available
  }

  const handleCastButtonPress = () => {
    if (chromecast.isConnected) {
      chromecast.disconnect();
    } else {
      setShowDeviceList(true);
      chromecast.startDiscovery();
    }
  };

  const handleDeviceSelect = (device: CastDevice) => {
    chromecast.connectToDevice(device.id);
    setShowDeviceList(false);
  };

  const handleCloseModal = () => {
    setShowDeviceList(false);
    chromecast.stopDiscovery();
  };

  const renderDeviceItem = ({ item }: { item: CastDevice }) => (
    <Pressable
      onPress={() => handleDeviceSelect(item)}
      style={({ pressed }) => [
        {
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <MaterialIcons name="cast" size={24} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>
            {item.name}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
            {item.isConnected ? "Connected" : "Available"}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <>
      <Pressable
        onPress={handleCastButtonPress}
        style={({ pressed }) => [
          {
            padding: 12,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <MaterialIcons
          name={chromecast.isConnected ? "cast-connected" : "cast"}
          size={28}
          color={chromecast.isConnected ? colors.primary : colors.foreground}
        />
      </Pressable>

      <Modal
        visible={showDeviceList}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View
            style={{
              paddingTop: 16,
              paddingBottom: 16,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>
              Select Device
            </Text>
            <Pressable onPress={handleCloseModal}>
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Device List */}
          {chromecast.availableDevices.length > 0 ? (
            <FlatList
              data={chromecast.availableDevices}
              keyExtractor={(item) => item.id}
              renderItem={renderDeviceItem}
            />
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                gap: 16,
              }}
            >
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.muted, fontSize: 16 }}>
                {chromecast.isDiscovering ? "Searching for devices..." : "No devices found"}
              </Text>
            </View>
          )}

          {/* Error Message */}
          {chromecast.error && (
            <View
              style={{
                padding: 16,
                backgroundColor: colors.error,
                margin: 16,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "white", fontSize: 14 }}>
                {chromecast.error}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}
