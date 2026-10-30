import "@/global.css";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { IPTVProvider } from "@/lib/context/iptv-context";
import { EPGProvider } from "@/lib/context/epg-context";
import { ChromecastProvider } from "@/lib/context/chromecast-context";
import { NotificationsProvider } from "@/lib/context/notifications-context";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

import { TabNavigator } from "@/navigation/TabNavigator";

import PlayerScreen from "@/app/player";
import BrowseCountryScreen from "@/app/browse-country";
import BrowseCategoryScreen from "@/app/browse-category";
import BrowseChannelsScreen from "@/app/browse-channels";
import WebviewChannelScreen from "@/app/webview-channel";

export type RootStackParamList = {
  Tabs: undefined;
  Player: { channelId?: string } | undefined;
  BrowseCountry: { continent: string };
  BrowseCategory: { continent: string; country: string };
  BrowseChannels: { continent: string; country: string; category: string };
  WebviewChannel: { title: string; url: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <IPTVProvider>
          <EPGProvider>
            <ChromecastProvider>
              <NotificationsProvider>
                <SafeAreaProvider initialMetrics={initialWindowMetrics}>
                  <NavigationContainer>
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="Tabs" component={TabNavigator} />
                      <Stack.Screen name="Player" component={PlayerScreen} />
                      <Stack.Screen name="BrowseCountry" component={BrowseCountryScreen} />
                      <Stack.Screen name="BrowseCategory" component={BrowseCategoryScreen} />
                      <Stack.Screen name="BrowseChannels" component={BrowseChannelsScreen} />
                      <Stack.Screen name="WebviewChannel" component={WebviewChannelScreen} />
                    </Stack.Navigator>
                  </NavigationContainer>
                  <StatusBar barStyle={Platform.OS === "ios" ? "dark-content" : "default"} />
                </SafeAreaProvider>
              </NotificationsProvider>
            </ChromecastProvider>
          </EPGProvider>
        </IPTVProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
