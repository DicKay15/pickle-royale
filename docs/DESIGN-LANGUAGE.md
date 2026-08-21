# Pickle Royale: Design Language

**Status: canonical.** This file is the source of truth for how Pickle Royale
looks and feels, on every platform. The web app (`src/index.css`) is the
reference implementation. The Expo app (`pickle-royale-app`) must match it.

If a decision here disagrees with an implementation, the implementation is
wrong. If a new surface needs something this file does not cover, extend this
file first, then build.

---

## 1. The concept in one line

**Retro athletic club × arcade scoreboard.** Cream paper stock, court-green ink,
electric lime highlights, and physical "sticker" cards that sit on the page with
a hard printed shadow. Nothing is glassy, nothing is blurred, nothing floats.

Three feelings, in priority order:

1. **Printed.** Everything looks stamped, die-cut, or silkscreened onto paper.
2. **Chunky.** Thick 2px ink outlines, heavy display type, generous touch targets.
3. **Competitive.** Numbers are the loudest thing on screen. Ratings are monospace.

---

## 2. Colour

The full palette. There are no other colours. Do not tint, do not interpolate,
do not introduce a "muted" variant on the fly.

| Token | Hex | Used for |
|---|---|---|
| `cream` | `#FBF6EA` | Page background. Never `#fff`, never `#000`. |
| `cream-dim` | `#F3ECDA` | Recessed surfaces: preset buttons, pill backgrounds, toggle track. |
| `paper` | `#FFFFFF` | Card fills only. Cards are white *on* cream, never cream on cream. |
| `ink` | `#142A1F` | Every border. Every shadow. Body text. |
| `ink-soft` | `#3C5247` | Secondary text, dashed borders, muted numbers. |
| `court` | `#14604A` | Team A / "green" side, rising sparklines, focus rings, link accents. |
| `court-deep` | `#0C3B2D` | Headings, tab bar fill, champion card, big rating numbers. |
| `lime` | `#C9F73A` | The primary action colour. CTAs, champion rating, active tab. |
| `lime-hot` | `#B3EF10` | Pressed state of lime surfaces. |
| `lime-soft` | `#ECFAC7` | Success banners, team-A tint, avatar backing on ranked rows. |
| `coral` | `#FF6B4A` | Team B / "orange" side, falling sparklines, the `ROYALE` wordmark. |
| `coral-soft` | `#FFE3DA` | Team-B tint, destructive pressed states. |
| `gold` | `#FFC93C` | Demo banner, earned achievements, the `YOU` pill. |
| `sky` | `#8FD8E8` | Cold-streak ("skid") pill. This is its only job. |
| `success` | `#247A55` | Positive rating deltas in history. |
| `danger` | `#C8422E` | Errors and destructive confirmations. |

**Rules**

- The only gradient in the product is the champion card
  (`160deg, court → court-deep`) and the two team zones
  (`180deg, #fff 0% → tint 140%`). Both are so shallow they read as a light
  source, not as a gradient. Never add another.
- Nothing uses opacity to fake a colour. Use the token that already exists.
- The champion card is the single dark surface in the light UI. Do not make a
  second one.

---

## 3. Type

Three families. All self-hosted. No system-font fallback is ever acceptable in
shipped UI. A system-font leak is the single most obvious "this is the cheap
version" tell.

| Role | Family | Where |
|---|---|---|
| Display | **Lilita One** | Headings, page titles, CTAs, rank numbers, scores in history, brand mark. Always `text-transform: uppercase`. |
| Body | **Bricolage Grotesque** | Everything else. Weights used: 400, 500, 600, 700, 800. |
| Mono | **Azeret Mono** | Every rating, delta, percentage, join code, and score value. Weights: 500, 700, 800. |

