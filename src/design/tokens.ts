/**
 * Design tokens — the single source of truth for the UI.
 *
 * This file is the contract. Nothing in an app may hardcode a colour, a font
 * size, a radius or a duration: it imports them from here. That is what makes a
 * codebase look designed rather than assembled, and it is what lets the design
 * gate (`scripts/check-design.mjs`) fail cheap code instead of shipping it.
 *
 * Swift parity: `scripts/tokens-to-swift.ts` emits the same values as a Swift
 * file, so a native target never drifts from this one.
 */

export const palette = {
  // surfaces, darkest to lightest
  void: "#000000",
  bg: "#05060a",
  surface: "#0a0c14",
  raised: "#12151f",

  glass: "rgba(255,255,255,0.04)",
  glassStrong: "rgba(10,12,20,0.85)",
  hairline: "rgba(255,255,255,0.09)",
  hairlineFaint: "rgba(255,255,255,0.05)",

  // text — four steps, never more
  ink: "#eef1f7",
  inkMuted: "rgba(238,241,247,0.45)",
  inkFaint: "rgba(238,241,247,0.28)",

  // one accent. It marks state and the single primary action. Nothing else.
  accent: "#b7ff2e",
  accentInk: "#05060a", // text on top of the accent
  info: "#5a8cff",
  warn: "#ffb46b",
  danger: "#ff7e5f",
} as const;

export const radius = {
  chip: 17,
  control: 22,
  panel: 18,
  card: 22,
  sheet: 28,
  full: 9999,
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/**
 * Type. Base sizes are unscaled; `scaleType()` in src/type.ts multiplies by the
 * OS text-size setting. Never write a fontSize anywhere else.
 */
export const type = {
  wordmark: { size: 26, weight: "800", tracking: -1.4 },
  display: { size: 44, weight: "800", tracking: -2 },
  title: { size: 26, weight: "700", tracking: -1 },
  heading: { size: 19, weight: "600", tracking: -0.4 },
  body: { size: 15, weight: "400", lineHeight: 21 },
  bodyStrong: { size: 15, weight: "600", lineHeight: 21 },
  caption: { size: 13, weight: "400", lineHeight: 18 },
  label: { size: 10, weight: "600", tracking: 2.6, transform: "uppercase" },
  mono: { size: 11, weight: "500", tracking: 0.4 },
  stat: { size: 30, weight: "800", tracking: -1.2 },
} as const;

/**
 * Motion. These numbers are the product's feel — change them once, on purpose,
 * never per-component.
 *
 *   entry      : cubic-bezier(0.22, 1, 0.36, 1)   fast out, long settle
 *   exit       : cubic-bezier(0.4, 0, 1, 1)      decisive
 *   selection  : spring damping 15, stiffness 180 — the tab indicator
 *   entrances  : 320ms, staggered 24ms per item, capped at 8 items
 *   virtualEase: lerp 0.09 per frame (pattern 246) for value-driven motion
 *   breathe    : 28% rise / 72% fall, 2.4s — the pulse
 */
export const motion = {
  entry: { duration: 320, easing: [0.22, 1, 0.36, 1] },
  exit: { duration: 200, easing: [0.4, 0, 1, 1] },
  press: { duration: 90, out: 180 },
  stagger: { step: 24, cap: 8 },
  spring: { damping: 15, stiffness: 180, mass: 0.5 },
  selection: { damping: 14, stiffness: 120, mass: 0.7 },
  breathe: { rise: 0.28, fall: 0.72, period: 2400 },
  virtual: { lerp: 0.09 },
} as const;

/** Apple's minimum interactive size. Everything tappable is at least this. */
export const HIT = 44;

/** Dynamic Type clamping — beyond this the instrument layout breaks. */
export const typeScaleRange = { min: 0.85, max: 1.45 } as const;

export type Palette = typeof palette;
export type TypeRole = keyof typeof type;
