# DK Techniki — Landing Page Build Spec

> A complete, implementation-ready spec for recreating this exact website — an
> architecture/construction studio landing page with a WebGL particle globe hero
> that transitions into a rotating sphere of project photos. Hand this document to
> a fresh Claude Code (or any dev) instance to rebuild the site from scratch on the
> same **GitHub + Vercel** setup.
>
> Everything below describes the *finished* site (not the original inspiration).
> Follow it top to bottom. Placeholders you must supply are marked **[SUPPLY]**.

---

## 0. What you're building

A single-page, dark-theme marketing site for **DK Techniki**, the architecture &
construction branch of DKG Development. The signature piece is a full-screen hero
with a GPU-rendered particle globe that:

1. **Assembles on load** — ~21,000 dots fly in from beyond the screen edges and
   accumulate into a slowly rotating, tilted sphere.
2. **Reacts to the mouse** — dots near the cursor brighten, grow, and are pulled
   toward it (a "gather" effect); colors continuously drift white ↔ electric blue.
3. **Transitions on scroll** — the centered logo mark "departiculates" (crumbles
   into scattering dots), the globe dissolves into a faint starfield, and a second
   layer fades in: a rotating 3D sphere of circular project-photo badges orbiting a
   centered heading.

Below the hero: alternating feature cards, a design-toolkit card, a trust row, a
partner grid, a final CTA, and a footer with a giant gradient wordmark.

---

## 1. Setup: GitHub + Vercel

### Repository
- One GitHub repo. Develop on a feature branch, fast-forward merge into `main`.
- `main` is the Vercel **production branch** — every push to it triggers a
  production deploy. Pushes to other branches get preview URLs automatically.

### Vercel project
- Import the repo at **vercel.com/new**. Framework preset auto-detects as **Next.js**.
- **Commit `vercel.json` at the repo root** so the preset is pinned regardless of
  dashboard state (this prevents the "No Output Directory named 'public'" error that
  happens if Vercel ever falls back to the "Other" preset):
  ```json
  { "framework": "nextjs" }
  ```
- No environment variables required. Root directory `./`. Leave build settings default.

### Standard git workflow used throughout
```bash
# work on the feature branch, then:
git add -A && git commit -m "..."
git push -u origin <feature-branch>
git checkout main && git merge --ff-only <feature-branch>
git push -u origin main
git checkout <feature-branch>
```

---

## 2. Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript, React 19 |
| Styling | CSS Modules + a global `:root` design-token layer (plain CSS, `sass` available) |
| DOM animation | Framer Motion 11 (`framer-motion`) — entrances, scroll-linked transforms, menus |
| Hero visual | **Raw WebGL** (no library) — particle globe + logo departiculation |
| Project sphere | Plain DOM + `requestAnimationFrame` 3D projection (CSS transforms) |
| Fonts | `next/font/google` **Inter**, weights 300 + 400 only, `--font-display` var |
| Images | Static files in `public/`, pre-resized to square thumbnails |
| Hosting | Vercel |

### package.json
```json
{
  "name": "dktekniki",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "framer-motion": "^11.15.0",
    "next": "^15.1.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "sass": "^1.83.0",
    "typescript": "^5.7.2"
  }
}
```

`next.config.ts`:
```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = { images: { formats: ["image/webp"] } };
export default nextConfig;
```

`tsconfig.json`: standard Next.js App Router config with `"@/*": ["./*"]` path alias,
`"strict": true`, `moduleResolution": "bundler"`, the `next` plugin.

---

## 3. File structure

