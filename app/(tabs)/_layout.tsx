// Tab shell — floating glass bar, bespoke marks, spring-driven selection.
import { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { C, RADIUS } from "../../src/theme";
import { HIT, useType } from "../../src/type";
import { haptic, useReduceMotion } from "../../src/a11y";
import { MOTION } from "../../src/motion";
import { Mark, type MarkName } from "../../components/Mark";

/** Add a destination here and a matching app/(tabs)/<name>.tsx screen. */
const TABS: { name: string; mark: MarkName; label: string }[] = [
  { name: "ceos", mark: "pulse", label: "CEOs" },
  { name: "media", mark: "events", label: "Media" },
  { name: "link", mark: "link", label: "Link" },
];

function TabButton({
  mark,
  label,
  focused,
  badge,
  onPress,
}: {
  mark: MarkName;
  label: string;
  focused: boolean;
  badge?: number;
  onPress: () => void;
}) {
  const reduce = useReduceMotion();
  const ty = useType();
  const focus = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    if (reduce) {
      focus.value = withTiming(focused ? 1 : 0, { duration: 90 });
      return;
    }
    focus.value = withSpring(focused ? 1 : 0, MOTION.selection);
  }, [focused, reduce, focus]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(focus.value, [0, 1], [2.5, 0]) }, { scale: interpolate(focus.value, [0, 1], [0.92, 1]) }],
    opacity: interpolate(focus.value, [0, 1], [0.5, 1]),
  }));

  return (
    <Pressable
      onPress={() => {
        haptic.select();
        onPress();
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={badge ? `${label}, ${badge} waiting on you` : label}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", minHeight: HIT }}
    >
      <Animated.View style={style}>
        <View>
          <Mark name={mark} color={focused ? C.acc : C.dim2} />
          {badge ? (
            <View
              style={{
                position: "absolute",
                top: -4,
                right: -7,
                minWidth: 14,
                height: 14,
                paddingHorizontal: 3.5,
                borderRadius: 7,
                backgroundColor: C.acc,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={[ty.badge, { color: C.accInk }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.bg } }}
      tabBar={({ state, navigation }) => (
        <View
          accessibilityRole="tablist"
          style={{
            position: "absolute",
            left: 36,
            right: 36,
            bottom: Math.max(insets.bottom, 12),
            backgroundColor: C.cardStrong,
            borderColor: C.cardLine,
            borderWidth: 1,
            borderRadius: RADIUS.pill,
            overflow: "hidden",
            flexDirection: "row",
            shadowColor: C.void,
            shadowOpacity: 0.55,
            shadowRadius: 26,
            shadowOffset: { width: 0, height: 12 },
            elevation: 12,
          }}
        >
          {state.routes.map((route, i) => {
            const cfg = TABS.find((x) => x.name === route.name) ?? TABS[0];
            return (
              <TabButton
                key={route.key}
                mark={cfg.mark}
                label={cfg.label}
                focused={state.index === i}
                onPress={() => navigation.navigate(route.name as never)}
              />
            );
          })}
        </View>
      )}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.label, headerShown: false }} />
      ))}
      {/* the entry route redirects; it is not a destination, so hide it */}
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
