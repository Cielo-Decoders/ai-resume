/** @type {import('tailwindcss').Config} */

// ──────────────────────────────────────────────────────────────────────────────
// CareerDev AI — Design Token System
// ──────────────────────────────────────────────────────────────────────────────
// Palette source: https://colorhunt.co/palette/1f6f5f2fa0846fcf97eeeeee
//
//   #1F6F5F  brand-primary   — deep teal-green, primary actions, headings
//   #2FA084  brand-primary-2 — mid emerald, secondary fills, gradient mid
//   #6FCF97  brand-secondary — light spring green, supporting surfaces, accents
//   #EEEEEE  brand-soft      — light gray, soft surfaces & neutrals
//   #2FA084  brand-accent    — mid emerald reused for CTA fills (strong enough
//                              for buttons against light backgrounds)
//
// ── KEY DESIGN PRINCIPLE: the palette is one green hue in three shades
// (dark → mid → light). We spread those three shades across the cool-color
// class families so existing multi-stop gradients sweep dark → light green
// instead of collapsing onto a single tone. The class-family mapping is:
//
//   blue / sky / cyan        → deep teal-green family (anchor #1F6F5F, darkest)
//   indigo                   → mid emerald family      (anchor #2FA084)
//   purple / violet          → light green family      (anchor #6FCF97, lightest)
//   pink / fuchsia           → light green family (kept on light green)
//   teal / orange            → mid emerald (accent #2FA084)
//   emerald / green / lime   → success-green (status semantic — stays green)
//   amber / yellow           → warning-amber (status semantic)
//   red / rose               → danger-red (status semantic)
//   gray / slate / zinc / neutral / stone → light gray neutrals (#EEEEEE)
//
// This means a common gradient like `from-indigo-600 to-purple-600` now reads
// as mid emerald → light green, and `from-blue-500 via-indigo-500 to-purple-700`
// reads as deep teal → mid emerald → light green — the full palette swept
// dark-to-light across one element.
// ──────────────────────────────────────────────────────────────────────────────

const brand = {
  primary:   '#1F6F5F',
  primary2:  '#2FA084',
  secondary: '#6FCF97',
  soft:      '#EEEEEE',
  accent:    '#2FA084',
};

// ── Deep teal-green scale, anchored on #1F6F5F at 600.
// Used by: blue-*, sky-*, cyan-*  AND brand-* / -primary.
// Darkest cool of the palette — gradient starts, primary actions, headings.
const tealScale = {
  50:  '#EAF6F3',
  100: '#CDE9E2',
  200: '#9CD3C5',
  300: '#69BBA9',
  400: '#3F9C88',
  500: '#2A8270',
  600: '#1F6F5F',    // PRIMARY (deep teal-green)
  700: '#19594C',
  800: '#13423A',
  900: '#0C2C27',
  950: '#061714',
};

// ── Mid emerald scale, anchored on #2FA084 at 500.
// Used by: indigo-*  AND brand-primary2 / brand-accent.
// Sits between deep teal (darker) and light green (lighter), making it the
// natural mid-stop for `from-blue-500 to-indigo-500 to-purple-600` sweeps.
const emeraldScale = {
  50:  '#EBF7F3',
  100: '#D0EDE4',
  200: '#A3DCCA',
  300: '#73CBAF',
  400: '#4DB698',
  500: '#2FA084',    // PRIMARY-2 (mid emerald) + ACCENT (CTA fills)
  600: '#26856D',
  700: '#1F6A57',
  800: '#175040',
  900: '#0F352B',
  950: '#081B16',
};

// ── Light spring-green scale, anchored on #6FCF97 at 400.
// Used by: purple-*, violet-*, pink-*, fuchsia-*  AND brand-secondary.
// Lightest, brightest cool of the palette — gradient ends, accents, highlights.
const springScale = {
  50:  '#F1FBF5',
  100: '#DEF5E7',
  200: '#BDEBCF',
  300: '#94DDB1',
  400: '#6FCF97',    // SECONDARY (light spring green)
  500: '#4DBC7C',
  600: '#3AA066',
  700: '#2F8052',
  800: '#266542',
  900: '#1C4A30',
  950: '#0E2718',
};

