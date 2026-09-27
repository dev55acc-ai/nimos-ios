// Motion primitives. The constants ARE the design — keep them when you extend.

import { useEffect, useState } from "react";
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useReduceMotion } from "./a11y";

/** Arrival easing. Used by every entrance in the kit. */
export const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

/**
 * Count-up numeral, frame-loop driven so it renders identically on device and in
 * the web verification target (the Reanimated animatedProps/TextInput trick
 * silently renders nothing under react-native-web).
 *
 * Honours reduce-motion: the value snaps instead of animating.
 */
export function useCountUp(target: number, duration = 900) {
  const reduce = useReduceMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (reduce) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let frame = 0;
    setValue(0);

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduce]);

  return reduce ? target : Math.round(value);
}

/** Rise-and-fade entrance. Distance collapses to 0 under reduce-motion. */
export function useRise(distance = 18, duration = 1100) {
  const reduce = useReduceMotion();
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withTiming(1, { duration, easing: EASE_OUT });
  }, [duration, v]);
  const dist = riseDistance(reduce, distance);
  return useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateY: (1 - v.value) * dist }],
  }));
}

/** Rise-and-fade entrance distance. Zero under reduce-motion. */
export const riseDistance = (reduce: boolean, d = 18) => (reduce ? 0 : d);
