// Count-up numerals. Driven on the JS frame loop so the value renders identically
// on device and on the web verification target (the TextInput/animatedProps trick
// silently renders nothing under react-native-web).
import { useEffect, useRef, useState } from "react";
import { Easing } from "react-native-reanimated";

const EASE = Easing.bezier(0.22, 1, 0.36, 1);

export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const start = performance.now();
    setValue(0);
    cancelAnimationFrame(frame.current);

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // matches EASE_OUT closely enough for a numeral
      setValue(target * eased);
      if (t < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return Math.round(value);
}
