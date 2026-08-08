# Responsive Behavior

Reference design is desktop-first (1536px capture). The following breakpoint behavior should be implemented for the page content area (excluding the already-existing top nav / left sidebar chrome).

## Desktop — 1920px
- Main content column and Right Panel remain side-by-side.
- Main content column max-width caps at ≈960–1000px and centers/left-aligns within available space (does not stretch full-bleed); extra width becomes additional page padding.
- Right panel remains fixed at ≈360–380px.
- Resource card row: still left-aligned, intrinsic widths; may show more breathing room to the right.

## Laptop — 1440px (primary reference minus sidebar chrome ≈1190px available)
- Layout matches the captured design almost exactly (this is the closest reference size).
- Main content ≈ 820–880px, Right panel ≈ 340–360px, gutter 16–24px.
- Video player card scales fluidly with column width; aspect ratio maintained ≈ 16:7 (canvas) plus fixed 64px control bar.

## Tablet — 1024px
- Two-column layout (main + right panel) collapses to a **single column**.
- Right Panel content stacks **below** the main content, full width of the available column.
- Right panel cards switch from single stacked column to a **2-column card grid** (e.g., Choose Video / Study Timer side by side) where card content allows, to reduce total scroll length — OR remain single column if simplicity is prioritized (either is acceptable; single column is the safer literal reproduction).
- Overview tab panel: "About this video" and Metadata card may remain 2-column if width ≥ 700px, else stack.
- Resource card row: becomes horizontally scrollable OR wraps to 2 rows of cards.
- Tab bar: remains horizontal; if labels overflow, becomes horizontally scrollable with hidden scrollbar.

## Mobile — 768px and below
- Single column, full-width stacking for everything.
- Header row: title and breadcrumb stack above action buttons (Add Bookmark + overflow become full-width or right-aligned small row).
- Video player: full width, canvas height scales to maintain aspect ratio (~56% of width), wordmark text scales down (e.g., 40px → 24px), logo scales down proportionally.
- Control bar: icons remain same size (20px) but may reduce horizontal gaps (16px → 8–12px); speed badge and CC may collapse into an overflow "more" icon on very narrow widths (<400px).
- Tabs: horizontally scrollable single row, no wrapping.
- Overview panel: single column, "About this video" card first, Metadata card second, full width each.
- Resource cards: 2-per-row grid or horizontal scroll snap carousel.
- Right panel cards: full width, stacked in original order, unchanged internal layout except font-size reduction is NOT applied (keep readable sizes; only container width changes).
- Focus Score chart: reduce chart height slightly (~80px) and axis label count (e.g., only show 9 AM / 12 PM / 1 PM) to avoid crowding.

## General Responsive Rules
- All border-radius, color, and typography tokens remain constant across breakpoints — only spacing, column counts, and container widths adapt.
- Buttons remain fixed height (40px) at all breakpoints; only width behavior changes (fixed → full-width on mobile).
- Minimum tap target size maintained at 36×36px for all icon-only controls, even as visual icon size stays constant.
