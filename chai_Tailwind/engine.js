// ─────────────────────────────────────────────────────────────────────────────
// chai-tailwind | engine.js
// Scans the DOM for chai-* classes and applies them as inline styles.
//
// How it works:
//   1. querySelectorAll("*") — grab every element
//   2. filter classes starting with "chai-"
//   3. strip "chai-", split into prop + value
//   4. match against STATIC map (keywords) or DYNAMIC list (numbers/colors)
//   5. apply inline styles, remove the chai-* class
//
// Supports:
//   • Full Tailwind color palette with shades  → chai-bg-red-500
//   • Arbitrary values in brackets             → chai-p-[13px], chai-bg-[#ff5733]
//   • Grid utilities                           → chai-grid-cols-3
//   • MutationObserver for dynamic elements
//   • FOUC prevention (add body{opacity:0} in your CSS)
// ─────────────────────────────────────────────────────────────────────────────

import { ChaiConfig } from "./config.js";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

// Resolve color from ChaiConfig
// "white"   → "#ffffff"
// "red-500" → "#ef4444"
// "red"     → "#ef4444" (500 shade as default)
function resolveColor(val) {
  const entry = ChaiConfig.colors[val];

  // flat color: white, black, transparent, inherit
  if (typeof entry === "string") return entry;

  // shaded color: "red-500" → name="red", shade="500"
  const lastDash = val.lastIndexOf("-");
  if (lastDash !== -1) {
    const name    = val.slice(0, lastDash);
    const shade   = val.slice(lastDash + 1);
    const palette = ChaiConfig.colors[name];
    if (palette && palette[shade]) return palette[shade];
  }

  // unshaded palette name "red" → use 500 as default
  if (entry && typeof entry === "object" && entry[500]) return entry[500];

  return null;
}

// Resolve spacing from ChaiConfig, fallback to raw px
// "4" → "4px"  |  "0.5" → "0.5px"  |  "auto" → stays "auto" (handled separately)
function resolveSpacing(val) {
  return ChaiConfig.spacing[val] ?? val + "px";
}

// Extract arbitrary bracket value
// "[13px]" → "13px"  |  "[#ff5733]" → "#ff5733"
function arbitrary(val) {
  const match = val && val.match(/^\[(.+)\]$/);
  return match ? match[1] : null;
}

// ─── STATIC MAP ──────────────────────────────────────────────────────────────
// Built once at startup from ChaiConfig.
// keyword-only classes — exact string match, no numbers, no colors.
// O(1) lookup — fastest path.

const STATIC = {};

// Display
Object.entries(ChaiConfig.display).forEach(([k, v]) => STATIC[k] = { display: v });

// Position keywords
Object.entries(ChaiConfig.position).forEach(([k, v]) => STATIC[k] = { position: v });

// Flex direction
Object.entries(ChaiConfig.flex.direction).forEach(([k, v]) => STATIC[`flex-${k}`] = { flexDirection: v });

// Flex wrap
Object.entries(ChaiConfig.flex.wrap).forEach(([k, v]) => STATIC[`flex-${k}`] = { flexWrap: v });

// Flex shorthand (flex-1, flex-auto, flex-none)
Object.entries(ChaiConfig.flexShorthand).forEach(([k, v]) => STATIC[`flex-${k}`] = { flex: v });

// Justify content
Object.entries(ChaiConfig.flex.justify).forEach(([k, v]) => STATIC[`justify-${k}`] = { justifyContent: v });

// Align items
Object.entries(ChaiConfig.flex.align).forEach(([k, v]) => STATIC[`items-${k}`] = { alignItems: v });

// Align self
Object.entries(ChaiConfig.flex.self).forEach(([k, v]) => STATIC[`self-${k}`] = { alignSelf: v });

// Text align
Object.entries(ChaiConfig.textAlign).forEach(([k, v]) => STATIC[`text-${k}`] = { textAlign: v });

