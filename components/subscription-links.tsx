import { View, Text, Pressable, Linking, Alert, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/App";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

/**
 * Channels that don't have a direct M3U/HLS stream URL, so they're played
 * through a WebView loading their official embed page (e.g. a YouTube live
 * channel) instead of react-native-video. This avoids depending on
 * short-lived, signed CDN URLs that expire within hours/a day.
 */
const FEATURED_EMBED_CHANNELS = [
  {
    id: "ezekiel-tv",
    name: "Ezekiel TV",
    icon: "play-circle-outline" as const,
    kind: "embed" as const,
    // Using a specific known video id for their "24/7" stream rather than
    // the channel-based live_stream auto-discovery URL, which was
    // returning error 153 ("video unavailable") — YouTube wasn't reliably
    // resolving an active broadcast for this channel via that method.
    url: "https://www.youtube.com/embed/6_bXJVr6Pvc?autoplay=1",
  },
];

/**
 * These are subscription/pay-TV services with no public stream URL to add
 * as a playlist entry — tapping opens the official app/website instead,
 * so the person can watch through their own paid subscription. FATV does
 * not extract, proxy, or rebroadcast their streams.
 */
const SUBSCRIPTION_SERVICES = [
  {
    id: "psl-dstv",
    name: "PSL",
    icon: "open-in-new" as const,
    kind: "embed" as const,
    url: "https://now.dstv.com/livetv",
  },
  {
    id: "premier-sports-uk",
    name: "Premier Sports",
    icon: "open-in-new" as const,
    kind: "embed" as const,
    url: "https://www.premiersports.com",
  },
];

const ALL_LINKS = [...FEATURED_EMBED_CHANNELS, ...SUBSCRIPTION_SERVICES];

export function SubscriptionLinks() {
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePress = async (item: (typeof ALL_LINKS)[number]) => {
    if (item.kind === "embed") {
      navigation.navigate("WebviewChannel", { title: item.name, url: item.url });
      return;
    }

    try {
      const supported = await Linking.canOpenURL(item.url);
      if (supported) {
        await Linking.openURL(item.url);
      } else {
        // canOpenURL can under-report on some Android versions/configs even
        // when a browser is available — try opening anyway rather than
        // blocking on a check that isn't fully reliable.
        await Linking.openURL(item.url);
      }
    } catch (err) {
      Alert.alert("Unable to open", `Couldn't open ${item.name}. Try visiting ${item.url} in your browser.`);
    }
  };

  return (
    <View className="pb-2">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {ALL_LINKS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => handlePress(item)}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <View className="bg-surface rounded-full pl-3 pr-3 py-2 border border-border flex-row items-center">
              <Text className="text-xs font-medium text-foreground mr-1">{item.name}</Text>
              <MaterialIcons
                name={item.icon}
                size={14}
                color={item.kind === "embed" ? colors.primary : colors.muted}
              />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