// ── Light-gray scale, anchored on the palette swatch #EEEEEE at 200.
// Used by: gray-*, slate-*, zinc-*, neutral-*, stone-*  AND brand-soft.
// The palette's neutral — page surfaces, borders, muted text.
const grayScale = {
  50:  '#FAFAFA',
  100: '#F4F4F4',
  200: '#EEEEEE',    // SOFT (palette swatch)
  300: '#DCDCDC',
  400: '#BDBDBD',
  500: '#9E9E9E',
  600: '#757575',
  700: '#555555',
  800: '#333333',
  900: '#1E1E1E',
  950: '#0F0F0F',
};

// Semantic colors. Success/danger/warning stay on their universal hues so
// status indicators retain meaning across the app.
const success = {
  50:  '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0', 300: '#6EE7B7',
  400: '#34D399', 500: '#10B981', 600: '#059669', 700: '#047857',
  800: '#065F46', 900: '#064E3B', 950: '#022C22',
};
const danger = {
  50:  '#FEF2F2', 100: '#FEE2E2', 200: '#FECACA', 300: '#FCA5A5',
  400: '#F87171', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C',
  800: '#991B1B', 900: '#7F1D1D', 950: '#450A0A',
};
const warning = {
  50:  '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D',
  400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309',
  800: '#92400E', 900: '#78350F', 950: '#451A03',
};

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Semantic tokens (preferred for new code) ──────────────────────
        brand: {
          primary:   brand.primary,
          primary2:  brand.primary2,
          secondary: brand.secondary,
          accent:    brand.accent,
          soft:      brand.soft,
          ...tealScale,             // bg-brand-600 = deep teal-green
        },
        accent: emeraldScale,         // bg-accent-500 = emerald CTA fill
        soft:   grayScale,            // bg-soft-200  = light gray surface
        success,
        danger,
        warning,

        // ── Legacy aliases — spread palette across class families ──────────
        // Each cool-color family hosts a DIFFERENT shade of the green palette,
        // so multi-stop gradients in the codebase sweep dark → light green
        // instead of collapsing onto a single tone.
        blue:    tealScale,           // deep teal-green (#1F6F5F)
        sky:     tealScale,           // same family
        cyan:    tealScale,           // same family
        indigo:  emeraldScale,        // mid emerald (#2FA084)
        purple:  springScale,         // light spring green (#6FCF97)
        violet:  springScale,         // light spring green
        fuchsia: springScale,         // light spring green
        pink:    springScale,         // light spring green
        // Decorative warm-leaning classes → emerald accent.
        teal:    emeraldScale,
        orange:  emeraldScale,
        // Status semantics stay on real status hues.
        emerald: success,
        green:   success,
        lime:    success,
        amber:   warning,
        yellow:  warning,
        red:     danger,
        rose:    danger,
        // Neutrals → light gray.
        gray:    grayScale,
        slate:   grayScale,
        zinc:    grayScale,
        neutral: grayScale,
        stone:   grayScale,
      },
      // Soft shadows tuned for the teal-green palette — replaces the default
      // black-tinted shadows that look harsh against light surfaces.
      boxShadow: {
        'brand-sm': '0 1px 2px 0 rgba(31, 111, 95, 0.10)',
        'brand':    '0 4px 12px -2px rgba(31, 111, 95, 0.20), 0 2px 4px -2px rgba(31, 111, 95, 0.10)',
        'brand-lg': '0 12px 24px -6px rgba(31, 111, 95, 0.24), 0 4px 8px -4px rgba(31, 111, 95, 0.14)',
        'brand-xl': '0 24px 48px -12px rgba(31, 111, 95, 0.32)',
        'accent':   '0 8px 20px -4px rgba(47, 160, 132, 0.40)',
      },
    },
  },
  plugins: [],
};
