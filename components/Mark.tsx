// Hand-drawn marks — bespoke, not an icon font. Hairline instrument language.
import Svg, { Circle, Path, Polyline, Rect } from "react-native-svg";
import { C } from "../src/theme";

export type MarkName = "pulse" | "queue" | "events" | "link";

export function Mark({ name, color = C.dim2, size = 20 }: { name: MarkName; color?: string; size?: number }) {
  const common = {
    stroke: color,
    strokeWidth: 1.6,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "pulse" && <Polyline points="2,13 6,13 8.5,7 12,18 14.5,11 17,13 22,13" {...common} />}
      {name === "queue" && (
        <>
          <Rect x="3" y="4" width="18" height="5" rx="1.6" {...common} />
          <Rect x="3" y="12" width="18" height="8" rx="1.6" {...common} />
        </>
      )}
      {name === "events" && (
        <>
          <Path d="M4 6h16M4 12h16M4 18h9" {...common} />
        </>
      )}
      {name === "link" && (
        <>
          <Circle cx="9.5" cy="14.5" r="4.5" {...common} />
          <Path d="M13 11l6-6M16 5h3v3" {...common} />
        </>
      )}
    </Svg>
  );
}
