# Spacing System

## Base Unit
`4px` base grid. All spacing values are multiples of 4.

## Global Page Spacing (content area)
- Outer page padding: `32px` top, `32px` bottom, `32px` left, `32px` right (main column); right panel has its own `32px` top/right/bottom padding and `16-24px` left gutter from main column
- Main-column-to-right-panel gutter: `16px`
- Vertical gap between major page sections (header → video → tabs → panel → resources): `24px`

## Card Internal Spacing
- Standard card padding: `20-24px` all sides
- Card-to-card vertical gap (right panel stack): `16px`
- Card-to-card horizontal gap (resource row): `16px`
- Card-to-card horizontal gap (overview two-column panel): `24px`

## Component-Level Spacing
| Component | Spacing |
|---|---|
| Icon-to-label gap (buttons, metadata rows) | 8px |
| Tag chip row gap | 8px |
| Tab item gap | 32px |
| Metadata row vertical gap | 12–14px |
| Activity log row vertical gap | 6px (padding), rows touching (no divider) |
| Control bar icon gap (video player) | 16px |
| Header title-to-breadcrumb gap | 4px |
| Section title-to-content margin-bottom | 12–16px |
| Button internal padding | 10px 16px |
| Chip internal padding | 6px 14px |
| Resource card internal padding | 16px |
| Video canvas overlay inset (from edges) | 20px |

## Grid Gaps Summary Table
| Context | Gap |
|---|---|
| Main content ↔ Right panel | 16px |
| Overview card columns | 24px |
| Resource cards | 16px |
| Right panel card stack | 16px |
| Focus score chart data points | evenly distributed, ≈ (plot width / 4) between ticks |
