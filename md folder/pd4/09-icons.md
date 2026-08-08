# Icon Specification

General icon system: thin-stroke line icons (Lucide/Feather-style), stroke width **1.5–1.75px**, `stroke-linecap: round`, `stroke-linejoin: round`, no fill except where noted (status dots, chart markers, play triangles).

| Icon | Closest Equivalent (Lucide) | Size | Stroke Width | Color | Placement |
|---|---|---|---|---|---|
| Bookmark plus | `bookmark-plus` | 16px | 1.75px | #111827 | "Add Bookmark" button, left of label |
| More horizontal | `more-horizontal` | 18px | 1.75px | #6B7280 | Header overflow menu |
| Video/film | `video` or `square` | 14px | 1.5px | #FFFFFF | Video canvas top-left chip |
| Picture-in-picture | `picture-in-picture-2` | 18px | 1.5px | #FFFFFF | Video canvas top-right |
| Info | `info` | 18px | 1.5px | #FFFFFF | Video canvas top-right |
| Play | `play` (filled triangle) | 18–20px | fill | #FFFFFF / brand violet on tiles | Control bar, resource card icon tiles |
| Rotate/skip back 10 | `rotate-ccw` w/ "10" label | 20px | 1.5px | #FFFFFF | Control bar |
| Rotate/skip forward 10 | `rotate-cw` w/ "10" label | 20px | 1.5px | #FFFFFF | Control bar |
| Volume | `volume-2` | 20px | 1.5px | #FFFFFF | Control bar |
| Closed captions | `captions` | 20px | 1.5px | #FFFFFF | Control bar |
| Maximize/fullscreen | `maximize` | 20px | 1.5px | #FFFFFF | Control bar |
| File/document | `file` | 16px | 1.5px | #6B7280 | Metadata "Type" row |
| Clock | `clock` | 16–18px | 1.5px | #6B7280 / #6D5CE1 | Metadata "Duration", Total Hours icon chip, Study Timer status |
| Database/box | `hard-drive` | 16px | 1.5px | #6B7280 | Metadata "Size" |
| Calendar | `calendar` | 16px | 1.5px | #6B7280 | Metadata "Added on" |
| PDF/document-text | `file-text` | 18px | 1.5px | #DC2626 | Hooks Cheatsheet resource icon |
| Markdown "M" | custom glyph (letter M in rounded tile) | 18px | — | #2563EB | useEffect Explained resource icon |
| Plus (add) | `plus` | 14–20px | 1.75px | #6B7280 / #9CA3AF | Tag add chip, Add More card |
| Upload/folder | `upload` or `folder-open` | 16px | 1.5px | #6D5CE1 | "Choose Video File" button |
| Pause | `pause` | 14px | fill | #111827 | Pause button |
| Stop/square | `square` (filled) | 14px | fill | #FFFFFF | Stop Session button |
| Status dot (active) | filled circle | 8px | fill | #22C55E | Study Timer header, top-nav-adjacent indicators |
| Chevron right | `chevron-right` | 14px | 1.5px | #D1D5DB | Breadcrumb separator |
| Trending up / arrow | `trending-up` or `arrow-up` | 10–12px | 1.75px | #16A34A | Delta badge |
| Smile / check-circle | `smile` or `check-circle` | 14px | 1.5px | #16A34A | Focus score caption |
| History/list icon | `list` or `activity` | 14px | 1.5px | #9CA3AF | Activity log rows |

## Icon Sizing Rules
- Control-bar (on-video) icons: **18–20px**, always white, hit-area 36×36px
- Inline metadata icons: **16px**, neutral gray, often housed in a 28px rounded chip
- Card header leading icons: **18px**, brand-tinted where the card is action-oriented (Choose Video, Study Timer)
- Micro icons (deltas, captions): **10–14px**

## Icon Chip Containers
- Standard neutral chip: 28×28px, radius 8px, bg #F3F4F6
- Brand chip (Total Study Hours): 36×36px, radius 10px, bg #F1EFFD
- Resource card icon tile: 40×40px, radius 10px, color-coded background per file type
