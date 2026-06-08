# CareerDev AI — Design System

**Palette source:** https://colorhunt.co/palette/1f6f5f2fa0846fcf97eeeeee

## Brand colors

| Token              | Hex       | Role                                                  |
|--------------------|-----------|-------------------------------------------------------|
| `brand-primary`    | `#1F6F5F` | Deep teal-green — primary actions, links, headings    |
| `brand-primary-2`  | `#2FA084` | Mid emerald — secondary fills, gradient mid           |
| `brand-secondary`  | `#6FCF97` | Light spring green — supporting surfaces, gradient ends|
| `brand-soft`       | `#EEEEEE` | Light gray — soft surfaces & neutrals                 |
| `brand-accent`     | `#2FA084` | Mid emerald — CTA fill, active state                  |

> **Why `brand-accent` reuses `#2FA084`.** The palette has only one neutral (`#EEEEEE`), which is too pale to carry a CTA. The mid emerald `#2FA084` is dark and saturated enough for button fills against light backgrounds, so `brand-accent` reuses it (= `accent-500`). The light gray lives as `brand-soft` for soft surfaces and neutrals.

## Class-family mapping — the most important table

The palette is one green hue in three shades (dark → mid → light). Those three shades are spread across distinct class families so the multi-stop gradients that dominate the codebase sweep *dark → light green* instead of collapsing onto a single tone.

| Class family | Palette color | Anchor hex |
|--------------|---------------|------------|
| `blue-*`, `sky-*`, `cyan-*`         | Deep teal-green (`brand-primary`) | `#1F6F5F` |
| `indigo-*`                          | Mid emerald (`brand-primary-2`)   | `#2FA084` |
| `purple-*`, `violet-*`, `pink-*`, `fuchsia-*` | Light spring green (`brand-secondary`) | `#6FCF97` |
| `teal-*`, `orange-*`                | Mid emerald (accent)         | `#2FA084` |
| `emerald-*`, `green-*`, `lime-*`    | Success-green (status)       | `#10B981` |
| `amber-*`, `yellow-*`               | Warning-amber (status)       | `#F59E0B` |
| `red-*`, `rose-*`                   | Danger-red (status)          | `#EF4444` |
| `gray-*`, `slate-*`, `zinc-*`, `neutral-*`, `stone-*` | Light gray | `#EEEEEE` |

### What this means for existing code

These very common gradient patterns now sweep dark → light green automatically:

- `from-indigo-600 to-purple-600` → **mid emerald → light spring green**
- `from-blue-500 to-indigo-500` → **deep teal → mid emerald**
- `from-blue-500 via-indigo-500 to-purple-700` → **deep teal → mid emerald → light green** (the full palette swept in one gradient)
- `from-indigo-600 to-pink-600` → **mid emerald → light spring green**
- `bg-orange-100` / `from-teal-500` → **emerald**

## Neutrals — Light gray

Body text, borders, surfaces. The palette's `#EEEEEE` anchors a cool-neutral gray scale.

| Use                | Token          | Hex       |
|--------------------|----------------|-----------|
| Page background    | `gray-50`      | `#FAFAFA` |
| Card surface       | `white`        | `#FFFFFF` |
| Subtle border      | `gray-200`     | `#EEEEEE` |
| Default border     | `gray-300`     | `#DCDCDC` |
| Muted text         | `gray-500`     | `#9E9E9E` |
| Secondary text     | `gray-700`     | `#555555` |
| Primary text       | `gray-900`     | `#1E1E1E` |

## Semantic colors

Status hues stay on universal colors so meaning is preserved across the app.

| Use      | Token            | Hex       |
|----------|------------------|-----------|
| Success  | `success-600`    | `#059669` |
| Danger   | `danger-600`     | `#DC2626` |
| Warning  | `warning-500`    | `#F59E0B` |

> Note: `success` overlaps visually with the brand greens. Use status greens **only** for true success states (checkmarks, "passed", positive deltas), never decoratively — the brand greens carry the decorative load.

## Dark theme

Used on the `GetStarted` onboarding flow and the authenticated app shell. CSS variables in `index.css` swap when the `.theme-dark` class is on the root. Inline-styled darks in `GetStarted.tsx` route through a local `DARK` constants block.

The dark theme sweeps the green palette dark-to-light: card surfaces fade from emerald into deeper teal, active cards push toward the teal primary, and the active-border highlight is the bright spring green — so a single card edge-to-active traverses the palette and the bright accent marks the active state.

| Use                 | Token             | Hex       |
|---------------------|-------------------|-----------|
| Page background     | `teal-900`        | `#0C2C27` |
| Raised surface      | `teal-800`        | `#13423A` |
| Card surface start  | `emerald-800`     | `#175040` |
| Card surface end    | `emerald-700`     | `#1F6A57` |
| Active card start   | `emerald-600`     | `#26856D` |
| Active card end     | `brand-primary`   | `#1F6F5F` |
| Default border      | `emerald-600`     | `#26856D` |
| Active border       | `brand-secondary` | `#6FCF97` |

## Shadows

Use the brand-tinted shadows for elements that need depth without harsh black:

- `shadow-brand-sm` — subtle
- `shadow-brand`    — default
- `shadow-brand-lg` — elevated cards, modals
- `shadow-brand-xl` — overlays, popovers
- `shadow-accent`   — for emerald CTAs that should pop off the page

## Guidelines

1. **Prefer signature multi-stop gradients** like `from-blue-500 via-indigo-500 to-purple-700` for hero surfaces — these now sweep the full dark-to-light green palette.
2. **Prefer semantic tokens** (`brand-primary`, `brand-secondary`, `brand-soft`, `brand-accent`) over scale numbers in new code.
3. **Never hardcode hex** in component files. Use Tailwind classes or, for dark-theme inline styles, the `DARK` constants in `GetStarted.tsx`.
4. **Status colors** (`success`, `danger`, `warning`) carry meaning — do not use them decoratively. This matters extra now that `success` is green like the brand.
5. **The light spring green is precious.** It's the brightest color in the palette — use `brand-secondary` for highlights, active-state borders, and gradient ends. Overusing it dilutes its impact.
