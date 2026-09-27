import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C } from "../src/theme";

/**
 * Ambient light — one full-bleed wash anchored to the top of the screen, living
 * behind every screen. Lives here (not inside a screen) so it never seams against
 * the header. Fades to nothing at both ends: no hard edges anywhere.
 */
export function Ambient() {
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, height: 620 }}>
      <LinearGradient
        colors={[
          "rgba(183,255,46,0.09)",
          "rgba(183,255,46,0.045)",
          "rgba(90,140,255,0.02)",
          "rgba(5,6,10,0)",
        ]}
        locations={[0, 0.3, 0.58, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      />
      <LinearGradient
        colors={["rgba(90,140,255,0.05)", "rgba(5,6,10,0)"]}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 1, y: 0.6 }}
        style={{ position: "absolute", left: 0, right: 0, top: 120, height: 340 }}
      />
    </View>
  );
}

export const AMBIENT_BG = C.bg;