```
app/
  layout.tsx          # Inter font, <html>/<body>, metadata
  globals.css         # imports tokens + typography, reset, .container/.section/.eyebrow
  page.tsx            # assembles all sections
  page.module.css     # section headings + final CTA
components/
  Header.tsx / .module.css        # sticky hide-on-scroll header, hover mega-menus
  HeroScene.tsx / .module.css     # the scroll-driven hero (globe + projects layer)
  ParticleGlobe.tsx               # WebGL globe (no CSS module; inline canvas style)
  ProjectSphere.tsx / .module.css # rotating 3D badge sphere
  Logo.tsx / .module.css          # inline SVG symbol + wordmark lockup
  Counter.tsx                     # count-up-on-view number
  FadeUp.tsx                      # scroll-into-view fade+rise wrapper
  Button.tsx / .module.css        # pill buttons (primary gradient / ghost)
  FeatureCard.tsx / .module.css   # alternating image/text cards + logo marquee
  ToolsCard.tsx / .module.css     # design-toolkit two-column card
  TrustRow.tsx / .module.css      # 3-column trust section
  InvestorGrid.tsx / .module.css  # 4×3 partner grid (grayscale)
  Footer.tsx / .module.css        # link columns + giant gradient wordmark
styles/
  tokens.css          # :root design tokens
  typography.css      # type scale
public/
  brand/sima.svg      # the logo symbol source [SUPPLY]
  projects/01.jpg..NN.jpg   # square project thumbnails [SUPPLY]
docs/
  BUILD_SPEC.md       # this file
vercel.json
```

---

## 4. Design tokens — `styles/tokens.css`

```css
:root {
  /* Color */
  --bg-primary: #121212;
  --bg-secondary: rgba(255, 255, 255, 0.15);
  --surface-card: #181818;
  --surface-card-alt: #222529;
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.5);
  --text-tertiary: rgba(255, 255, 255, 0.25);
  --text-grey: #9c9d9f;
  --dim: rgba(255, 255, 255, 0.15);
  --extra-dim: rgba(255, 255, 255, 0.05);
  --border-1: #212121;
  --border-2: #424242;

  /* Accent — electric blue */
  --accent: #3d5af1;
  --accent-light: #7e9bff;
  --accent-gradient: linear-gradient(135deg, #7e9bff 0%, #3d5af1 100%);

  /* Spacing (px) */
  --space-xs: 14px;  --space-s: 28px;  --space-m: 47px;
  --space-l: 70px;   --space-xl: 93px; --space-xxl: 233px; /* section rhythm */

  /* Layout */
  --container-max: 1344px;
  --grid-gutter: 37px;
  --page-margin: 75px;
  --header-height: 93px;

  /* Radii & borders */
  --radius-pill: 999px;
  --radius-card: 18.67px;
  --border-hairline: 1px solid rgba(255, 255, 255, 0.15);

  /* Motion */
  --ease-link: color 0.2s ease-out;
  --ease-ghost: background-color 0.4s cubic-bezier(0.36, 0.2, 0.07, 1);
}

@media (max-width: 768px) {
  :root {
    --space-xxl: 140px; --page-margin: 24px;
    --grid-gutter: 20px; --header-height: 72px;
  }
}
```

### Typography — `styles/typography.css`
Font-family `var(--font-display)` (Inter), weights 300 & 400, letter-spacing normal,
line-heights: headings ~1.1–1.2, body 1.6.

```css
:root {
  --fs-mega: clamp(120px, 28vw, 490px);   /* footer wordmark */
  --fs-display: clamp(42px, 5vw, 70px);    /* big CTA H2 */
  --fs-h1: clamp(26px, 2.6vw, 37px);       /* section/hero titles */
  --fs-card-title: 23px;
  --fs-body: 18.7px;
  --fs-caption: 16.3px;
  --fs-code: 15.2px;
  --fs-footer-head: 11.7px;
  --lh-tight: 1.1; --lh-heading: 1.2; --lh-body: 1.6;
  --fw-light: 300; --fw-regular: 400;
  --font-mono: ui-monospace, Menlo, Consolas, monospace;
}
/* body: font-family var(--font-display), size --fs-body, weight 400, lh 1.6.
   h1,h2,h3: weight 300. At ≤768px shrink --fs-card-title:20, --fs-body:16.5,
   --fs-caption:14.5 */
```

