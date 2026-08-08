# Section-by-Section Breakdown

All coordinates are relative to the **content area origin** (x=0 = left edge of main content column, right after the excluded left sidebar; y=0 = top edge of content area, right below the excluded top nav bar), unless stated as "Right Panel" coordinates (relative to right panel column origin).

---

## SECTION A — Page Header Row

Container
- X: 0, Y: 24px
- Width: 100% of main column (≈878px)
- Height: 40px
- Display: flex, space-between, align-items: center

### A1. Title + Breadcrumb (left group)
- Stacked vertically, gap 4px
- **H1 Title**
  - Text: "React Hooks Deep Dive"
  - Font: Inter, 26px, weight 700, line-height 32px, color #111827, letter-spacing -0.3px
- **Breadcrumb**
  - Text: "Development > React Course > Videos"
  - Font: 14px / 500 / line-height 20px
  - "Development": color #6D5CE1
  - " > " chevron: color #D1D5DB, margin 0 6px
  - "React Course": color #6D5CE1
  - "Videos": color #9CA3AF (current page, no link style)

### A2. Actions (right group)
- Display: flex, align-items: center, gap: 12px
- **"Add Bookmark" button**: outline button, bookmark-plus icon (16px, #111827) + label "Add Bookmark", 14px/600
  - Width: ≈150px, Height: 40px, radius 10px, border 1px #E5E7EB
- **Overflow menu "..."**: icon-only ghost button, 36×36px, horizontal-dots icon 18px, color #6B7280, radius 8px

---

## SECTION B — Video Player Card

Container
- X: 0, Y: 88px
- Width: 878px
- Height: ≈460px (canvas ≈380px + control bar ≈80px, combined single card)
- Border radius: 16px
- Overflow: hidden
- Box shadow: `0 8px 24px rgba(17,10,60,0.12)`

### B1. Video Canvas
- Height: ≈380px, width: 100%
- Background: linear/radial gradient, dark navy-black (#0B0A18) to deep indigo-purple (#2B1F6B), radial glow emanating from right-center, subtle diagonal dotted grid texture at low opacity (≈8%) across right two-thirds

#### B1a. Top-left overlay chip — "Video" type tag
- Position: absolute, X: 20px, Y: 20px (from canvas top-left)
- Size: auto width × 32px height
- Background: rgba(0,0,0,0.35), backdrop-blur
- Border radius: 8px
- Padding: 6px 12px
- Contents: square/video icon 14px (white) + text "Video" 13px/500/#FFFFFF, gap 6px

#### B1b. Top-right overlay icon group
- Position: absolute, X: canvas width − 88px, Y: 20px
- Two circular icon buttons, 36px diameter each, gap 8px
- Background: rgba(0,0,0,0.35)
- Icons: Picture-in-picture icon (18px, white), Info "i" icon (18px, white)

#### B1c. Center brand lockup
- Position: absolute, vertically & horizontally centered within canvas (slightly left-of-center as a group)
- **React atom logo**: cyan (#22D3EE) stroke, 3 overlapping ellipse orbits + center filled dot, overall bounding box ≈180×180px, stroke width ≈6px
- Gap between logo and wordmark: 32px
- **Wordmark**: two lines, "React Hooks" / "Deep Dive"
  - Font: 40px / 700 / line-height 48px / color #FFFFFF
  - Left-aligned, positioned to the right of the logo

### B2. Scrub Bar
- Position: bottom of canvas area, full width, sits at Y ≈ 360px within card (just above control bar)
- Height: 4px track, padding 0 20px horizontally (inset from card edges)
- Track color: rgba(255,255,255,0.25), radius 999px
- Progress fill: ≈19% width (matches 15:32 / 1:22:45), color #FFFFFF, radius 999px
- Thumb: 12px circle, white, positioned at fill end, visible always (not hover-only)

### B3. Control Bar
- Height: ≈64px, width: 100%, background: #0B0A18 (solid, slightly lighter than canvas top or same — matches canvas base), padding: 0 20px
- Layout: flex, space-between, align-items: center

#### B3a. Left control group (gap 16px between icons)
- Play/Pause icon button: 20px triangle icon, white, 36px hit area
- Rewind 10s: circular-arrow-left icon with "10" text overlay, 20px, white
- Forward 10s: circular-arrow-right icon with "10" text overlay, 20px, white
- Volume icon: speaker icon, 20px, white
- Time readout: "15:32 / 1:22:45", font 13px/500, color #FFFFFF (current time) and rgba(255,255,255,0.6) (duration), tabular-nums

#### B3b. Right control group (gap 16px)
- Speed badge: "1.25x" text in pill, background rgba(255,255,255,0.15), radius 6px, padding 4px 10px, font 12px/600/#FFFFFF
- Captions "CC" icon: rounded-square outline icon, 20px, white
- Fullscreen icon: expand-arrows icon, 20px, white

---

## SECTION C — Tab Bar

Container
- X: 0, Y: 564px
- Width: 878px
- Height: 44px
- Border-bottom: 1px solid #E5E7EB
- Display: flex, gap 32px, align-items: flex-end

### Tab items (in order)
1. **Overview** — ACTIVE: font 15px/600/#6D5CE1, 2px bottom border #6D5CE1 offset 12px below text, extends full label width
2. **Notes** — inactive: 15px/500/#6B7280
3. **Summary** — inactive
4. **Bookmarks (5)** — inactive, includes count in same run of text
5. **Timeline** — inactive
6. **Resources** — inactive
7. **Files** — inactive
8. **Chat (AI)** — inactive, rightmost tab

---

## SECTION D — Overview Tab Panel

Container: X: 0, Y: 624px, Width: 878px, Height: ≈196px, Display: flex, gap: 24px

### D1. "About this video" Card (left, ≈480px wide)
- Background #FFFFFF, border 1px #EDEDF2, radius 16px, padding 24px
- **Header**: "About this video" — 16px/600/#111827, margin-bottom 12px
- **Body paragraph**: "In this session, we will dive deep into React Hooks, understanding how they work, the benefits they provide over class components, and how to use them effectively." — 14px/400/line-height 22px/#4B5563, margin-bottom 16px
- **Tag row**: flex, gap 8px, wrap
  - Chips: "React", "Hooks", "useState", "useEffect", "useContext" — each pill 13px/500/#6D5CE1 on #F1EFFD bg, radius 999px, padding 6px 14px
  - Trailing "+" chip: circular 28px, border 1px dashed #D1D5DB, icon 14px #6B7280, add-more affordance

### D2. Metadata Card (right, ≈374px wide)
- Background #FFFFFF, border 1px #EDEDF2, radius 16px, padding 24px
- 4 metadata rows, each: icon chip (28px, radius 8px, bg #F3F4F6) + label (left, 14px/400/#6B7280) + value (right, 14px/600/#111827)
  - Row 1: file icon — "Type" — "Video"
  - Row 2: clock icon — "Duration" — "1:22:45"
  - Row 3: hard-drive/box icon — "Size" — "856 MB"
  - Row 4: calendar icon — "Added on" — "May 10, 2024"
- Row height: 36px, gap between rows: 14px

---

## SECTION E — Resources in this Session

Container: X: 0, Y: 852px, Width: 878px, Height: ≈165px

### E1. Section Title
- "Resources in this session" — 16px/600/#111827, margin-bottom 16px

### E2. Card Row (flex, gap 16px)
1. **React Hooks Deep Dive** — icon tile: violet bg (#6D5CE1), white play-triangle icon 18px — title 14px/600 (2 lines max) — meta "Video · 856 MB" 12px/#6B7280
2. **Hooks Cheatsheet** — icon tile: light red bg (#FEE2E2), red (#DC2626) document/PDF icon 18px — title "Hooks Cheatsheet" — meta "PDF · 2.4 MB"
3. **useEffect Explained** — icon tile: blue bg (#DBEAFE), blue (#2563EB) "M" markdown glyph icon — title "useEffect Explained" — meta "Markdown · 12 KB"
4. **useState in Depth** — icon tile: violet bg (#6D5CE1), white play-triangle icon — title "useState in Depth" — meta "Video · 320 MB"
5. **Add More** — dashed ghost card, centered "+" circle icon (24px, border 1.5px #D1D5DB) + "Add More" label 14px/500/#6B7280

Each card: width ≈170px, height ≈140px, radius 14px, padding 16px, border 1px #EDEDF2 (solid for 1–4, dashed for 5), background #FFFFFF (transparent-ish for Add More)

---

## RIGHT PANEL (component: shared RightPanel, content is page-specific)

Column width: ≈360px, starts at X≈1176px page-level. Internal padding 0 (each card is full column width). Vertical gap between cards: 16px.

### R1. "Choose Video to Play" Card
- Height: ≈128px, padding 20px
- Header row: bookmark/monitor icon (18px, #6D5CE1) + "Choose Video to Play" 15px/600/#111827, gap 8px
- Subtext: "Select a video file from your device" — 13px/400/#9CA3AF, margin-top 4px, margin-bottom 16px
- **"Choose Video File" button**: full width, height 40px, outline style, border 1px #E5E7EB, radius 10px, icon (upload/folder, 16px, #6D5CE1) + label 14px/600/#6D5CE1 (button text rendered in brand color, unlike neutral buttons elsewhere), centered
- Helper text below button: "Supports: MP4, WebM, MKV, MOV (Max 4GB)" — 12px/400/#9CA3AF, centered, margin-top 10px

### R2. "Study Timer" Card
- Height: ≈190px, padding 20px
- Header row: green status dot (8px circle, #22C55E) + "Study Timer" 15px/600/#111827, gap 8px
- **Time display**: "01:24:36" — 30px/700/line-height 36px/#111827, tabular-nums, margin: 8px 0 2px
- Subtext: "Active since 10:15 AM" — 13px/400/#9CA3AF, margin-bottom 16px
- **Button row**: flex, gap 10px, height 40px
  - "Pause" button: outline, pause-icon (14px) + label 14px/600/#111827, flex ≈0.4
  - "Stop Session" button: filled red (#DC2626), stop-icon (14px, white) + label 14px/600/#FFFFFF, flex ≈0.6
- **"Pauses Taken" row**: below buttons, margin-top 16px, flex space-between: label "Pauses Taken" 13px/400/#6B7280, value "2" 13px/600/#111827

### R3. "Session Details" Card
- Height: ≈220px, padding 20px
- Header: "Session Details" 15px/600/#111827, margin-bottom 14px
- 6 metadata rows (icon 14px #9CA3AF + label 13px/400/#6B7280 left, value 13px/600/#111827 right), row height 28px:
  1. Started At — "Today, 10:15 AM"
  2. Last Active — "Today, 11:39 AM"
  3. Total Time — "01:24:36"
  4. Break Time — "00:08:15"
  5. Completed — "0%"
  6. Notes — "12"
  7. Bookmarks — "5"
  (7 rows total)

### R4. "Total Study Hours Today" Card
- Height: ≈78px, padding 16px 20px, flex row, align-items: center, gap 12px
- Icon chip: 36×36px, radius 10px, bg #F1EFFD, clock icon 18px #6D5CE1
- Text block: title "Total Study Hours Today" 13px/500/#6B7280, value "3h 45m" 20px/700/#111827 directly below
- Right-aligned delta badge: up-arrow icon (10px, #16A34A) + "18% vs yesterday" 12px/600/#16A34A

### R5. "Today's Goal" Card
- Height: ≈90px, padding 20px
- Header row: flex space-between — "Today's Goal" 14px/600/#111827 (left) — "3h 30m / 5h" 13px/600/#6D5CE1 (right)
- Progress bar: margin-top 12px, height 8px, track #E5E7EB radius 999px, fill 70% width, gradient violet fill, radius 999px
- Percentage label: "70%" 12px/600/#111827, right-aligned below/beside bar, margin-top 6px

### R6. "Focus Score" Card
- Height: ≈190px, padding 20px
- Header row: flex space-between — "Focus Score" 15px/600/#111827 (left) — "85/100" (right, "85" at 18px/700/#6D5CE1 + "/100" at 13px/400/#9CA3AF)
- **Line chart**: height ≈100px, width 100%, margin-top 12px
  - Y-axis labels "100" (top) and "0"/"50" markers, 11px/400/#9CA3AF, left side
  - X-axis labels: "9 AM 10 AM 11 AM 12 PM 1 PM", 11px/400/#9CA3AF, below plot
  - Single line series, violet stroke #6D5CE1, 2px width, smooth curve, small circle markers (4px) at each data vertex, upward-trending jagged pattern
- Footer caption row: margin-top 10px, smiley/check icon (14px, #16A34A) + "Great focus! Keep it up!" 13px/500/#16A34A

### R7. "Session Activity" Card
- Height: ≈200px, padding 20px
- Header: "Session Activity" 15px/600/#111827, margin-bottom 12px
- 5 log rows, each: icon (14px, #9CA3AF, left) + label (13px/400/#4B5563) + value (right-aligned, 13px/600/#111827), row height 26px, no dividers
  1. Video Watched — "15:32 / 1:22:45"
  2. Notes Added — "12"
  3. Bookmarks Added — "5"
  4. Resources Opened — "8"
  5. Chat Interactions — "6"
