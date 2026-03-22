# ☕ ChaiTailwind

> A lightweight utility-first CSS engine built from scratch using JavaScript.
> Inspired by Tailwind CSS — but brewed your way.

---

## 🧠 What is this?

ChaiTailwind lets you style HTML elements using class names that start with `chai-`.

Instead of writing CSS files, you write classes like `chai-p-4`, `chai-bg-red-500`, or `chai-flex` — and the JavaScript engine scans the DOM, reads those classes, and applies the correct inline styles automatically.

```html
<div class="chai-flex chai-items-center chai-gap-4 chai-p-8 chai-bg-red-500 chai-rounded-xl">
  <p class="chai-text-white chai-font-bold chai-text-2xl">Hello, Chai! ☕</p>
</div>
```

No build step. No npm. No config. Just a script tag.

---

## 🚀 How to use

**1. Add the script to your HTML**

```html
<script type="module" src="engine.js"></script>
```

**2. Start using chai-* classes**

```html
<div class="chai-p-6 chai-bg-blue-500 chai-rounded-lg chai-text-white">
  I am styled by ChaiTailwind
</div>
```

**3. Open with Live Server** — that's it.

> ⚠️ The `type="module"` attribute is required because `engine.js` uses ES Module imports.

---

## ✨ Features

- 🎨 **Full Tailwind color palette** — all 22 color families with shades from 50 to 950
- 📐 **Complete spacing system** — padding, margin, gap with 1px per unit scale
- 💪 **Flexbox utilities** — direction, wrap, justify, align, gap
- 🔲 **Grid utilities** — `grid-cols-N`, `col-span-N`, `row-span-N`
- 🔤 **Typography** — font size, weight, line height, letter spacing, transforms
- 🟦 **Borders & radius** — widths, styles, corner-specific radius
- 🌑 **Shadows** — sm through 2xl presets
- 🔍 **Opacity** — 0 to 100
- ✏️ **Arbitrary values** — `chai-p-[13px]`, `chai-bg-[#ff5733]`, `chai-w-[200px]`
- ⚡ **MutationObserver** — dynamically added elements get styled too
- 🚫 **FOUC prevention** — page reveals only after all styles are applied
- 📦 **Zero dependencies** — pure vanilla JavaScript

---

## 📁 Project Structure

```
chai-tailwind/
├── config.js     ← all data (colors, spacing, font sizes, etc.)
├── engine.js     ← DOM scanner + style applier
└── demo.html     ← live demo page
```

**`config.js`** is the single source of truth. Every value — colors, spacing, border radius, shadows — lives here as a plain JavaScript object exported as `ChaiConfig`.

**`engine.js`** imports `ChaiConfig`, scans the DOM for `chai-*` classes, parses them, and applies inline styles. It uses a two-step approach:

1. **Static map** — keyword classes like `chai-flex`, `chai-rounded-lg` are looked up instantly (O(1))
2. **Dynamic parsing** — numeric and color classes like `chai-p-4`, `chai-bg-red-500` are parsed and resolved against the config

---

## 🎨 Supported Utilities

### Spacing
```
chai-p-4       → padding: 4px
chai-px-8      → padding-left: 8px; padding-right: 8px
chai-mt-12     → margin-top: 12px
chai-mx-auto   → margin-left: auto; margin-right: auto
chai-gap-6     → gap: 6px
```

### Colors
```
chai-bg-red-500      → background-color: #ef4444
chai-text-blue-300   → color: #93c5fd
chai-border-zinc-700 → border-color: #3f3f46
chai-bg-[#ff5733]    → background-color: #ff5733  (arbitrary)
```

### Typography
```
chai-text-xl         → font-size: 1.25rem
chai-text-2xl        → font-size: 1.5rem
chai-font-bold       → font-weight: 700
chai-font-semibold   → font-weight: 600
chai-leading-relaxed → line-height: 1.625
chai-tracking-wide   → letter-spacing: 0.025em
chai-uppercase       → text-transform: uppercase
chai-italic          → font-style: italic
```

### Layout
```
chai-flex            → display: flex
chai-grid            → display: grid
chai-block           → display: block
chai-hidden          → display: none
chai-flex-col        → flex-direction: column
chai-flex-wrap       → flex-wrap: wrap
chai-justify-center  → justify-content: center
chai-justify-between → justify-content: space-between
chai-items-center    → align-items: center
```

