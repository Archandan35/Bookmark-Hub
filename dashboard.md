# BookmarkHub – Complete UI/UX Design Prompt (Light Theme)

## Design Style

Design a premium SaaS dashboard inspired by:

* Notion
* Linear
* Vercel
* Raycast
* Arc Browser
* Dropbox
* Raindrop.io

The design should feel modern, minimal, premium, spacious, and productivity-focused.

No glassmorphism.

Use subtle shadows, rounded corners, soft borders, generous white space, and smooth hover animations.

---

# Theme

Light Theme

Background

```text
#F8F9FC
```

Cards

```text
#FFFFFF
```

Primary Color

```text
#5B3FD6
```

Hover

```text
#4A2FC8
```

Accent

```text
#7A63F7
```

Border

```text
#E8EAF2
```

Primary Text

```text
#1F2937
```

Secondary Text

```text
#6B7280
```

Success

```text
#22C55E
```

Warning

```text
#F59E0B
```

Danger

```text
#EF4444
```

---

# Window Layout

The application occupies the entire browser window.

Use a three-column dashboard.

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Header                                                                     │
├──────────────┬──────────────────────────────────────────────┬──────────────┤
│              │                                              │              │
│ Left Sidebar │               Main Workspace                 │ Right Panel  │
│              │                                              │              │
├──────────────┴──────────────────────────────────────────────┴──────────────┤
│ Bottom Dock (Media Player)                                                 │
└────────────────────────────────────────────────────────────────────────────┘
```

---

# Header

Height

72px

Left

Application Logo

BookmarkHub

Subtitle

Your Knowledge. Organized.

Center

Large Search Box

Placeholder

```text
Search bookmarks, files, notes...
```

Keyboard Shortcut Badge

```text
Ctrl + K
```

Right

* Add Bookmark Button (Primary Purple)
* Notifications
* Theme Toggle
* Settings
* User Avatar
* Username
* Premium Badge

---

# Left Sidebar

Width

260px

Sticky

Full Height

Sections

Dashboard

All Bookmarks

Favorites

Pinned

Recent

Trash

Divider

Collections

Nested Tree View

Example

```text
Development
 ├── Web Development
 │     ├── React
 │     ├── Next.js
 │     └── Node.js
 ├── Mobile
UGC NET
AI & ML
Study Materials
Personal
Design
Law
Finance
```

Each collection displays a badge with the number of items.

Bottom Cards

Storage Usage

```text
128GB / 512GB
25%
```

Upgrade to Pro Card

Settings

---

# Top Statistics Row

Seven equal metric cards.

Examples

Today's Study

Daily Goal

Bookmarks

Collections

Videos

PDFs

Notes

Each card contains

* Icon
* Title
* Large Number
* Small Description
* Optional Progress Ring

---

# Filter Toolbar

Rounded segmented controls.

Bookmark Type Filters

```text
All

Websites

Folders

PDFs

Videos

Audio

Images

Documents

Code

Notes

More
```

Right Side

Sort Dropdown

Recently Added

View Toggle

Grid

List

---

# Main Content

Title

Recent Bookmarks

Right

View All

Responsive Grid

Desktop

5 cards per row

Gap

24px

---

# Bookmark Card

Size

320 × 240

Rounded

18px

Soft Shadow

Structure

Top

Thumbnail (16:9)

Middle

Title

Subtitle

URL or File Path

Description

Bottom

Type Badge

Favorite Icon

Three-dot Context Menu

Example Cards

* React Official Docs
* Node.js Docs
* Tailwind CSS Docs
* Figma
* React Course Folder
* React Hooks.mp4
* React Cheatsheet.pdf
* README.md
* Study Music.mp3
* Nature.jpg

Each type uses a unique badge color.

---

# Right Sidebar

Width

320px

Contains stacked widgets.

## Current Study Session

Large Card

Displays

Current File

React Hooks.mp4

Path

Timer

```text
00:35:18
```

Buttons

Pause

Stop

Collapse Countdown

```text
Auto collapse in 12s
```

Mini Player

Below timer

Displays current media

Playback Position

---

## Recent Activity

Scrollable List

Shows

* File Icon
* File Name
* Activity
* Relative Time

Example

React Hooks.mp4

Watched 67%

2 minutes ago

---

## Study Overview

Weekly Bar Chart

Statistics

Total Study Time

Average

Sessions

---

# Bottom Workspace

Split Panel

Left

File Explorer

Right

Media Viewer

---

# File Explorer

Header

Current Folder

```text
React Course
```

Breadcrumb

```text
D:\Study\React
```

Toolbar

New Folder

Grid/List

Refresh

More

Table Columns

Name

Type

Size

Modified

Selected file highlighted.

Folder Tree

Videos

Docs

Projects

Notes

Files

Introduction.mp4

Components.mp4

Hooks.mp4

Cheatsheet.pdf

README.md

package.json

index.html

---

# Media Viewer

Displays selected file.

Video Player

Large Thumbnail

Title

React Components

Controls

Play

Pause

Seek

Volume

Playback Speed

Settings

Fullscreen

Progress Bar

Current Time

Duration

Supports

Videos

Audio

PDF

Images

Markdown

Code Preview

---

# Typography

Font

Inter

H1

30px

H2

22px

Card Title

18px

Body

14px

Caption

12px

Buttons

14px Medium

---

# Shadows

Cards

```css
0 6px 20px rgba(15,23,42,0.06)
```

Hover

```css
0 12px 32px rgba(15,23,42,0.12)
```

---

# Border Radius

Buttons

12px

Cards

18px

Inputs

14px

Dialogs

20px

---

# Animations

Hover Lift

2px

Duration

200ms

Scale

1.02

Sidebar

Smooth collapse

Dropdown

Fade + Slide

Dialogs

Fade + Scale

Media Player

Smooth transitions

---

# Responsive Rules

Desktop

1600px+

5 columns

Laptop

1400px

4 columns

Tablet

1024px

3 columns

Mobile

768px

2 columns

Small Mobile

1 column

Sidebar collapses into a drawer.

Right panel becomes a bottom sheet.

---

# Overall Visual Feel

The interface should resemble a premium productivity operating system rather than a simple bookmark manager. The left sidebar serves as the navigation hub, the center is a visually rich content workspace with responsive bookmark cards, the right sidebar continuously displays study progress and activity, and the bottom dock acts as an integrated file explorer and media workspace. Every element should be aligned to an 8px spacing system with consistent iconography, subtle shadows, rounded corners, and a calm white-and-lavender color palette suitable for long study sessions.
