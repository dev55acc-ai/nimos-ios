// Design tokens. This is the whole brand surface — rebrand by changing ACC and BG.
//
// Rules encoded here (do not bypass them):
//  - one accent, used only for state and the single primary action
//  - type sizes come from src/type.ts (Dynamic Type aware), never from here
//  - every surface is a hairline-bordered glass panel, never a solid card

export const C = {
  bg: "#05060a",
  bg2: "#0a0c14",
  card: "rgba(255,255,255,0.04)",
  cardStrong: "rgba(10,12,20,0.85)",
  cardLine: "rgba(255,255,255,0.09)",
  txt: "#eef1f7",
  dim: "rgba(238,241,247,0.45)",
  dim2: "rgba(238,241,247,0.28)",
  acc: "#b7ff2e",
  acc2: "#5a8cff",
  danger: "#ff7e5f",
  warn: "#ffb46b",
} as const;

export const T = {
  mono: { color: C.dim },
} as const;

export const RADIUS = { card: 18, btn: 14, pill: 16 } as const;
export const SPACE = { xs: 6, sm: 10, md: 16, lg: 24, xl: 40 } as const;

export type Palette = typeof C;
