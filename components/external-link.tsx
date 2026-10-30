import { Pressable, type PressableProps } from "react-native";
import InAppBrowser from "react-native-inappbrowser-reborn";
import { type ComponentProps } from "react";

// Note: bare React Native CLI targets Android/iOS only — there's no web
// build target anymore (that was expo-router + react-native-web), so this
// always opens links in an in-app browser rather than branching on web vs.
// native.

type Props = Omit<PressableProps, "onPress"> & { href: string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      onPress={async () => {
        if (await InAppBrowser.isAvailable()) {
          await InAppBrowser.open(href);
        }
      }}
    />
  );
}