### globals.css essentials
- Box-sizing reset, margin/padding 0, remove list styles, `a { color: inherit }`.
- `body { background: var(--bg-primary); overflow-x: hidden; }`
- `:focus-visible { outline: 2px solid var(--accent-light); outline-offset: 3px; }`
- `.container { max-width: calc(var(--container-max) + 2*var(--page-margin)); margin:0 auto; padding: 0 var(--page-margin); }`
- `.section { padding-top: var(--space-xxl); }`
- `.eyebrow { font-size: var(--fs-caption); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: var(--space-s); }`
- **`@media (prefers-reduced-motion: reduce)`**: kill smooth-scroll and clamp all
  animation/transition durations to ~0.

---

## 5. The WebGL particle globe — `components/ParticleGlobe.tsx`

The centerpiece. A `"use client"` component that takes a Framer Motion
`progress: MotionValue<number>` (the hero's scroll progress, 0→1) and renders a
`<canvas>` filling its parent. **All per-particle math runs in the vertex shader**,
so a 21k-dot globe costs ~10 uniform uploads per frame on the CPU — this is what
makes it smooth on large/high-DPI screens (a canvas-2D version was too slow).

### Tunable constants (top of file)
```ts
const MAX_PARTICLES = 21000;      // desktop cap; scales down on small viewports
const ROTATION_SPEED = 0.0038;    // radians/frame around Y
const AXIS_TILT = -0.28;          // radians, tips the globe like a planet
const RADIUS_FACTOR = 0.26;       // sphere radius as fraction of min(w,h)
const CENTER_Y_FACTOR = 0.61;     // vertical center (0.5=middle); sits below hero copy
const POINTER_RADIUS = 210;       // cursor spotlight radius (css px)
const POINTER_EASE = 0.12;        // how fast the spotlight follows the cursor
const GATHER_STRENGTH = 0.7;      // 0 = no pull, 1 = dots snap onto cursor
const INTRO_DURATION = 2600;      // ms for the fly-in accumulation
const STARFIELD_FLOOR = 0.14;     // residual dot opacity after dissolve
const LOGO_DISSOLVE_START = 0.4;  // scroll progress where logo starts crumbling
const LOGO_DISSOLVE_END = 0.66;   // ...and finishes scattering
const LOGO_MARK_SIZE = 72;        // px; MUST match <LogoMark size> in HeroScene
```

### Behavior details
- **Density scaling**: `count = min(MAX_PARTICLES, max(3600, floor(area/63)))` where
  `area = clientWidth*clientHeight`. Phones draw far fewer dots.
- **Particle data** (built once into Float32 buffers): fibonacci-sphere positions
  with a jittered shell (`0.94 + rand*0.08`); per-dot size `0.5 + rand*rand*1.9`;
  color-ramp phase & speed; a scatter vector (random direction beyond screen edge +
  stagger delay) for the intro.
- **Vertex shader** per dot: rotate around Y by `u_rotation`, tilt by `AXIS_TILT`,
  perspective-project (`perspective=3`), place at `u_center + xy*u_radius*scale`.
  - **Lighting**: Lambert-ish `dot(pos, LIGHT)` with `LIGHT = (0.5,-0.65,0.57)` →
    a bright highlight band top-right-front.
  - **Color**: each dot continuously `sin`-drifts along white → electric-blue
    (`#3D7AFF`); spotlight pulls toward white.
  - **Intro**: blend from scatter point to sphere point via a staggered,
    smoothstepped `u_intro` (0→1 over `INTRO_DURATION`); dots glow up as they land.
  - **Cursor spotlight**: within `POINTER_RADIUS`, squared falloff → `boost` that
    (a) brightens & enlarges the dot and (b) adds `toPointer * falloff² * GATHER *
    react` to its position (front dots react more). Pointer position is eased on the
    JS side (`POINTER_EASE`) and passed as a uniform; **mouse pointers only** (ignore
    touch); disabled under reduced motion.
- **Fragment shader**: soft round glow (`smoothstep` on distance from point center,
  discard outside radius). Additive-ish look via `blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA)`.
- **Scroll zoom + dissolve**: `radius = baseRadius*(1 + p*3.2)`;
  `fade = max(1 - max(0,(p-0.55)/0.45), STARFIELD_FLOOR)` — so after the globe
  zooms past, a faint starfield residue remains behind the projects layer.
- **DPR** capped at 2. Uses `IntersectionObserver` to pause the rAF loop off-screen.
  On unmount: cancel rAF, disconnect observer, `WEBGL_lose_context`.
- **No-WebGL fallback**: if `getContext('webgl')` fails, return silently — the globe
  is decorative, the page still works.

### Logo departiculation (second WebGL program in the same file)
A tiny second shader program renders the logo mark as a **point cloud sampled from
the sima.svg polygons**:
- Hardcode the 7 polygons of the symbol (white "left faces" + grey `#B3B3B3` "right
  faces") as point lists. Sample points inside them (point-in-polygon test on a jittered
  grid, ~0.62 step) into css-px offsets from the mark center, scaled to `LOGO_MARK_SIZE`.
- Each sampled point gets a random burst direction + stagger delay.
- Uniform `u_dissolve = (p - LOGO_DISSOLVE_START)/(LOGO_DISSOLVE_END - LOGO_DISSOLVE_START)`.
  Shader eases each point from its position outward (`* 420px`) and fades it as it
  scatters. Only drawn while `0 < dissolve < 1`.
- The solid DOM logo mark (in HeroScene) fades out over `[0.36, 0.44]` scroll progress,
  handing off to this crumble exactly as it disappears.

**Two-program gotcha**: WebGL attribute buffers are per-program. Keep a helper that
re-binds the correct attributes and disables leftover attrib slots each time you
`useProgram` switch between the globe program and the logo program within a frame.

---

## 6. The hero scene — `components/HeroScene.tsx` + `.module.css`

A `"use client"` component that owns the scroll choreography.

- **Structure**: a `.scene` wrapper `height: 260vh` containing a `.stage` that is
  `position: sticky; top: 0; height: 100vh; height: 100dvh;` (the `100dvh` is
  **critical** — see §12 gotcha). `overflow: hidden`.
- `useScroll({ target: sceneRef, offset: ["start start", "end end"] })` →
  `scrollYProgress`. Pass it to `<ParticleGlobe progress={scrollYProgress} />`.
- **Layers inside the stage** (all absolutely positioned):
  1. `<ParticleGlobe>` canvas (full-bleed).
  2. **Center mark**: `<LogoMark size={72} />` positioned at `left:50%; top:61%`
     (matches `CENTER_Y_FACTOR`), `translate(-50%,-50%)`. Opacity driven by
     `useTransform(scrollYProgress, [0.36, 0.44], [1, 0])`.
  3. **Hero copy overlay** (`justify-content: flex-start`, padded down from the top):
     H1 "Engineering Infrastructure" (`clamp(32px,3.6vw,52px)`), subtitle, and a
     bottom stats row. Opacity/`y` fade out over `[0, 0.35]`.
  4. **Projects constellation** (`<ProjectSphere/>` + centered H2), opacity fades in
     over `[0.5, 0.75]`.
- **Stats row** (`.stats`, absolute bottom): a left group of two `.stat` blocks (label
  above value) using `<Counter>`, and a right-aligned "Scroll to explore ↓" cue.
  - Stat 1: `<Counter target={122000} />` — "Total SQM Built"
  - Stat 2: `<Counter target={1000} suffix="+" />` — "Apartments Designed"
  - Stat labels are `rgba(255,255,255,0.78)` (brightened for contrast over the globe).
- Everything scroll-linked is gated behind `useReducedMotion()`.

---

## 7. The project sphere — `components/ProjectSphere.tsx` + `.module.css`

A rotating 3D sphere of circular project-photo badges orbiting the heading. Plain
DOM (no WebGL) — one `<div class="badge">` per project, positioned each frame via
`transform: translate3d(x, y, 0) scale(...)`.

```ts
const COUNT = 26;               // = number of project images you have [SUPPLY count]
const ROTATION_SPEED = 0.0022;  // radians/frame around Y
```
- **Point distribution**: fibonacci sphere, but push the equator band apart so badges
  orbit *around* the heading instead of crossing it:
  `y_spread = sign(y) * (0.3 + 0.7*abs(y))`.
- **Per frame**: rotate each point around Y, compute `depth = (z+1)/2` (0 back→1 front),
  `scale = 0.45 + 0.55*depth`, `opacity = 0.25 + 0.75*depth`, `zIndex = round(depth*10)`.
  Screen offsets use `rx = clientWidth*0.44`, `ry = clientHeight*0.42`.
- **Badge CSS**: circle `width/height` **87px desktop, 59px mobile** (`border-radius:50%`,
  `overflow:hidden`, `object-fit:cover`, 1px `--border-2` border, `--surface-card-alt`
  background). Center via negative margins = half the size.
- **Image loading**: each badge loads `/projects/NN.jpg` (`01`..COUNT, zero-padded).
  Show project **initials** until the image loads; on error, keep initials. **Two
  loading gotchas to handle**: (1) don't `loading="lazy"` a `display:none` image (it
  never loads) — render it hidden via style, not lazy; (2) an image may `complete`
  before hydration attaches `onLoad`, so on mount check `img.complete &&
  naturalWidth>0` and set loaded state manually.