// Text decoration
Object.entries(ChaiConfig.textDecoration).forEach(([k, v]) => STATIC[k] = { textDecoration: v });

// Text transform
Object.entries(ChaiConfig.textTransform).forEach(([k, v]) => STATIC[k] = { textTransform: v });

// Font weight (keywords)
Object.entries(ChaiConfig.fontWeight).forEach(([k, v]) => STATIC[`font-${k}`] = { fontWeight: v });

// Font size (named: text-sm, text-2xl)
Object.entries(ChaiConfig.fontSize).forEach(([k, v]) => STATIC[`text-${k}`] = { fontSize: v });

// Border radius (named: rounded, rounded-lg, rounded-full)
Object.entries(ChaiConfig.borderRadius).forEach(([k, v]) => {
  STATIC[k === "DEFAULT" ? "rounded" : `rounded-${k}`] = { borderRadius: v };
});

// Border width (named: border, border-2, border-4)
STATIC["border"] = { borderWidth: ChaiConfig.borderWidth.DEFAULT, borderStyle: "solid" };
Object.entries(ChaiConfig.borderWidth).forEach(([k, v]) => {
  if (k !== "DEFAULT") STATIC[`border-${k}`] = { borderWidth: v, borderStyle: "solid" };
});
STATIC["border-solid"]  = { borderStyle: "solid" };
STATIC["border-dashed"] = { borderStyle: "dashed" };
STATIC["border-dotted"] = { borderStyle: "dotted" };
STATIC["border-none"]   = { borderWidth: "0px", borderStyle: "none" };

// Box shadow (named: shadow, shadow-md, shadow-xl)
Object.entries(ChaiConfig.boxShadow).forEach(([k, v]) => {
  STATIC[k === "DEFAULT" ? "shadow" : `shadow-${k}`] = { boxShadow: v };
});

// Overflow
Object.entries(ChaiConfig.overflow).forEach(([k, v]) => {
  STATIC[`overflow-${k}`]   = { overflow: v };
  STATIC[`overflow-x-${k}`] = { overflowX: v };
  STATIC[`overflow-y-${k}`] = { overflowY: v };
});

// Cursor
Object.entries(ChaiConfig.cursor).forEach(([k, v]) => STATIC[`cursor-${k}`] = { cursor: v });

// Transition (named: transition, transition-colors)
Object.entries(ChaiConfig.transition).forEach(([k, v]) => {
  STATIC[k === "DEFAULT" ? "transition" : `transition-${k}`] = { transitionProperty: v };
});

// Transition duration (named: duration-300)
Object.entries(ChaiConfig.transitionDuration).forEach(([k, v]) => STATIC[`duration-${k}`] = { transitionDuration: v });

// Letter spacing
Object.entries(ChaiConfig.letterSpacing).forEach(([k, v]) => STATIC[`tracking-${k}`] = { letterSpacing: v });

// Line height (named: leading-tight, leading-relaxed)
Object.entries(ChaiConfig.lineHeight).forEach(([k, v]) => STATIC[`leading-${k}`] = { lineHeight: v });

// Sizing keywords (w-full, h-screen, w-1/2)
Object.entries(ChaiConfig.sizing).forEach(([k, v]) => {
  STATIC[`w-${k}`] = { width: v };
  STATIC[`h-${k}`] = { height: v };
});
Object.entries(ChaiConfig.heightExtra).forEach(([k, v]) => STATIC[`h-${k}`] = { height: v });

// Z-index (named: z-auto)
Object.entries(ChaiConfig.zIndex).forEach(([k, v]) => STATIC[`z-${k}`] = { zIndex: v });

// User select
Object.entries(ChaiConfig.userSelect).forEach(([k, v]) => STATIC[`select-${k}`] = { userSelect: v });

// Presets (truncate, sr-only)
Object.entries(ChaiConfig.presets).forEach(([k, v]) => STATIC[k] = v);