### Grid
```
chai-grid-cols-3     → grid-template-columns: repeat(3, minmax(0, 1fr))
chai-grid-cols-4     → grid-template-columns: repeat(4, minmax(0, 1fr))
chai-col-span-2      → grid-column: span 2 / span 2
chai-row-span-2      → grid-row: span 2 / span 2
```

### Sizing
```
chai-w-full          → width: 100%
chai-h-screen        → height: 100vh
chai-w-1/2           → width: 50%
chai-w-[200px]       → width: 200px  (arbitrary)
chai-max-w-[600px]   → max-width: 600px  (arbitrary)
```

### Border
```
chai-border          → border-width: 1px; border-style: solid
chai-border-2        → border-width: 2px; border-style: solid
chai-rounded         → border-radius: 0.25rem
chai-rounded-lg      → border-radius: 0.5rem
chai-rounded-full    → border-radius: 9999px
```

### Shadow
```
chai-shadow          → default box shadow
chai-shadow-md       → medium box shadow
chai-shadow-xl       → extra large box shadow
```

### Opacity
```
chai-opacity-50      → opacity: 0.5
chai-opacity-75      → opacity: 0.75
chai-opacity-100     → opacity: 1
```

### Position
```
chai-relative        → position: relative
chai-absolute        → position: absolute
chai-fixed           → position: fixed
chai-sticky          → position: sticky
chai-top-4           → top: 4px
chai-left-0          → left: 0px
```

### Misc
```
chai-cursor-pointer  → cursor: pointer
chai-overflow-hidden → overflow: hidden
chai-z-10            → z-index: 10
chai-transition      → transition-property: all common properties
chai-duration-300    → transition-duration: 300ms
chai-select-none     → user-select: none
chai-truncate        → overflow: hidden; text-overflow: ellipsis; white-space: nowrap
```

---

## ⚡ Arbitrary Values

ChaiTailwind supports any custom value wrapped in square brackets:

```html
<!-- custom colors -->
<div class="chai-bg-[#6f4e37]">Coffee brown background</div>
<div class="chai-text-[rgb(255,100,0)]">Custom orange text</div>

<!-- custom sizes -->
<div class="chai-p-[13px]">Exact 13px padding</div>
<div class="chai-w-[340px]">Exact 340px width</div>
<div class="chai-h-[50vh]">50vh height</div>

<!-- custom shadows -->
<div class="chai-shadow-[0_4px_20px_rgba(0,0,0,0.4)]">Custom shadow</div>
```

---

## 🎯 How the Engine Works

```
1. document.querySelectorAll("*")
         ↓
2. filter classes starting with "chai-"
         ↓
3. strip "chai-" prefix
         ↓
4a. STATIC map lookup  →  "flex", "rounded-lg", "italic"   →  O(1)
4b. Dynamic parsing    →  "bg-red-500", "p-4", "text-2xl"  →  config lookup
         ↓
5. apply as inline styles
         ↓
6. remove chai-* class from element
```

The color resolver supports three formats:
- Flat color: `white` → `#ffffff`
- Shaded color: `red-500` → `#ef4444`
- Arbitrary: `[#ff5733]` → `#ff5733`

---

## 🔧 Customizing the Config

All values live in `config.js`. You can add your own:

```js
// config.js
export const ChaiConfig = {
  spacing: {
    // add your custom values
    13: "13px",
    15: "15px",
  },
  colors: {
    // add custom color
    brand: "#your-hex",
  },
  // ...rest of config
}
```

---

## 🤯 What I Learned

- DOM traversal and manipulation
- Building a CSS parser from scratch
- Utility-first design thinking
- How frameworks like Tailwind work internally
- ES Modules in the browser
- MutationObserver for dynamic content
- Separating config from logic

---

## 💡 Inspiration

Inspired by Tailwind CSS — but built from scratch to understand how it works under the hood.

Built as part of the **Web Dev Cohort 2026** Buildathon by **ChaiCode**.

---

## 📸 Demo

Open `demo.html` with Live Server to see all utilities in action — colors, typography, flexbox, grid, spacing, borders, shadows, arbitrary values, and more.

---

*If you found this useful, drop a ⭐ on the repo!*
