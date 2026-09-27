import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { C } from "../src/theme";
import { getConn, getConnSync, isLinked } from "../src/api";

/** The only persistent chrome: wordmark + whether the spine is linked. */
export function Header() {
  const insets = useSafeAreaInsets();
  void getConn();
  const c = getConnSync();
  const live = isLinked(c);

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      style={{
        paddingTop: Math.max(insets.top, 14) + 8,
        paddingHorizontal: 20,
        paddingBottom: 6,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Animated.Text style={{ fontSize: 26, fontWeight: "800", letterSpacing: -1.4, color: C.txt }}>
        nimos
        <Animated.Text style={{ color: C.acc }}>.</Animated.Text>
      </Animated.Text>
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 4,
          marginLeft: 10,
          backgroundColor: live ? C.acc : C.danger,
        }}
      />
      <View style={{ flex: 1 }} />
      <Animated.Text style={{ fontSize: 11, letterSpacing: 0.4, color: C.dim }}>
        {live ? "spine" : "offline"}
      </Animated.Text>
    </Animated.View>
  );
}
