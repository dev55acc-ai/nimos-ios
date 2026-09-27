// Type system — Dynamic Type aware.
//
// Every size in the app comes from here and is multiplied by the OS text-size
// setting, so the layout survives Accessibility → Larger Text. Raw px sizes are
// the loudest tell of a non-native app; this removes them by construction.

import { useMemo } from "react";
import { PixelRatio, useWindowDimensions, type TextStyle } from "react-native";

type Scale = Record<string, TextStyle>;

const BASE = {
  // the wordmark
  wordmark: { fontSize: 26, fontWeight: "800", letterSpacing: -1.4 },
  hero: { fontSize: 26, fontWeight: "700", letterSpacing: -1 },
  // numerals
  mega: { fontSize: 96, fontWeight: "800", letterSpacing: -4 },
  stat: { fontSize: 30, fontWeight: "800", letterSpacing: -1.2 },
  // text
  body: { fontSize: 15, lineHeight: 21, fontWeight: "400" },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: "600" },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  // labels
  label: { fontSize: 10, fontWeight: "600", letterSpacing: 2.6, textTransform: "uppercase" },
  mono: { fontSize: 11, letterSpacing: 0.4, fontWeight: "500" },
  action: { fontSize: 15, fontWeight: "700", letterSpacing: 0.2 },
} satisfies Scale;

/**
 * Dynamic Type scale. `fontScale` comes from the OS; we clamp it so a 3× setting
 * can't destroy the instrument layout, and round to whole points so text lands on
 * whole pixels (no blurry glyphs).
 */
export function useType(): Scale {
  const { fontScale } = useWindowDimensions();
  const scale = Math.min(Math.max(fontScale, 0.85), 1.45);

  return useMemo(() => {
    const out: Scale = {};
    for (const [k, raw] of Object.entries(BASE)) {
      const v = raw as TextStyle;
      const r = (n: number) => Math.round(n * scale);
      out[k] = {
        ...v,
        fontSize: r(v.fontSize ?? 0),
        lineHeight: v.lineHeight ? r(v.lineHeight) : undefined,
        letterSpacing: v.letterSpacing != null ? Number((v.letterSpacing * scale).toFixed(2)) : undefined,
      } as TextStyle;
    }
    return out;
  }, [scale]);
}

/** Snap a layout dimension to the pixel grid. */
export const px = (n: number) => PixelRatio.roundToNearestPixel(n);

/** Minimum interactive size — Apple HIG floor is 44pt. */
export const HIT = 44;
