// Uses MaterialIcons on all platforms (Android, iOS, web).
// Previously iOS used native SF Symbols via expo-symbols; consolidated to
// MaterialIcons everywhere during the bare-RN migration to avoid pulling in
// a separate SF Symbols native module for a single-platform icon variant.

import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "playlist-play",
  "heart.fill": "favorite",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
} as IconMapping;

/**
 * An icon component using Material Icons on every platform for a consistent
 * look. Icon `name`s follow the original SF-Symbols-style naming and are
 * mapped to their Material Icons equivalent below.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  return <MaterialIcons color={color as string} size={size} name={MAPPING[name]} style={style} />;
}
