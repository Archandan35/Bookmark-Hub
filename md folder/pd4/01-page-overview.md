# Page Overview — "React Hooks Deep Dive" Study Session Detail Page

## Scope of this Specification
This document set covers **only the page content area** of the "Study Session" detail screen from the BookmarkHub application. The following existing global chrome is intentionally **excluded** because it already exists in the target application:

- Top Navigation Bar (logo, app name, global search, quick-add button, theme toggle, notifications, avatar)
- Left Sidebar (main nav, collections tree, study tools, storage widget)

The **Right Panel** content IS documented in this spec (see `05-sections.md`, section "Right Panel"), because although the RightPanel container component is global/shared, its inner content blocks are page-specific and must be reproduced exactly for this page.

## Page Identity
- Page Title (breadcrumb context): **Study Session**
- Content Title (H1): **React Hooks Deep Dive**
- Breadcrumb: `Development > React Course > Videos`
- Page Type: Video-based study session detail / player page
- Primary content: video player, tabbed content panel (Overview active), resource cards
- Secondary content (right panel): video source picker, live study timer, session metadata, daily stats, focus score chart, activity log

## High-Level Page Structure (content area only)

```
[Page Content Area]  (starts right of Left Sidebar, below Top Nav)
│
├── Header Row
│   ├── Title + Breadcrumb (left)
│   └── Actions: "Add Bookmark" button + overflow "..." menu (right)
│
├── Video Player Card
│   ├── Video canvas (poster/branding state)
│   ├── Top-left overlay chip: "Video" type badge
│   ├── Top-right overlay icons: PiP icon, Info icon
│   ├── Center overlay: React logo + "React Hooks / Deep Dive" wordmark
│   ├── Scrub/progress bar
│   └── Control bar: play, rewind 10s, forward 10s, volume, time, speed (1.25x), captions (CC), fullscreen
│
├── Tab Bar
│   Overview (active) | Notes | Summary | Bookmarks (5) | Timeline | Resources | Files | Chat (AI)
│
├── Tab Panel Content (Overview)
│   ├── Left Column Card: "About this video" — description + tag chips
│   └── Right Column Card: metadata list (Type, Duration, Size, Added on)
│
└── Resources Section
    ├── Section title: "Resources in this session"
    └── Horizontal row of 4 resource cards + "Add More" ghost card

[Right Panel]  (shared component container, page-specific content)
│
├── Choose Video to Play (card)
├── Study Timer (card)
├── Session Details (card)
├── Total Study Hours Today (card)
├── Today's Goal (card)
├── Focus Score (card, line chart)
└── Session Activity (card, log list)
```

## Design Language Summary
- Style: Clean SaaS dashboard, light theme, rounded cards, soft shadows, purple/indigo brand accent
- Base surface: very light cool-gray/white page background with pure white cards
- Primary accent: violet/indigo (~#6D5CE1 family) used for active states, links, buttons, chart lines
- Secondary accent: cyan/blue for info elements and one resource icon
- Corner radius system: large (16–20px) on cards, medium (10–12px) on buttons/inputs, pill (999px) on badges/progress bars
- Typography: Single sans-serif family throughout (Inter-style geometric grotesque), weight range 400–700
- Iconography: thin-stroke line icons (~1.5–1.75px stroke), 16–20px default size