- The heading H2 sits at `z-index: 20` so it stays above badges orbiting past.
- `IntersectionObserver` pauses the rAF loop when off-screen; disabled under reduced motion.

---

## 8. Supporting components

### Header — `components/Header.tsx`
- Sticky, `position: fixed`, `height: var(--header-height)`, `--bg-primary`,
  bottom hairline border. Layout: `[Logo] ........ [nav] `.
- **Hide-on-scroll**: Framer `useScroll` + `useMotionValueEvent` on `scrollY`; if
  scrolling down past 150px, animate header `y: -100%`; on scroll up, `y: 0`
  (duration 0.3, easeInOut). Close any open menu when hiding.
- **Mega-menus** (hover to open, desktop): three menus. Panel unfolds `scaleY: 0→1`
  (transform-origin top), items fade+slide `y:-12→0` with ~40ms stagger; chevron
  rotates 180° when open; duration ~0.25s. Nav links `--text-secondary` → `#fff` on
  hover (`transition: var(--ease-link)`). Nav hidden below 900px.
- **Menu content** (architecture studio):
  - **Services**: Architectural design / Construction / Renovation
  - **Projects**: Residential / Commercial / All projects
  - **Company**: About us / Our process / Contact
  - Plus a plain "Team" link. (No "Launch App" button — this is not an app.)