// Margin auto helpers
STATIC["m-auto"]  = { margin: "auto" };
STATIC["mx-auto"] = { marginLeft: "auto", marginRight: "auto" };
STATIC["my-auto"] = { marginTop:  "auto", marginBottom: "auto" };
STATIC["mt-auto"] = { marginTop:  "auto" };
STATIC["mr-auto"] = { marginRight:  "auto" };
STATIC["mb-auto"] = { marginBottom: "auto" };
STATIC["ml-auto"] = { marginLeft:   "auto" };

// Grow / Shrink
STATIC["grow"]     = { flexGrow: "1" };
STATIC["grow-0"]   = { flexGrow: "0" };
STATIC["shrink"]   = { flexShrink: "1" };
STATIC["shrink-0"] = { flexShrink: "0" };

// Inset
STATIC["inset-0"] = { top: "0px", right: "0px", bottom: "0px", left: "0px" };

// Italic
STATIC["italic"]     = { fontStyle: "italic" };
STATIC["not-italic"] = { fontStyle: "normal" };

// List style
STATIC["list-none"]    = { listStyleType: "none" };
STATIC["list-disc"]    = { listStyleType: "disc" };
STATIC["list-decimal"] = { listStyleType: "decimal" };

// Object fit
STATIC["object-contain"] = { objectFit: "contain" };
STATIC["object-cover"]   = { objectFit: "cover" };
STATIC["object-fill"]    = { objectFit: "fill" };
STATIC["object-none"]    = { objectFit: "none" };

// Whitespace
STATIC["whitespace-nowrap"] = { whiteSpace: "nowrap" };
STATIC["whitespace-normal"] = { whiteSpace: "normal" };
STATIC["whitespace-pre"]    = { whiteSpace: "pre" };

// Pointer events
STATIC["pointer-events-none"] = { pointerEvents: "none" };
STATIC["pointer-events-auto"] = { pointerEvents: "auto" };

// Ease / timing
STATIC["ease-linear"]  = { transitionTimingFunction: "linear" };
STATIC["ease-in"]      = { transitionTimingFunction: "cubic-bezier(0.4,0,1,1)" };
STATIC["ease-out"]     = { transitionTimingFunction: "cubic-bezier(0,0,0.2,1)" };
STATIC["ease-in-out"]  = { transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)" };

// ─── APPLY STYLES ────────────────────────────────────────────────────────────
// Core logic — given one element, find its chai-* classes and apply styles.

