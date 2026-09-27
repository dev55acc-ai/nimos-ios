# ios-kit — a premium iOS foundation

Expo SDK 57 · React Native 0.86 (New Architecture) · React 19.2 · expo-router 57 ·
Reanimated 4.5 (worklets) · TanStack Query 5 · TypeScript 6 strict.

Scaffold an app from this and you are building, not bootstrapping.

```
iosapp new myapp ca.motionmenu.myapp     # → ~/apps/myapp, rebranded, deps installed
iosapp run ~/apps/myapp                  # dev server + QR for Expo Go
iosapp sim ~/apps/myapp                  # EAS simulator .app — proves the build, no Apple creds
iosapp build ~/apps/myapp preview        # signed .ipa for your iPhone (needs Apple setup)
iosapp check ~/apps/myapp                # typecheck + bundle gate — run before every build
```

## What "premium" means here, concretely

These are the things a non-native app gets wrong. All of them are already handled:

| Concern | How it's handled |
|---|---|
| **Dynamic Type** | `useType()` is the only source of type sizes, multiplied by the OS text setting (clamped 0.85–1.45, snapped to whole pixels). No raw px sizes anywhere. |
| **Reduce Motion** | `useReduceMotion()` is wired into the aperture, the tab spring and the count-up. Under reduce-motion they become instant state changes, not broken layouts. |
| **Haptics** | One vocabulary in `src/a11y.ts` (`select`, `act`, `success`, `error`, `warn`) instead of ad-hoc calls. |
| **Touch targets** | `HIT = 44` from `src/type.ts`; every interactive row uses it. |
| **Real states** | `Skeleton` (shimmer, respects reduce-motion), `ErrorState` (always offers a way out), `EmptyState` (deliberate, not apologetic). No happy-path-only screens. |
| **Offline** | TanStack Query persisted to disk; `placeholderData: prev` means an outage never blanks the screen. |
| **List performance** | `FlatList` with `windowSize`, `removeClippedSubviews`, batched updates, memoized rows. |
| **Internal error leakage** | `src/api.ts` translates HTTP codes to human copy. `NOT_CONNECTED` never reaches a user. |
| **Motion physics** | `EASE_OUT = bezier(0.22, 1, 0.36, 1)`; tab spring `damping 15 / stiffness 180`. Constants live in `src/motion.ts` — keep them, they're the taste. |

## Layout

```
src/
  config.ts      ← the ONLY file to edit when rebranding (name, tagline, stats, bundle id)
  theme.ts       ← colours + radii. Rebrand = change ACC and BG.
  type.ts        ← Dynamic Type scale + HIT
  a11y.ts        ← reduce motion + haptic vocabulary
  motion.ts      ← easing, count-up, rise distance
  api.ts         ← typed fetch client with human error copy
  queryClient.ts ← persisted, offline-tolerant query client
components/
  Ambient.tsx    ← full-bleed light behind every screen (no seams)
  ui.tsx         ← Glass, Num, Stat, VoltButton, LedgerRow
  States.tsx     ← Skeleton, ErrorState, EmptyState, InlineSpinner
  Mark.tsx       ← hand-drawn SVG marks (no icon font)
app/
  _layout.tsx    ← providers + dark canvas
  (tabs)/        ← Home, Activity, Settings — add a destination in _layout + a screen file
docs/APPLE-SETUP.md  ← the one-time Apple signing step
```

## Rules that keep it premium

1. Type sizes come from `useType()`. Never hardcode a font size.
2. One accent colour, used only for state and the single primary action.
3. Every list is a `FlatList`; every row is `memo`'d.
4. Every screen handles loading, error and empty. No exceptions.
5. `iosapp check` passes before `iosapp build`. The gate is the point.

## Verification

`tsc --noEmit` clean · `expo export --platform ios` bundles · web export screenshotted at
402×874 across all three screens with zero console errors. Verified on 2026-09-26.