### Logo — `components/Logo.tsx`
- `<LogoMark size>` = inline SVG of the sima symbol (viewBox cropped to the mark,
  `27.2 26.9 49.9 54.5`; 7 polygons, white `#FFFFFF` + grey `#B3B3B3` faces — the
  two-tone isometric "stacked layers" mark). **[SUPPLY: replace with your own SVG's
  polygon coordinates; the real file lives at `public/brand/sima.svg`.]**
- `<Logo size tagline>` = mark + wordmark lockup: "DK TECHNIKI" (letter-spacing
  0.18em, uppercase) with optional "BUILDING INNOVATION" tagline line (letter-spacing
  0.42em, `--text-secondary`, ~9.5px). Header uses `size={30}`; footer `size={40} tagline`.

### Button — `components/Button.tsx`
- Pill, `height: 51px`, `padding: 0 28px`, `border-radius: var(--radius-pill)`.
- **primary**: `--accent-gradient` fill, `background-size:200%`, hover shifts
  `background-position` (shimmer). **ghost**: `rgba(255,255,255,0.15)` fill, hover
  lightens via `--ease-ghost`. Optional trailing `↗`/`→` arrow. `small` variant.

### Counter — `components/Counter.tsx`
- Counts up to `target` (with optional prefix/suffix) when scrolled into view.
  `useInView(ref, { once: true })` — **no negative margin** (see §12 gotcha).
  Cubic ease-out over ~1.8s via rAF. Respects reduced motion (jumps to final).

