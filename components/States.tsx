// Real UI states. An app that only has a happy path is not finished.
import { View, Text, ActivityIndicator, Pressable, type ViewStyle } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { useEffect } from "react";
import { C, RADIUS, T } from "../src/theme";
import { useType, HIT } from "../src/type";
import { haptic, useReduceMotion } from "../src/a11y";
import { Glass } from "./ui";
import { Mark } from "./Mark";

/** Shimmering placeholder. Respects reduce-motion (static block instead). */
export function Skeleton({ height = 18, width = "100%", style }: { height?: number; width?: number | `${number}%`; style?: ViewStyle }) {
  const reduce = useReduceMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    t.value = withRepeat(withTiming(1, { duration: 1150, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [reduce, t]);

  const anim = useAnimatedStyle(() => ({ opacity: 0.35 + t.value * 0.35 }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { height, width: width as ViewStyle["width"], borderRadius: Math.min(height / 2, 9), backgroundColor: C.cardLine },
        reduce ? { opacity: 0.4 } : anim,
        style,
      ]}
    />
  );
}

export function PulseSkeleton() {
  const t = useType();
  return (
    <View style={{ paddingHorizontal: 20, gap: 14 }}>
      <View style={{ height: 300, alignItems: "center", justifyContent: "center", gap: 14 }}>
        <Skeleton height={10} width={120} />
        <Skeleton height={86} width={160} />
        <Skeleton height={11} width={200} />
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {[0, 1].map((i) => (
          <Glass key={i} style={{ flex: 1, padding: 18, gap: 10 }}>
            <Skeleton height={9} width={78} />
            <Skeleton height={26} width={44} />
          </Glass>
        ))}
      </View>
      <View style={{ gap: 12, marginTop: 12 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ gap: 7 }}>
            <Skeleton height={9} width={110} />
            <Skeleton height={14} width={`${86 - i * 12}%` as const} />
          </View>
        ))}
      </View>
      <View accessibilityRole="progressbar" accessibilityLabel="Loading fleet" style={{ alignItems: "center" }}>
        <Text style={[T.mono, t.mono]}>syncing with the control plane…</Text>
      </View>
    </View>
  );
}

/** Offline / auth / server failure. Always offers the way out. */
export function ErrorState({ onRetry, detail }: { onRetry: () => void; detail?: string }) {
  const t = useType();
  return (
    <Animated.View entering={FadeIn.duration(280)} style={{ paddingHorizontal: 20, paddingTop: 60, alignItems: "center", gap: 16 }}>
      <Mark name="link" size={34} color={C.danger} />
      <View style={{ alignItems: "center", gap: 6 }}>
        <Text style={[t.bodyStrong, { color: C.txt, textAlign: "center" }]}>
          Can&apos;t reach the control plane
        </Text>
        <Text style={[t.caption, { color: C.dim, textAlign: "center", maxWidth: 280 }]}>
          {detail ?? "Check the URL and token on the Link tab, then try again."}
        </Text>
      </View>
      <Pressable
        onPress={() => {
          haptic.act();
          onRetry();
        }}
        accessibilityRole="button"
        accessibilityLabel="Retry connection"
        style={({ pressed }) => ({
          minHeight: HIT,
          justifyContent: "center",
          paddingHorizontal: 26,
          borderRadius: RADIUS.btn,
          borderWidth: 1,
          borderColor: C.cardLine,
          backgroundColor: C.card,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={[t.action, { color: C.txt }]}>Try again</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Nothing here — but deliberately, not apologetically. */
export function EmptyState({ mark, title, note }: { mark: "queue" | "events"; title: string; note: string }) {
  const t = useType();
  return (
    <Animated.View entering={FadeIn.duration(320)} style={{ paddingHorizontal: 20, paddingTop: 48, alignItems: "center", gap: 14 }}>
      <View
        style={{
          width: 68,
          height: 68,
          borderRadius: 34,
          borderWidth: 1,
          borderColor: C.cardLine,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: C.card,
        }}
      >
        <Mark name={mark} size={26} color={C.dim} />
      </View>
      <View style={{ alignItems: "center", gap: 5 }}>
        <Text style={[t.bodyStrong, { color: C.txt, textAlign: "center" }]}>{title}</Text>
        <Text style={[t.caption, { color: C.dim, textAlign: "center", maxWidth: 260 }]}>{note}</Text>
      </View>
    </Animated.View>
  );
}

export function InlineSpinner() {
  return (
    <View style={{ alignItems: "center", paddingVertical: 20 }} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <ActivityIndicator color={C.acc} />
    </View>
  );
}
