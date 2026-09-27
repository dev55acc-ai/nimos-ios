import React, { useEffect, useState, type ReactNode } from "react";
import {
  Pressable,
  View,
  type PressableProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { C, RADIUS } from "../src/theme";
import { EASE_OUT } from "../src/motion";
import { useCountUp } from "../src/motion";
import { useType } from "../src/type";

// Reanimated 4: animatedProps is merged with the component's own prop type. The
// `text` prop isn't on TextProps, so the created component needs the explicit
// animated-props shape (the canonical AnimatedTextInput pattern).
const TABULAR = ["tabular-nums"] as unknown as TextStyle["fontVariant"];

export function Glass({ children, style, ...rest }: ViewProps) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: C.card,
          borderColor: C.cardLine,
          borderWidth: 1,
          borderRadius: RADIUS.card,
          overflow: "hidden",
        },
        style as ViewStyle,
      ]}
    >
      {children}
    </View>
  );
}

/** Number that counts up on the frame loop — identical on device and web. */
export function Num({
  value,
  size = 30,
  duration = 900,
  color = C.txt,
}: {
  value: number;
  size?: number;
  duration?: number;
  color?: string;
}) {
  const n = useCountUp(value, duration);
  return (
    <Animated.Text
      accessibilityLabel={`${value}`}
      style={{ fontVariant: TABULAR, fontSize: size, fontWeight: "800", letterSpacing: -1.2, color, lineHeight: size * 1.2 }}
    >
      {n}
    </Animated.Text>
  );
}

/** 513 comparison pair, adapted: one number, one meaning. */
export function Stat({ value, label, hot, size = 30 }: { value: number; label: string; hot?: boolean; size?: number }) {
  const t = useType();
  return (
    <Glass style={{ flex: 1, padding: 18 }}>
      <Animated.Text style={[t.label, { color: C.dim2 }]}>{label}</Animated.Text>
      <Num value={value} size={size} />
      {hot ? (
        <View
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: C.acc,
          }}
        />
      ) : null}
    </Glass>
  );
}

type VoltProps = Omit<PressableProps, "style"> & {
  label: string;
  done?: boolean;
  full?: boolean;
  wrapperStyle?: ViewStyle;
};

/** The app's single primary-action shape. Volt gradient + haptics. */
export function VoltButton({ label, done, full, onPress, disabled, wrapperStyle, ...rest }: VoltProps) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      {...rest}
      disabled={disabled ?? done}
      onPressIn={() => (scale.value = withTiming(0.97, { duration: 90 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 180, easing: EASE_OUT }))}
      onPress={(e) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.(e);
      }}
    >
      <Animated.View style={[style, full ? { alignSelf: "stretch" } : { alignSelf: "flex-start" }, wrapperStyle]}>
        <LinearGradient
          colors={done ? ["rgba(255,255,255,0.07)", "rgba(255,255,255,0.04)"] : [C.acc, "#8fe31f"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 22,
            borderRadius: RADIUS.btn,
            alignItems: "center",
            opacity: done ? 0.85 : 1,
          }}
        >
          <Animated.Text style={{ fontSize: 13, fontWeight: "800", letterSpacing: 0.3, color: done ? C.dim : "#05060a" }}>
            {label}
          </Animated.Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

/** Hairline ledger row — the quiet proof surface. */
export function LedgerRow({ left, right, title, last }: { left: string; right?: string; title: string; last?: boolean }) {
  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
        <Animated.Text style={{ color: C.dim2, fontSize: 11, letterSpacing: 0.4 }}>{left}</Animated.Text>
        {right ? <Animated.Text style={{ color: C.acc2, fontSize: 11, letterSpacing: 0.4 }}>{right}</Animated.Text> : null}
      </View>
      <Animated.Text style={{ fontSize: 13, lineHeight: 19, color: C.txt }}>{title}</Animated.Text>
    </View>
  );
}


