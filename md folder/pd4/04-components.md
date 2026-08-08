# Component Inventory

Reusable atomic/molecular components identified on this page.

## 1. Button — Outline
- Used for: "Add Bookmark", "Choose Video File", "Pause"
- Height: 40px
- Padding: 10px 16px
- Border: 1px solid #E5E7EB
- Border radius: 10px
- Background: #FFFFFF
- Icon (optional, left): 16px, gap 8px to label
- Font: 14px / 600 / #111827

## 2. Button — Filled Danger
- Used for: "Stop Session"
- Height: 40px
- Padding: 10px 16px
- Background: #DC2626
- Border radius: 10px
- Icon: 16px white square-stop icon, gap 8px
- Font: 14px / 600 / #FFFFFF

## 3. Button — Icon Only (ghost)
- Used for: overflow "...", PiP icon, Info icon on video, control bar icons
- Size: 32–36px square touch target
- Icon size: 18–20px
- Background: transparent / translucent white overlay (rgba(255,255,255,0.12)) on dark video canvas
- Border radius: 8px (square) or 999px (circular, on dark overlay controls)

## 4. Tab Item
- Padding: 0 0 12px 0 (bottom aligned to underline)
- Font: 15px / 500 (600 when active)
- Inactive color: #6B7280
- Active color: #6D5CE1 with 2px underline, same color, 2px border-radius

## 5. Card (generic container)
- See design-system `Card` base style
- Variants: metadata card, chart card, list card — all share base padding/radius/shadow

## 6. Metadata Row (icon + label + value)
- Layout: horizontal flex, space-between
- Icon: 16px, color #9CA3AF, in 28px circular/rounded light-gray chip (bg #F3F4F6, radius 8px)
- Label: 14px/400/#6B7280, left-aligned next to icon
- Value: 14px/600/#111827, right-aligned
- Row height: 36px, vertical gap between rows: 12px

## 7. Tag Chip
- See design-system. Used for keyword tags under video description ("React", "Hooks", "useState", "useEffect", "useContext") and a trailing "+" add-chip (circular, 28px, icon only)

## 8. Resource Card
- Width: ≈170px, Height: ≈140px
- Border: 1px solid #EDEDF2, radius 14px, background #FFFFFF, padding 16px
- Contents (top→bottom): 40×40px colored icon tile (radius 10px), 8px gap, title 14px/600/#111827 (2-line clamp), 4px gap, meta line 12px/400/#6B7280 with bullet separator (e.g. "Video • 856 MB")
- Icon tile color variants: violet bg #6D5CE1 w/ white play icon; red bg #FEE2E2 w/ red PDF icon; blue bg #DBEAFE w/ blue "M" markdown icon; violet bg w/ white play icon (repeat)

## 9. "Add More" Ghost Card
- Same footprint as Resource Card (≈170×140px)
- Dashed border: 1.5px dashed #D1D5DB, radius 14px, background transparent/#FAFAFC
- Centered content: "+" icon 20px circle + "Add More" label 14px/500/#6B7280

## 10. Progress Bar (linear)
- Track: full width, height 8px (goal progress) or 6px (storage, in excluded sidebar), background #E5E7EB, radius 999px
- Fill: brand violet gradient (#6D5CE1 → #8B7CF0), radius 999px, width = percentage

## 11. Video Scrub Bar
- Track height: 4px, background rgba(255,255,255,0.25), full width, radius 999px
- Fill: solid white or light violet up to played position, radius 999px
- Thumb: 12px circle, white/violet, positioned at play head, visible on the track

## 26. Timer Display
- Large monospace-leaning numeric display, 28px/700, tabular figures, color #111827
- Status dot: 8px filled circle, green (#22C55E), positioned left of "Study Timer" label, indicates active

## 12. Stat Card Row (e.g., "Total Study Hours Today")
- Icon chip: 36px square, radius 10px, light violet bg (#F1EFFD), clock icon 18px violet
- Title: 13px/500/#6B7280 above value
- Value: 20px/700/#111827
- Delta badge (right-aligned): green up-arrow + "18% vs yesterday", 12px/600/#16A34A

## 13. Mini Bar/Line Chart (Focus Score)
- Line chart, single series, brand violet stroke (2px), smooth/monotone curve
- Data point markers: 4px filled circles on line at each x-tick
- Y-axis labels: 0, 50, 100 at 11px/400/#9CA3AF, left-aligned outside plot
- X-axis labels: time marks (9 AM, 10 AM, 11 AM, 12 PM, 1 PM) at 11px/400/#9CA3AF
- Plot area background: transparent, no gridlines visible (or extremely subtle)
- Footer caption row: emoji/icon + "Great focus! Keep it up!" 13px/500/#16A34A

## 14. Activity Log List Item
- Layout: icon (16px, #9CA3AF) + label (left, 13px/400/#374151) + value (right, 13px/600/#111827)
- Row height: 28px, divider: none between rows (tight list), row vertical padding 6px

## 15. Avatar (top nav, excluded from scope but referenced)
- 36px circle, photo fill, 2px white border, small green online-status dot bottom-right (8px, border 2px white)

## 16. Notification Bell w/ Badge (excluded from scope, referenced)
- 20px icon, red circular count badge 16px diameter, white numeral 10px/700, positioned top-right of icon

## 17. Breadcrumb
- Inline text links separated by "›" chevron, 14px/500
- Inactive segments: #6D5CE1 (link color) for "Development" and "React Course"
- Final/current segment: #9CA3AF ("Videos")
- Chevron separator: 14px, #D1D5DB, 8px horizontal margin
