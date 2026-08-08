# Layout Specification

## Viewport Reference
- Design reference viewport: **1536px × 1024px** (desktop)
- Left sidebar (excluded, existing): **0–250px** from left, full height
- Top navigation bar (excluded, existing): **0–64px** from top, full width
- Content area begins at: **x = 250px, y = 64px**
- Right panel begins at: **x ≈ 1176px**
- Right panel width: **≈ 360px** (1176px–1536px, with 16px outer gutters)

## Overall Grid (content area, excluding chrome)

| Zone | X Start | X End | Width | Notes |
|---|---|---|---|---|
| Main content column | 250px | 1160px | ≈ 910px | padding 32px left/right applied inside |
| Gutter between main and right panel | 1160px | 1176px | 16px | |
| Right panel column | 1176px | 1536px | ≈ 360px | fixed-width sidebar card stack |

## Main Content Column — Vertical Rhythm

| Element | Y Start (approx, from top of content area) | Height (approx) |
|---|---|---|
| Header row (title/breadcrumb + actions) | 24px | 56px |
| Video Player Card | 96px | 460px |
| Tab Bar | 572px | 44px |
| Tab Panel Content (Overview cards) | 632px | 195px |
| Resources Section | 850px | 165px |

Section-to-section vertical gap: **24px**
Page outer padding: **32px** top, **32px** left/right, **32px** bottom

## Video Player Card
- Position: full width of main column (≈ 878px inner width after 32px page padding)
- Height: **≈ 380px** for the video canvas + **≈ 80px** for the control bar beneath = **≈ 460px** total including scrub bar
- Border radius: **16px** (canvas), control bar sits directly below with no radius break (single rounded card containing both, radius clipped only at outer corners: **16px** all corners)
- Video canvas background: dark gradient (near-black to deep indigo/purple), radial light glow center-right
- Overlay elements positioned absolutely within the canvas (see 05-sections.md)

## Tabs Row
- Height: 44px
- Horizontal list, left-aligned, 32px gap between tab labels
- Active tab indicator: 2px solid underline in brand violet, positioned directly under active label text with ~4px offset
- Bottom border of entire tab row: 1px solid divider color, spans full width of main column

## Overview Tab Panel (2-column layout)
- Grid: 2 columns
  - Column A ("About this video"): **≈ 480px** wide
  - Column B (metadata list): **≈ 380px** wide
- Column gap: **24px**
- Both columns equal height, top-aligned, white rounded cards, 16px radius

## Resources Section
- Section header ("Resources in this session"): 24px height, margin-bottom 16px
- Card row: horizontal flex, 4 resource cards + 1 "Add More" card
- Each card width: **≈ 170px**, height: **≈ 140px**
- Gap between cards: **16px**
- Row is left-aligned, does not stretch to fill remaining width (cards are intrinsic width, extra space at right)

## Right Panel — Vertical Stack
- Fixed-width column, cards stacked vertically
- Card widths: **100%** of panel column (≈ 360px, with the panel itself having ~16-24px internal side padding, so cards render ≈ 328–336px wide)
- Gap between stacked cards: **16px**
- Card order top→bottom:
  1. Choose Video to Play — height ≈ 130px
  2. Study Timer — height ≈ 190px
  3. Session Details — height ≈ 210px
  4. Total Study Hours Today — height ≈ 80px
  5. Today's Goal — height ≈ 90px
  6. Focus Score — height ≈ 190px
  7. Session Activity — height ≈ 200px

## Responsive Grid Notes
See `10-responsive.md` for breakpoint behavior. At desktop (≥1440px) the layout is exactly as described above with main content + fixed right panel side-by-side. Below 1024px the right panel stacks below main content, full width.
