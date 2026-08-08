# Color Specification (Full Palette)

| Element | HEX / RGBA | Usage |
|---|---|---|
| Page background | #F7F7FB | Overall content area backdrop |
| Card background | #FFFFFF | All cards |
| Card border | #EDEDF2 | Card outlines |
| Divider / border default | #E5E7EB | Tab bar bottom border, input borders, progress track |
| Divider subtle | #F0F0F5 | Fine internal dividers |
| Text primary | #111827 | Headings, values |
| Text body | #4B5563 | Paragraph copy |
| Text secondary | #6B7280 | Labels |
| Text tertiary | #9CA3AF | Meta / helper text |
| Brand primary (violet) | #6D5CE1 | Links, active tab, chart line, R1 button text, icon accents |
| Brand primary hover | #5B4BD1 | Hover state |
| Brand tint background | #F1EFFD | Tag chip bg, icon chip bg |
| Success text | #16A34A | Positive deltas, "Great focus!" caption |
| Success background | #ECFDF3 | Success badge bg (if used) |
| Danger / Stop button | #DC2626 | Stop Session button, PDF icon color |
| Danger tint background | #FEE2E2 | PDF resource icon tile bg |
| Info blue | #2563EB | Markdown "M" icon color |
| Info blue tint | #DBEAFE | Markdown resource icon tile bg |
| Neutral icon chip bg | #F3F4F6 | Metadata row icon chips |
| Icon default | #6B7280 | Standard icons |
| Icon muted | #9CA3AF | Chart axis / log row icons |
| Video canvas gradient start | #0B0A18 | Near-black base |
| Video canvas gradient end | #2B1F6B | Deep indigo/purple glow |
| React logo stroke | #22D3EE | Cyan atom icon on video canvas |
| Video overlay chip bg | rgba(0,0,0,0.35) | "Video" tag, top-right icon buttons |
| Video control bar bg | #0B0A18 | Bottom control strip |
| Video scrub track | rgba(255,255,255,0.25) | Unplayed portion |
| Video scrub fill | #FFFFFF | Played portion |
| White text on dark | #FFFFFF | Video overlay text/icons |
| White text muted on dark | rgba(255,255,255,0.6) | Duration portion of time readout |

## Color Usage by Category

**Buttons**
- Outline neutral: bg #FFFFFF, border #E5E7EB, text #111827
- Outline brand: bg #FFFFFF, border #E5E7EB, text #6D5CE1 (Choose Video File)
- Filled danger: bg #DC2626, text #FFFFFF

**Charts**
- Line stroke: #6D5CE1
- Axis labels: #9CA3AF
- Data markers: #6D5CE1 fill, white stroke ring optional

**Status/Delta indicators**
- Positive: #16A34A text + icon
- Neutral values: #111827

**Progress Indicators**
- Track: #E5E7EB
- Fill (goal progress): gradient #6D5CE1 → #8B7CF0
- Fill (video scrub): #FFFFFF