### FadeUp — `components/FadeUp.tsx`
- Wrapper: `initial {opacity:0, y:24}` → `whileInView {opacity:1, y:0}`,
  `viewport {once:true, margin:"-80px"}`, duration 0.5 easeOut, optional `delay`.
  Reduced motion → opacity only.

### FeatureCard — `components/FeatureCard.tsx`
- Surface `--surface-card`, `--radius-card`, two-column grid
  **`minmax(0,1fr) minmax(0,1fr)`** (the `minmax(0,...)` is required or the marquee
  collapses the image column to 0 — see §12). Alternate image left/right per card
  (`reversed` prop). Image side = abstract inline SVG on an accent radial-glow
  background. Content side: title / grey body / a horizontal **logo marquee**
  (project-name pills, CSS `@keyframes` translateX, pause on hover, `mask-image` edge
  fade) / "Read more ↗" ghost button. Entrance via `<FadeUp>`.

### ToolsCard — `components/ToolsCard.tsx`
- Dark card, header row `[Design toolkit] [Concept → Construction]`, then a
  two-column list of design tools (name + one-line use). **[SUPPLY: real software stack.]**

### TrustRow — `components/TrustRow.tsx`
- 3 columns separated by vertical hairlines (`border-left`), collapse to stacked on
  mobile. Each: title / grey body / chip row / "Read More →". **[SUPPLY: real
  certifications/claims — verify before launch.]**

### InvestorGrid (partner grid) — `components/InvestorGrid.tsx`
- 4×3 grid, thin `--border-1` dividers, grayscale placeholder logos (dot + name),
  last cell "View More →". 2 columns on mobile. **[SUPPLY: real partner names.]**

### Footer — `components/Footer.tsx`
- Left: `<Logo size={40} tagline/>`. Right: 4 link columns (Services / Projects /
  Company / Legal). Below: a **giant gradient-masked wordmark** "DK TECHNIKI" —
  `--fs-mega`, uppercase, `linear-gradient(rgba(255,255,255,.15) 5%,
  rgba(255,255,255,0) 70%)` clipped to text, opacity ~.39, bleeding off both edges
  (`margin: 0 calc(-1 * var(--page-margin))`).

---

## 9. Page assembly — `app/page.tsx`

Order, top to bottom:
1. `<Header/>`
2. `<main>`:
   - `<HeroScene/>` (globe → projects transition; sections 1–2)
   - **Features** (`#features`): eyebrow "What we do", H2 "Spaces designed around the
     people who use them", then 3 alternating `<FeatureCard>` (Residential / Commercial
     & mixed-use / Construction) with project names in the marquees.
   - **How we design** (`#open`): eyebrow "How we design", H2 "Architecture crafted
     with precision, from concept to construction", `<ToolsCard/>`.
   - **Trust** (`#trust`): eyebrow "Why DK Techniki", H2 "Trusted where it matters
     most", `<TrustRow/>`.
   - **Partners** (`#investors`): eyebrow "Our network", H2 "Delivered with trusted
     partners across the industry", `<InvestorGrid/>`.
   - **Final CTA** (`#cta`): H2 `--fs-display` "Let's design your next project
     together" + primary `<Button arrow="→">Contact us</Button>`, centered.
3. `<Footer/>`

`app/layout.tsx`: Inter via `next/font/google` (weights 300/400, `variable:
"--font-display"`), `<html lang="en" className={inter.variable}>`, metadata title
"DK Techniki — Building Innovation" + description.

---

## 10. Assets you must supply

1. **Logo symbol** → `public/brand/sima.svg`. Inline its polygons into `Logo.tsx`
   (`LogoMark`) and, for the departiculation, into `LOGO_POLYGONS` in `ParticleGlobe.tsx`.
   Crop the viewBox to just the symbol. If the SVG also contains wordmark paths outside
   the artboard, ignore them (the wordmark is rendered as styled Inter text).
