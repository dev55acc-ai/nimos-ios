import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { C } from "../src/theme";
import { getConn, getConnSync, isLinked } from "../src/api";
import { useType } from "../src/type";

/** The only persistent chrome: wordmark + whether the spine is linked. */
export function Header() {
  const insets = useSafeAreaInsets();
  const t = useType();
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
      <Animated.Text style={[t.wordmark, { color: C.txt }]}>
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
      <Animated.Text style={[t.mono, { color: C.dim }]}>
        {live ? "spine" : "offline"}
      </Animated.Text>
    </Animated.View>
  );
}
