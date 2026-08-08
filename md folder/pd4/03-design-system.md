# Design System Tokens

## Color Tokens

| Token | HEX | Usage |
|---|---|---|
| `color/brand/primary` | #6D5CE1 | Active tab underline, links, primary buttons, chart line, focus ring |
| `color/brand/primary-hover` | #5B4BD1 | Button hover state |
| `color/brand/primary-tint-bg` | #F1EFFD | Selected tag chip background, active nav item bg |
| `color/accent/cyan` | #2563EB | "M" markdown file icon background, info accents |
| `color/success/text` | #16A34A | Positive change labels ("18% vs yesterday"), success badges |
| `color/success/bg` | #ECFDF3 | Success badge background |
| `color/danger/text` | #DC2626 | "Stop Session" button text/icon, PDF icon bg |
| `color/danger/bg` | #FEF2F2 | Stop Session button background (subtle) |
| `color/surface/page-bg` | #F7F7FB | Overall page background |
| `color/surface/card` | #FFFFFF | All card backgrounds |
| `color/surface/track` | #E5E7EB | Progress bar track / scrub bar track |
| `color/border/default` | #E5E7EB | Card borders, dividers, tab row bottom border |
| `color/border/subtle` | #F0F0F5 | Inner dividers between list rows |
| `color/text/primary` | #111827 | Headings, primary values |
| `color/text/secondary` | #6B7280 | Labels, meta text, breadcrumbs (inactive) |
| `color/text/tertiary` | #9CA3AF | Placeholder-level text, timestamps |
| `color/icon/default` | #6B7280 | Standard line icon color |
| `color/icon/brand` | #6D5CE1 | Icon accents matching brand |
| `color/video/canvas-start` | #0B0A18 | Video canvas gradient start (near black) |
| `color/video/canvas-end` | #2B1F6B | Video canvas gradient end (deep indigo/purple) |
| `color/video/logo-cyan` | #22D3EE | React atom logo stroke color |

## Elevation / Shadow Tokens

| Token | Value |
|---|---|
| `shadow/card-sm` | `0px 1px 2px rgba(16,24,40,0.04)` |
| `shadow/card-md` | `0px 4px 12px rgba(16,24,40,0.06)` |
| `shadow/video-card` | `0px 8px 24px rgba(17,10,60,0.12)` |
| `shadow/dropdown` | `0px 8px 16px rgba(0,0,0,0.08)` |

## Radius Tokens

| Token | Value | Usage |
|---|---|---|
| `radius/xl` | 20px | (reserved for larger surfaces) |
| `radius/lg` | 16px | Cards, video player card, resource cards |
| `radius/md` | 10px | Buttons, inputs, resource icon tiles |
| `radius/sm` | 8px | Small icon buttons (control bar icons) |
| `radius/pill` | 999px | Badges, progress bars, chips, avatar |

## Spacing Scale (base unit 4px)

`4, 8, 12, 16, 20, 24, 32, 40, 48`

## Typography Tokens

- Font family: **Inter, "SF Pro Display", -apple-system, sans-serif** (geometric grotesque sans throughout)
- Type scale:

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `text/h1` | 28px | 700 | 36px | Page title "React Hooks Deep Dive" |
| `text/h2` | 16px | 600 | 22px | Card section headers ("Choose Video to Play", "About this video") |
| `text/body-lg` | 15px | 500 | 22px | Tab labels |
| `text/body` | 14px | 400 | 20px | Description paragraph, list values |
| `text/body-sm` | 13px | 500 | 18px | Meta labels, breadcrumb |
| `text/caption` | 12px | 500 | 16px | Timestamps, small captions |
| `text/stat-lg` | 24px | 700 | 30px | Timer value "01:24:36", Focus score "85" |
| `text/stat-md` | 20px | 700 | 26px | "3h 45m" total hours |

## Component Base Styles

- **Card**: `background: #FFFFFF; border: 1px solid #EDEDF2; border-radius: 16px; box-shadow: shadow/card-md; padding: 20px 24px;`
- **Primary Button (outline)**: `border: 1px solid #E5E7EB; background: #FFFFFF; border-radius: 10px; padding: 10px 16px; font-weight: 600; font-size: 14px; color: #111827;`
- **Danger Button (filled-subtle)**: `background: #DC2626; color: #FFFFFF; border-radius: 10px; padding: 10px 16px; font-weight: 600;` (Stop Session button appears solid red)
- **Tag Chip**: `background: #F1EFFD; color: #6D5CE1; border-radius: 999px; padding: 6px 14px; font-size: 13px; font-weight: 500;`
- **Badge (icon+text, e.g., type icon on resource card)**: square tile `40px × 40px`, `border-radius: 10px`