**The mono rule matters.** If a number represents a rating, a rating change, or a
score, it is Azeret Mono. If it is a count of something ("18W – 7L", "25
matches"), it is Bricolage. This is what makes ratings feel authoritative.

**Type scale (mobile, 375px wide)**

| Element | Size / line-height | Family & weight |
|---|---|---|
| Brand wordmark | `clamp(26px, 7vw, 34px)` / 0.95 | Display |
| Page title | 24 / 29, `+0.5` tracking | Display |
| Section head | 14 / 18, `+0.05em` tracking | Display |
| Champion name | 28 / 28 | Display |
| Champion rating | 34 / 34 | Mono 800 |
| Row name | 16 / 19 | Body 800 |
| Row honorific | 11 / 12, *italic* | Body 700 |
| Row rating | 20 / 23 | Mono 800 |
| Row sub / record | 12 / 15 | Body 600 |
| Big score | 72 / 72 | Mono 900 |
| Primary CTA | 20 / 24, `+0.06em` | Display |
| Caption / label | 9–11, `+0.08em`–`+0.16em` uppercase | Body 800 |

**Tracking.** Small uppercase labels always get wide tracking (`0.08em` to
`0.16em`). Display type gets almost none (`0.5px`). Body gets none.

---

## 4. Construction, the part that makes or breaks it

This is the section that separates a real Pickle Royale surface from a
generic one. Every one of these is load-bearing.

### 4.1 The border

```
border: 2px solid #142A1F
```

Two pixels. Ink. On every card, button, pill, avatar, input, and tab bar.
Sub-elements that sit *inside* an already-bordered card drop to `1.5px`
(streak pills, small avatars, achievement chips, `NEW` tags).

Hairline (`1px`) is used only for internal table-style dividers, and it is
`cream-dim`, not ink.

### 4.2 The shadow

```
--shadow:    0 3px 0 #142A1F   /* cards, buttons, group bar */
--shadow-lg: 0 5px 0 #142A1F   /* champion card, tab bar, CTA, modals */
             0 2px 0 #142A1F   /* small chips, stat cells, claim rows */
```

**Zero blur. Zero spread. Pure vertical offset. Always ink, never black,
never rgba.** This is the signature of the whole product. A blurred shadow
anywhere instantly reads as a different app.

The one exception: elements sitting *on* the dark champion card use
`0 3px 0 rgba(0,0,0,0.4)`, because ink-on-court-deep is invisible.

### 4.3 The press

Every pressable surface moves *down into* its own shadow. It does not scale,
it does not fade, it does not lift.

| Rest | Pressed |
|---|---|
| `translateY(0)` + `0 3px 0` | `translateY(2px)` + `0 1px 0` |
| `translateY(0)` + `0 5px 0` (CTA) | `translateY(4px)` + `0 1px 0` |
| `translateY(0)` + `0 2px 0` (chip) | `translateY(2px)` + `none` |

Transition: `0.12s–0.15s ease` on `transform` and `box-shadow` only.

Hover lift (`translateY(-2px)`, `0 5px 0`) exists **only** behind
`@media (hover: hover)`, because it is a desktop-mouse affordance and must never
appear on touch.

### 4.4 Radius

Radius varies by element size. Uniform radius is a tell.

| Value | Applies to |
|---|---|
| `999px` | Pills, chips, group bar, tab bar, avatars, streak tags, segmented control |
| `22px` | Champion card, modals, sheets (top corners only), reveal card |
| `18px` (`--radius`) | Standard cards, board rows, team zones, CTA |
| `12px` (`--radius-sm`) | Small cards, stat cells, steppers, inputs, score box |
| `8px` | Icon buttons, the scrub pill |
| `5px` | The rotated `OFFICIAL POWER RANKINGS` stamp |

### 4.5 Spacing

| Token | px |
|---|---|
| `xs` | 4 |
| `sm` | 8 |
| `md` | 12 |
| `lg` | 16 |
| `xl` | 24 |
| `xxl` | 32 |

Page gutter is **16px**, always. Content column caps at **520px** and centres.
Card-to-card vertical rhythm is **10px** inside a list, **14px** between
sections.

### 4.6 The paper

The page background is `cream` plus two layers:

1. A court-green radial wash: `ellipse 90% 50% at 50% -10%`,
   `rgba(20,96,74,0.08)` → transparent at 60%.
2. A **fractal-noise grain** at ~4% alpha (`feTurbulence`, `baseFrequency 0.9`,
   2 octaves).

It is *grain*, not a dot grid. A regular repeating dot pattern is explicitly
wrong: it reads as generated-template texture and violates the house
anti-slop rules. If the platform cannot do fractal noise, use a tiled noise
bitmap, not circles on a lattice.

---

## 5. Component specs

### 5.1 Masthead

Mascot badge 58×58 with `drop-shadow(0 3px 0 ink)`, so the mascot casts the same
hard shadow as everything else. Tapping it wiggles it
(`rotate -12° → 9° → -5°`, 0.55s); five taps fires an easter-egg toast.

Beside it: the rotated stamp, the wordmark, the tagline.

- Stamp: 9px display, `+0.14em`, coral text, 2px coral border, `rotate(-3deg)`,
  `opacity 0.92`.
- Wordmark: `PICKLE` in `court-deep`, `ROYALE` in `coral` with a 1px ink stroke.
- Tagline: 12px body 600, uppercase, `+0.04em`, `ink-soft`. Cycles through five
  lines every 5s with a fade, and stops entirely under reduced-motion.

### 5.2 Group bar

Full-width white pill, 2px ink, `0 3px 0`, min-height 44, padding `8px 14px`.
Group name left (body 800, 14px, truncating). Join code right in **mono** 12px
`ink-soft`. Chevron 18px `ink-soft`. Presses down into its shadow.

### 5.3 Champion card

The hero. `court → court-deep` gradient, 22px radius, `0 5px 0`, 18px padding.

- An inset court outline: `inset: 12px`, 2px `rgba(251,246,234,0.14)`, 14px radius.
- A centre net line: 2px vertical, same colour, `top/bottom: 12px`, `left: 50%`.
- Crown emoji 44px, absolutely positioned `top: -6px, right: 14px`,
  `rotate(12deg)`, bobbing on a 3s ease-in-out loop.
- `REIGNING CHAMP` label: 11px, `+0.16em`, lime.
- Avatar 64px, lime fill, ink border, `0 3px 0 rgba(0,0,0,0.4)`.
- Name 28px display, clamped to `8.5ch` with ellipsis.
- Honorific 12.5px body 700 *italic*, lime.
- Rating 34px **mono 800** lime, right-aligned, with a 10px `+0.12em` label under it.

### 5.4 Board row

White, 18px radius, 2px ink, `0 3px 0`, padding `12px 14px`, gap 12.

`[rank 20px display, 28px wide] [avatar 44px lime-soft] [name / honorific /
record] [rating 20px mono + sparkline]`

- Streak pills: `≥3` → coral fill, white text, 🔥. `≤-3` → sky fill, ink text, 🧊.
  Both 11px body 800, 1.5px ink border, pill radius.
- `NEW` provisional tag: 9px, `cream-dim` fill, 1.5px ink, `+0.08em`.
- Sparkline: **64×20**, 2px stroke, round caps and joins, no fill.
  `court` when the last point ≥ the first, `coral` otherwise.

### 5.5 Tab bar

Floating pill, **content-hugging and centred**, not a full-width bar.
`court-deep` fill, 2px ink, `999px`, `0 5px 0`, 6px padding, sits
`12px + safe-area` above the bottom edge.

Tabs: icon 22px + 9.5px body 700 label, stacked, min-width 52.
Inactive `rgba(251,246,234,0.6)`; active `lime` text on a
`rgba(201,247,58,0.18)` pill.

Centre action: 58px lime circle, 2px ink, `0 4px 0`, pulled **up 16px**
(`margin-top: -16px`) so it breaks the bar's top edge. Contains a 28px display `+`.

### 5.6 Log Match

- **Player chips** wrap in a flex grid, **three per row** at 375px. Height 44,
  padding `8px 14px 8px 8px`, 28px avatar, body 700 14px, `0 2px 0`.
  Assigned to A → `court` fill / cream text. Assigned to B → `coral` fill /
  white text. Unavailable → `opacity 0.38`.
- **Shuffle buttons** (`WHO'S UP?`, `BALANCE`): pill, `lime-soft` fill,
  13px **display uppercase**, `0 2px 0`. Disabled → `opacity 0.45`.
- **Team zones** sit side by side with a vertical `NET` divider between them.
  Each is white fading to its tint at 140%, so the top of the card is still white.
  A flat pastel fill is wrong.
- **Score block**: 72px mono 900 in the team colour, above a stepper.
  Stepper is one unit: `[− 40px][+ 40px][+5 40px][+11 40px]`, 50px tall,
  12px radius, 2px ink, `0 3px 0`. Presets have an ink left-border and a
  `cream-dim` fill. **The two steppers must sit inside the 16px page gutter and
  align with the team zones above them.**
- **Carry slider**: a tug-of-war track. 14px tall, 2px ink, pill radius, with a
  centre tick and a band growing from the centre toward whoever carried.
  Thumb 26px white circle, 2px ink, `0 2px 0`.
- **CTA**: full width, 20px display uppercase, lime, 18px radius, `0 5px 0`,
  16px padding. Disabled → `opacity 0.45`.

### 5.7 History (Rumbles)

White card, 18px radius, `0 3px 0`, padding `12px 14px`, 10px apart.

Top row: date in 11px body 700 uppercase `+0.06em` `ink-soft`, with edit and
delete icon buttons (28×28, 8px radius) pulled into the card padding so they
align with the card edge, not floating inside it.

Body is a three-column grid: `losing side | score | winning side`.
Player lines are 13px body 700 with an 11px **mono** delta. The score box is
26px **display**, `cream` fill, 2px ink, 12px radius, `0 2px 0`; the winning
number is `court`, the losing one is `ink-soft` at 60%.

### 5.8 Stats

- Section heads: 14px display uppercase `+0.05em` `court-deep`, with a 12px
  `info-dot` at 75% opacity that opens an explainer sheet.
- Stat cells: 2-up grid, white, 12px radius, `0 2px 0`, padding `10px 12px`.
  Key 10px body 800 uppercase `+0.08em` `ink-soft`; value 15px body 800.
- **Rating journey**: white chart card with a court-green line **and a
  lime-soft area fill beneath it**, a dashed baseline at the starting rating,
  and a lime end-point dot. Drag-to-scrub shows an ink pill with the rating in
  mono and the delta in lime (up) or coral (down).
- Never ship a placeholder value. If a stat cannot be computed, omit the cell.

### 5.9 Profile

Hero: 72px lime avatar with `0 3px 0`, name 26px display uppercase, meta 13px
body 600, and the rating right-aligned in 30px **mono 800** `court-deep`.

Achievements: 2-column grid, 12px radius, `0 2px 0`.
Earned → `gold` fill, full opacity. Locked → `cream-dim`, `opacity 0.55`, **no
shadow**. Multiplier suffix (`×2`) in coral mono.

### 5.10 Overlays

- **Bottom sheet**: `cream`, 2px ink, no bottom border, `22px 22px 0 0`, slides
  up 0.35s on `cubic-bezier(0.2, 0.9, 0.3, 1)`.
- **Centred modal**: `cream`, 22px radius, `0 5px 0`, pops in 0.35s on
  `cubic-bezier(0.2, 1.2, 0.4, 1)` from `scale(0.7) translateY(30px)`.
- **Result reveal**: dark court scrim, card pops in, rating rows slide in from
  the left staggered ~130ms apart, and a `PICKLED` stamp lands in lime with a
  2.5px ink text-stroke.
- **Toast**: ink pill, cream text, 14px body 700, floats `110px + safe-area`
  above the bottom, auto-dismisses at 2.6s.

---

## 6. Motion

| Purpose | Duration | Curve |
|---|---|---|
| Press feedback | 100–150ms | `ease` |
| Page enter | 350ms | `cubic-bezier(0.2, 0.9, 0.3, 1)`, from `translateY(10px)` + `opacity 0` |
| Sheet up | 350ms | `cubic-bezier(0.2, 0.9, 0.3, 1)` |
| Modal pop | 350–450ms | `cubic-bezier(0.2, 1.4, 0.4, 1)`, overshoots on purpose |
| Ambient loops (crown bob, mascot) | 3–3.4s | `ease-in-out`, infinite |
| Tagline cycle | 5s hold, 500ms fade | `ease` |

Motion either **confirms a press** or **reveals new content**. There is no
decorative hover animation, no sliding arrow, no uniform card lift.

**Reduced motion is honoured everywhere.** Under `prefers-reduced-motion`, all
ambient loops stop, the tagline stops rotating, and durations collapse to
`0.01ms`.

---

## 7. States

Every view ships four states. A view that only handles "loaded with data" is
not finished.

- **Loading**: the bobbing mascot plus a witty line ("Chalking the lines…",
  "Warming up the court…"), then skeletons whose heights match the real content
  (78px for a board row).
- **Empty**: 2px **dashed** `ink-soft` border, translucent white fill, a 44px
  bobbing emoji, an 18px display uppercase title, a 13px body line, and one CTA.
- **Error**: an inline card with the message and a retry action. Never a bare
  error string.
- **Long content**: names truncate with ellipsis (`8.5ch` on the champion,
  single-line on rows). Layout never reflows to accommodate a long name.

---

## 8. Accessibility floor

- Every interactive target is **≥44px**.
- Focus is visible everywhere: `3px solid court`, `2px` offset.
- Colour is never the only signal. Streaks carry an emoji, deltas carry a sign,
  the active tab carries a filled background as well as a colour change.
- Icon-only buttons carry an `aria-label` / `accessibilityLabel`.
- Emoji used decoratively are hidden from assistive tech.

---

## 9. Anti-slop compliance

This design deliberately clears the house 30-rule list
(`~/.claude/rules/anti-slop-design.md`). Keep it that way:

- Background is `#FBF6EA`, not `#fff`. Dark surfaces are `#0C3B2D`, not `#000`.
- No blur, no glassmorphism, no backdrop-filter on content surfaces (scrims only).
- No radial orbs. No dot-grid background, grain only.
- Radius varies by element size; it is not uniformly `rounded-xl`.
- Shadows are hard printed offsets, not default elevation.
- Icons are custom inline SVG. **No Lucide.** No sparkle glyphs.
- Fonts are Lilita One / Bricolage Grotesque / Azeret Mono. **No Inter, Geist, or
  Space Grotesque.**
- No em dashes in UI copy.
- No three-card feature row, no bento grid, no fake terminal, no fake testimonials.
- Legal pages (`/privacy`, `/support`) are real and served by the Worker.

---

## 10. Copy voice

Competitive, dry, a little rude. Never corporate, never encouraging-coach.

- Ranks get honorifics: *The Don of Dink*, *Heir to the Throne*, *Court General*,
  *Net Casualty*, *Wooden Spoon*.
- Matches are **rumbles**. The leaderboard is **standings**. Rating is
  **Royale Rating**.
- Empty states are jokes, not apologies: "The court is silent…".
- Loading lines are in-world: "Chalking the lines…".
- Sentence case for body copy. Uppercase only for display type and small labels.
- No exclamation marks in system copy. The mascot gets one; the app does not.
