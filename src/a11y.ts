// Accessibility + native-feel primitives.
//
// reduceMotion: every animation in the app reads this. When the OS asks for
// reduced motion, motion collapses to a state change — never a broken layout.
// haptics: one vocabulary, not ad-hoc calls scattered through components.

import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import * as Haptics from "expo-haptics";

export function useReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (v) => setReduced(v));
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return reduced;
}

export const haptic = {
  /** A tab changed. */
  select: () => void Haptics.selectionAsync(),
  /** A control was committed. */
  act: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  /** Something irreversible happened — an agent was unblocked. */
  success: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  /** Something failed. */
  error: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  /** Heavy, for a destructive confirm. */
  warn: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
} as const;
