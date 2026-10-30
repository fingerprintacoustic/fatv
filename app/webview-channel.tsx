import { View, Pressable, ActivityIndicator, Text, Linking } from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "@/App";
import { useRef, useState } from "react";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WebviewChannelScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "WebviewChannel">>();
  const colors = useColors();
  const { title, url } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const webviewRef = useRef<WebView>(null);

  // Derives a normal youtube.com/watch link from a youtube.com/embed URL,
  // for the "open in YouTube app" fallback — useful because some embeds
  // (e.g. "video unavailable" for a live stream) render fine as a page but
  // refuse to actually play inside an embedded WebView.
  const externalUrl = url.includes("youtube.com/embed/")
    ? url.replace(/youtube\.com\/embed\/([^?]+).*/, (_match, id) =>
        id === "live_stream" ? `youtube.com/${url.split("channel=")[1]?.split("&")[0] ?? ""}` : `youtube.com/watch?v=${id}`,
      )
    : url;

  const openExternally = async () => {
    try {
      await Linking.openURL(externalUrl);
    } catch {
      // no-op — nothing more we can do if this also fails
    }
  };

  return (
    <SafeAreaView className="flex-1" edges={["top", "left", "right"]} style={{ backgroundColor: "#000" }}>
      <View className="flex-row items-center px-3 py-2" style={{ backgroundColor: colors.surface }}>
        <Pressable onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="flex-1 text-foreground text-base font-semibold ml-2" numberOfLines={1}>
          {title}
        </Text>
        <Pressable onPress={openExternally} style={{ padding: 8 }}>
          <MaterialIcons name="open-in-new" size={20} color={colors.muted} />
        </Pressable>
      </View>

      <View className="flex-1" style={{ backgroundColor: "#000" }}>
        {error ? (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-foreground text-base text-center mb-4">
              Unable to load this channel. Check your connection and try again.
            </Text>
            <Pressable
              onPress={() => {
                setError(false);
                setIsLoading(true);
                webviewRef.current?.reload();
              }}
              className="px-6 py-3 bg-primary rounded-lg"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </Pressable>
          </View>
        ) : (
          <WebView
            ref={webviewRef}
            source={{ uri: url }}
            style={{ flex: 1, backgroundColor: "#000" }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError(true);
            }}
          />
        )}

        {isLoading && !error && (
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ backgroundColor: "#000" }}
            pointerEvents="none"
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
