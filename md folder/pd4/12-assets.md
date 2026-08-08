# Assets Inventory

## Images / Illustrations
| Asset | Description | Format Recommendation |
|---|---|---|
| React atom logo | Cyan 3-orbit atom mark with center dot, used as video poster branding | SVG (recreate as vector, stroke #22D3EE) |
| User avatar (top nav, excluded scope) | Circular profile photo | Referenced only, not part of this page's deliverable |
| Video canvas background | Dark gradient + radial glow + subtle dotted grid texture | Recreate via CSS gradient (`radial-gradient` + `linear-gradient`) rather than raster image for scalability |

## Icon Set
All icons should be sourced from a single consistent icon library (Lucide, Feather, or Heroicons-outline recommended) to match the thin-stroke aesthetic. Full inventory in `09-icons.md`. No custom/branded icon glyphs required except:
- The "M" markdown file glyph (simple letterform in a rounded tile)
- The React atom logo (brand-specific, described above)

## Fonts
- **Inter** (Google Fonts) — weights required: 400, 500, 600, 700
- Fallback stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

## Chart Assets
- Focus Score line chart: no external asset; render with a charting library (e.g., Recharts/Chart.js) using tokens from `03-design-system.md` (stroke #6D5CE1, 2px width, monotone/smooth interpolation, 4px circular markers)

## Export Checklist for Implementation
- [ ] Inter font loaded (400/500/600/700)
- [ ] Icon library installed matching thin-stroke style
- [ ] Color tokens implemented per `08-colors.md`
- [ ] Radius tokens implemented per `03-design-system.md`
- [ ] Video canvas gradient recreated via CSS (no raster needed)
- [ ] React logo recreated as inline SVG (cyan stroke, 3 orbits + center dot)
- [ ] Chart library configured with brand violet single-series line style
- [ ] All spacing values pulled from 4px base scale (`06-spacing.md`)
- [ ] Responsive breakpoints implemented per `10-responsive.md`
- [ ] Interaction/hover/focus states implemented per `11-interactions.md`