2. **Project photos** → `public/projects/01.jpg` … `NN.jpg`. Pre-process each to a
   **square center-cropped thumbnail** (e.g. 240×240) to keep the sphere light —
   a fast ffmpeg one-liner:
   ```bash
   i=0; for f in raw/*; do i=$((i+1)); n=$(printf "%02d" $i); \
     ffmpeg -y -i "$f" -vf \
     "scale='if(gt(a,1),-1,240)':'if(gt(a,1),240,-1)',crop=240:240" \
     -q:v 4 "public/projects/$n.jpg"; done
   ```
   Then set `COUNT` in `ProjectSphere.tsx` to the number of images. Keep originals
   archived elsewhere in the repo (e.g. `assets/`) if you want larger versions later.

---

## 11. Motion system summary
- Restrained, smooth, no bounce. Fades + short slides. No hover scale-ups, no shadows.
- Entrance: fade-up (`y:24→0`, opacity 0→1, ~0.5s ease-out) on scroll-into-view.
- Reusable transitions: links `color 0.2s ease-out`; ghost buttons
  `background-color 0.4s cubic-bezier(0.36,0.2,0.07,1)`.
- Scroll-linked: header hide/show; hero globe intro/zoom/dissolve; logo crumble;
  projects fade-in; count-up stats.
- **Everything scroll/loop-based must respect `prefers-reduced-motion`.**

---

## 12. Known gotchas & fixes (learned the hard way — don't repeat these)

1. **Vercel "No Output Directory 'public'"** → commit `vercel.json` with
   `{"framework":"nextjs"}`. Happens when the project was created with the "Other" preset.
2. **FeatureCard image column collapses to 0** → grid must be
   `minmax(0,1fr) minmax(0,1fr)` and the content column needs `min-width:0`; the
   `max-content` marquee track otherwise blows out the track sizing.
3. **Hero counters stuck at 0 on mobile** → the sticky stage was `100vh`, which
   includes the space behind the mobile URL bar, pushing the bottom stats row
   off-screen so the count-up trigger never fired. Fix: `height: 100dvh` on the stage
   **and** remove the negative `margin` from `Counter`'s `useInView`.
4. **Project badges never show images** → (a) don't `loading="lazy"` a hidden image;
   (b) check `img.complete` on mount because the load may finish before React attaches
   `onLoad` (hydration race).
5. **Canvas-2D globe too slow on big screens** → must be WebGL; do the per-particle
   math in the vertex shader, not JS.
6. **Two WebGL programs share attribute slots** → re-bind attributes and disable
   leftover attrib arrays whenever you switch `useProgram` mid-frame.
7. Keep `LOGO_MARK_SIZE` (ParticleGlobe) == `<LogoMark size>` (HeroScene) and the
   center `top: 61%` == `CENTER_Y_FACTOR` so the crumble lines up with the solid mark.

---

## 13. Build order (suggested)
1. Scaffold Next.js + TS + tokens + typography + layout container. Commit `vercel.json`.
2. Header + Logo + Button + mega-menus.
3. Static section shells with placeholder content (features, tools, trust, partners, CTA, footer).
4. `FadeUp` scroll entrances + `Counter`.
5. `HeroScene` shell with the sticky 260vh/`100dvh` stage and scroll progress.
6. `ParticleGlobe`: static sphere → rotation/tilt/lighting → color drift → intro
   fly-in → cursor spotlight/gather → scroll zoom + starfield residue → logo departiculation.
7. `ProjectSphere` with initials, then wire real images.
8. Reduced-motion pass, mobile pass (watch the `100dvh` + counter gotcha), Lighthouse.
9. Import to Vercel, push `main`, verify production.

---

## 14. Brand/content quick reference (this site's copy — change per client)
- Name: **DK Techniki** (wordmark "DK TECHNIKI", tagline "Building Innovation")
- Parent: **DKG Development**
- Hero H1: "Engineering Infrastructure"
- Hero subtitle: "Designing, engineering and delivering exceptional buildings, from
  first sketch to final build."
- Projects heading: "Driven by experts creating the next generation of architectural spaces."
- Stats: 122,000 Total SQM Built · 1,000+ Apartments Designed
- Accent: electric blue `#3D5AF1 → #7E9BFF`; background `#121212`; Inter font.
