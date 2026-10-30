import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// TODO(migration): screens below still live under app/(tabs)/*.tsx and were
// written for expo-router's file-based routing. Each one needs its
// `expo-router` imports (useRouter, Link, useLocalSearchParams, etc.)
// swapped for @react-navigation equivalents (useNavigation, useRoute) before
// this navigator will actually work end-to-end. See migration TODO list.
import HomeScreen from "@/app/(tabs)/index";
import BrowseScreen from "@/app/(tabs)/browse";
import PlaylistsScreen from "@/app/(tabs)/playlists";
import FavoritesScreen from "@/app/(tabs)/favorites";
import GuideScreen from "@/app/(tabs)/guide";
import EpgSettingsScreen from "@/app/(tabs)/epg-settings";

export type TabParamList = {
  Home: undefined;
  Browse: undefined;
  Playlists: undefined;
  Favorites: undefined;
  Guide: undefined;
  EpgSettings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 12,
          paddingBottom: bottomPadding,
          height: tabBarHeight + 8,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={36} name="house.fill" color={color} />,
        }}
      />
      <Tab.Screen
        name="Browse"
        component={BrowseScreen}
        options={{
          title: "Browse",
          tabBarIcon: ({ color }) => <MaterialIcons name="explore" size={36} color={color} />,
        }}
      />
      <Tab.Screen
        name="Playlists"
        component={PlaylistsScreen}
        options={{
          title: "Playlists",
          tabBarIcon: ({ color }) => <IconSymbol size={36} name="paperplane.fill" color={color} />,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: "Favorites",
          tabBarIcon: ({ color }) => <IconSymbol size={36} name="heart.fill" color={color} />,
        }}
      />
      <Tab.Screen
        name="Guide"
        component={GuideScreen}
        options={{
          title: "Guide",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={36} name="chevron.left.forwardslash.chevron.right" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="EpgSettings"
        component={EpgSettingsScreen}
        options={{
          title: "EPG",
          tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={36} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