function processElement(el) {
  const classes = Array.from(el.classList);

  classes.forEach((className) => {
    if (!className.startsWith("chai-")) return;

    // strip "chai-" → "p-4", "bg-red-500", "text-center"
    const utility = className.slice(5);

    // ── Step 1: Static exact match (fastest path) ──────────────────────────
    if (STATIC[utility]) {
      Object.assign(el.style, STATIC[utility]);
      el.classList.remove(className);
      return;
    }

    // ── Step 2: Dynamic — split into prop + val ────────────────────────────
    // "bg-red-500" → prop="bg", val="red-500"
    // "p-4"        → prop="p",  val="4"
    const dashIndex = utility.indexOf("-");
    if (dashIndex === -1) {
      el.classList.remove(className);
      return; // single word not in STATIC → unknown
    }

    const prop = utility.slice(0, dashIndex);          // "bg", "p", "text"
    const val  = utility.slice(dashIndex + 1);         // "red-500", "4", "center"
    const arb  = arbitrary(val);                       // "13px" if val="[13px]", else null

    // ── Spacing ──────────────────────────────────────────────────────────────
    if (prop === "p")  el.style.padding       = arb ?? resolveSpacing(val);
    if (prop === "pt") el.style.paddingTop     = arb ?? resolveSpacing(val);
    if (prop === "pb") el.style.paddingBottom  = arb ?? resolveSpacing(val);
    if (prop === "pl") el.style.paddingLeft    = arb ?? resolveSpacing(val);
    if (prop === "pr") el.style.paddingRight   = arb ?? resolveSpacing(val);
    if (prop === "px") {
      const size = arb ?? resolveSpacing(val);
      el.style.paddingLeft = el.style.paddingRight = size;
    }
    if (prop === "py") {
      const size = arb ?? resolveSpacing(val);
      el.style.paddingTop = el.style.paddingBottom = size;
    }

    if (prop === "m")  el.style.margin        = arb ?? resolveSpacing(val);
    if (prop === "mt") el.style.marginTop      = arb ?? resolveSpacing(val);
    if (prop === "mb") el.style.marginBottom   = arb ?? resolveSpacing(val);
    if (prop === "ml") el.style.marginLeft     = arb ?? resolveSpacing(val);
    if (prop === "mr") el.style.marginRight    = arb ?? resolveSpacing(val);
    if (prop === "mx") {
      const size = arb ?? resolveSpacing(val);
      el.style.marginLeft = el.style.marginRight = size;
    }
    if (prop === "my") {
      const size = arb ?? resolveSpacing(val);
      el.style.marginTop = el.style.marginBottom = size;
    }

    // ── Sizing ────────────────────────────────────────────────────────────────
    if (prop === "w") el.style.width     = arb ?? ChaiConfig.sizing[val]     ?? resolveSpacing(val);
    if (prop === "h") el.style.height    = arb ?? ChaiConfig.heightExtra[val] ?? ChaiConfig.sizing[val] ?? resolveSpacing(val);
    if (prop === "min-w") el.style.minWidth  = arb ?? resolveSpacing(val);
    if (prop === "min-h") el.style.minHeight = arb ?? resolveSpacing(val);
    if (prop === "max-w") el.style.maxWidth  = arb ?? resolveSpacing(val);
    if (prop === "max-h") el.style.maxHeight = arb ?? resolveSpacing(val);

    // ── Colors ────────────────────────────────────────────────────────────────
    // supports: chai-bg-red | chai-bg-red-500 | chai-bg-[#ff5733]
    if (prop === "bg") {
      el.style.backgroundColor = arb ?? resolveColor(val) ?? val;
    }

    // ── Text: color + size ────────────────────────────────────────────────────
    // supports: chai-text-red-500 | chai-text-[#hex] | chai-text-[20px]
    if (prop === "text") {
      if (arb) {
        // arbitrary: color if starts with # / rgb / hsl, else font-size
        if (/^#|^rgb|^hsl/.test(arb)) el.style.color    = arb;
        else                           el.style.fontSize = arb;
      } else {
        const c = resolveColor(val);
        if (c) el.style.color = c;
        // font size and text align are already in STATIC — nothing to do here
      }
    }

    // ── Border color ──────────────────────────────────────────────────────────
    if (prop === "border") {
      const c = arb ?? resolveColor(val);
      if (c) el.style.borderColor = c;
    }

    // ── Border side width: chai-border-t | chai-border-t-2 ────────────────────
    if (prop === "border") {
      const sideMap = { t: "borderTopWidth", r: "borderRightWidth", b: "borderBottomWidth", l: "borderLeftWidth" };
      const side    = val[0]; // "t", "r", "b", "l"
      const num     = val.slice(2); // "2" in "t-2", or "" in "t"
      if (sideMap[side]) {
        el.style[sideMap[side]] = num ? num + "px" : ChaiConfig.borderWidth.DEFAULT;
        el.style.borderStyle = "solid";
      }
    }

    // ── Border radius corner: chai-rounded-tl-lg ─────────────────────────────
    if (prop === "rounded") {
      const cornerMatch = val.match(/^(tl|tr|br|bl|t|r|b|l)-(.+)$/);
      if (cornerMatch) {
        const corners = ChaiConfig.borderRadiusCorner[cornerMatch[1]];
        const radius  = ChaiConfig.borderRadius[cornerMatch[2]] ?? cornerMatch[2] + "px";
        if (corners) corners.forEach(p => el.style[p] = radius);
      } else {
        // arbitrary: chai-rounded-[8px]
        if (arb) el.style.borderRadius = arb;
      }
    }

    // ── Opacity: chai-opacity-50 → 0.5 ───────────────────────────────────────
    if (prop === "opacity") {
      el.style.opacity = ChaiConfig.opacity[val] ?? String(parseInt(val, 10) / 100);
    }

    // ── Z-index ───────────────────────────────────────────────────────────────
    if (prop === "z") el.style.zIndex = val;

    // ── Position offsets ──────────────────────────────────────────────────────
    if (prop === "top")    el.style.top    = arb ?? resolveSpacing(val);
    if (prop === "right")  el.style.right  = arb ?? resolveSpacing(val);
    if (prop === "bottom") el.style.bottom = arb ?? resolveSpacing(val);
    if (prop === "left")   el.style.left   = arb ?? resolveSpacing(val);

    // ── Gap ───────────────────────────────────────────────────────────────────
    if (prop === "gap")   el.style.gap       = arb ?? resolveSpacing(val);
    if (prop === "gap-x") el.style.columnGap = arb ?? resolveSpacing(val);
    if (prop === "gap-y") el.style.rowGap    = arb ?? resolveSpacing(val);

    // ── Grid ──────────────────────────────────────────────────────────────────
    if (utility.startsWith("grid-cols-")) {
      const n = utility.replace("grid-cols-", "");
      el.style.gridTemplateColumns = arb ?? `repeat(${n}, minmax(0, 1fr))`;
    }
    if (utility.startsWith("grid-rows-")) {
      const n = utility.replace("grid-rows-", "");
      el.style.gridTemplateRows = `repeat(${n}, minmax(0, 1fr))`;
    }
    if (utility.startsWith("col-span-")) {
      const n = utility.replace("col-span-", "");
      el.style.gridColumn = `span ${n} / span ${n}`;
    }
    if (utility.startsWith("row-span-")) {
      const n = utility.replace("row-span-", "");
      el.style.gridRow = `span ${n} / span ${n}`;
    }

    // ── Transition duration (arbitrary) ───────────────────────────────────────
    if (prop === "duration") {
      el.style.transitionDuration = ChaiConfig.transitionDuration[val] ?? val + "ms";
    }

    // ── Font size (arbitrary) ─────────────────────────────────────────────────
    if (prop === "text" && arb) el.style.fontSize = arb;

    // ── Shadow (arbitrary) ───────────────────────────────────────────────────
    if (prop === "shadow" && arb) el.style.boxShadow = arb;

    // Remove the chai-* class after applying
    el.classList.remove(className);
  });
}

// ─── DOM SCAN ────────────────────────────────────────────────────────────────

function scanDOM() {
  document.querySelectorAll("*").forEach(processElement);
}

// ─── MUTATION OBSERVER ───────────────────────────────────────────────────────
// Watches for:
//   1. New elements added to the DOM (e.g. JS inserting a card)
//   2. Class attribute changes on existing elements

function watchDOM() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Newly added nodes
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        processElement(node);
        node.querySelectorAll("*").forEach(processElement);
      });
      // Class attribute changed on an existing element
      if (mutation.type === "attributes" && mutation.attributeName === "class") {
        processElement(mutation.target);
      }
    });
  });

  observer.observe(document.body, {
    childList:       true,
    subtree:         true,
    attributes:      true,
    attributeFilter: ["class"],
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

function init() {
  scanDOM();
  document.body.style.opacity = "1"; // FOUC fix — add body{opacity:0} in your CSS
  watchDOM();
  console.log("☕ ChaiTailwind engine ready");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

export { init as initChai };
