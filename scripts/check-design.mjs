#!/usr/bin/env node
/**
 * Design gate. Fails the build on the things that make an app look cheap.
 *
 * This is the load-bearing part of the framework. An agent will happily write
 * `fontSize: 14` and `#8b8b8b` in a hundred files; without a gate that becomes
 * the product. With one, it fails in CI and never reaches a screen.
 *
 * Rules are deliberately few, unambiguous, and mechanically checkable. A rule
 * that needs taste is a review comment, not a build failure.
 *
 *   node scripts/check-design.mjs [dir]
 *
 * Exit 0 = clean, 1 = violations. Add to CI before you build.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";

const ROOT = process.argv[2] ?? ".";
const SCAN = ["src", "app", "components", "screens"];
const EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);

// mirrors spacing in src/design/tokens.ts
const ALLOWED_SPACE = new Set([0, 2, 4, 8, 12, 16, 24, 32, 48]);

const ALLOWED_HEX = new Set([
  // mirrors src/design/tokens.ts — the palette, nothing else
  "#000000", "#05060a", "#0a0c14", "#12151f",
  "#eef1f7", "#b7ff2e", "#5a8cff", "#ffb46b", "#ff7e5f",
]);

const findings = [];
const add = (file, line, rule, why) => findings.push({ file, line, rule, why });

/** Strip comments so documentation examples never trip the gate. */
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (EXT.has(extname(name))) yield p;
  }
}

for (const sub of SCAN) {
  for (const file of walk(join(ROOT, sub))) {
    // The token files are the definition. Flagging them is circular.
    if (/design\/tokens|check-design|src\/(type|theme|motion|a11y)\.ts$/.test(file)) continue;
    const raw = readFileSync(file, "utf8");
    const src = stripComments(raw);
    const lines = raw.split("\n");
    const rel = relative(ROOT, file);

    src.split("\n").forEach((text, i) => {
      const n = i + 1;

      // 1. hardcoded colour
      for (const m of text.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
        if (!ALLOWED_HEX.has(m[0].toLowerCase())) {
          add(rel, n, "color/hex", `"${m[0]}" is not a token — use palette.* from src/design/tokens`);
        }
      }

      // 2. hardcoded font size (type sizes belong to the scale)
      const fs = text.match(/fontSize:\s*(\d+(?:\.\d+)?)/);
      if (fs && !text.includes("type.")) {
        add(rel, n, "type/fontSize", `fontSize: ${fs[1]} is a raw size — use useType()`);
      }

      // 4. hardcoded animation duration
      const dur = text.match(/duration:\s*(\d{3,})/);
      if (dur && !text.includes("motion.")) {
        add(rel, n, "motion/duration", `duration: ${dur[1]} is inline — use motion.* so it stays one system`);
      }

    });

    // 3. interactive elements need a label SOMEWHERE in their own JSX block.
    // Line-scoped matching gives false positives on multi-line props, which
    // teaches people to ignore the gate.
    // Look FORWARD a bounded window rather than to the next ">" — an arrow
    // function (`onPress={() => {`) contains ">", so block-scanning stopped
    // early and flagged elements that do have labels. False positives make a
    // gate something people disable.
    const LINES = src.split("\n");
    for (let i = 0; i < LINES.length; i++) {
      const open = LINES[i].match(/<(Pressable|TouchableOpacity|Touchable|Image)\b/);
      if (!open) continue;
      // the element's props run until a line that closes the tag
      let end = i;
      for (let j = i; j < Math.min(i + 14, LINES.length); j++) {
        end = j;
        if (/\/?>/.test(LINES[j]) && !/=>|=\s*$/.test(LINES[j])) break;
      }
      const block = LINES.slice(i, end + 1).join("\n");
      if (!block.includes("accessibilityLabel")) {
        add(rel, i + 1, "a11y/label", `<${open[1]}> has no accessibilityLabel`);
      } else if (!block.includes("accessibilityRole") && open[1] !== "Image") {
        add(rel, i + 1, "a11y/role", `<${open[1]}> has a label but no accessibilityRole`);
      }
    }

  }
}

if (findings.length === 0) {
  console.log(`\x1b[32m✓\x1b[0m design gate clean (${SCAN.join(", ")})`);
  process.exit(0);
}

const byRule = new Map();
for (const f of findings) {
  if (!byRule.has(f.rule)) byRule.set(f.rule, []);
  byRule.get(f.rule).push(f);
}

console.log(`\x1b[31m✗\x1b[0m design gate: ${findings.length} violation(s)\n`);
for (const [rule, list] of byRule) {
  console.log(`  \x1b[33m${rule}\x1b[0m  (${list.length})`);
  for (const f of list.slice(0, 6)) console.log(`    ${f.file}:${f.line}  ${f.why}`);
  if (list.length > 6) console.log(`    … ${list.length - 6} more`);
  console.log();
}
console.log("These are the exact habits that make an app read as cheap. Fix or allow explicitly — don't disable the rule.\n");
process.exit(1);
