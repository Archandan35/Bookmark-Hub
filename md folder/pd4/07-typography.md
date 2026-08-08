# Typography Specification

## Font Family
Primary: `Inter, "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
(Geometric grotesque sans-serif used exclusively across the entire page — no secondary/serif family present.)

## Full Type Scale

| Style Name | Size | Weight | Line Height | Letter Spacing | Transform | Used For |
|---|---|---|---|---|---|---|
| Display/Video Wordmark | 40px | 700 | 48px | -0.5px | none | "React Hooks / Deep Dive" on video canvas |
| H1/Page Title | 26px | 700 | 32px | -0.3px | none | "React Hooks Deep Dive" |
| Stat/XL | 30px | 700 | 36px | 0 | tabular-nums | Study Timer value |
| Stat/L | 20px | 700 | 26px | 0 | tabular-nums | "3h 45m" |
| Stat/M | 18px | 700 | 24px | 0 | tabular-nums | "85" focus score |
| H2/Card Title | 15–16px | 600 | 20–22px | 0 | none | Card headers ("Study Timer", "About this video", etc.) |
| Body/Tab Active | 15px | 600 | 20px | 0 | none | Active tab label |
| Body/Tab Inactive | 15px | 500 | 20px | 0 | none | Inactive tab labels |
| Body/Regular | 14px | 400 | 22px | 0 | none | Description paragraph |
| Body/Semibold | 14px | 600 | 20px | 0 | none | Metadata values, resource titles, buttons |
| Small/Label | 13px | 500 | 18px | 0 | none | Card sub-headers, delta labels |
| Small/Regular | 13px | 400 | 18px | 0 | none | Metadata labels, activity log labels |
| Caption | 12px | 400–500 | 16px | 0.1px | none | Helper text, meta lines ("Video · 856 MB"), chart axis labels (11px) |
| Micro/Chart Axis | 11px | 400 | 14px | 0 | none | Focus score chart axis ticks |
| Breadcrumb | 14px | 500 | 20px | 0 | none | Breadcrumb trail |
| Button Label | 14px | 600 | 20px | 0 | none | All button text |
| Chip Label | 13px | 500 | 16px | 0 | none | Tag chips |

## Numeric Formatting
- All timers, durations, and counters use **tabular figures** (fixed-width numerals) to prevent layout shift: `01:24:36`, `15:32 / 1:22:45`, `85/100`.

## Text Color Application
- Headings / primary values: `#111827`
- Body copy: `#4B5563`
- Secondary labels: `#6B7280`
- Tertiary/placeholder/meta: `#9CA3AF`
- Brand-colored text (links, active states, button text on R1): `#6D5CE1`
- Success text: `#16A34A`
- Danger text: `#DC2626` / white-on-red for filled buttons
- White text (on dark video canvas/control bar): `#FFFFFF` and `rgba(255,255,255,0.6)` for secondary
