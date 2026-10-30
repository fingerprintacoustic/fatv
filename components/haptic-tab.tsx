import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { Platform } from "react-native";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (Platform.OS === "ios") {
          // Add a soft haptic feedback when pressing down on the tabs.
          ReactNativeHapticFeedback.trigger("impactLight");
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
