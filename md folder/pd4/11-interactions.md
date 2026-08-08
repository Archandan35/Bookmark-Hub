# Interaction & State Specification

## Tabs
- **Default/inactive**: text #6B7280, weight 500, no underline
- **Hover**: text darkens to #374151, cursor pointer
- **Active**: text #6D5CE1, weight 600, 2px solid underline in #6D5CE1 with 4px offset below text baseline
- **Transition**: color and underline width animate over 150ms ease

## Buttons (all variants)
- **Default**: as specified in `04-components.md`
- **Hover (outline)**: background shifts to #F9FAFB, border darkens to #D1D5DB
- **Hover (danger filled)**: background darkens to #B91C1C
- **Active/pressed**: scale 0.98 or background darkens further
- **Focus-visible**: 2px outline ring in brand violet at 2px offset, `box-shadow: 0 0 0 3px rgba(109,92,225,0.25)`
- **Disabled**: opacity 0.5, cursor not-allowed (not shown in current screenshot but standard)

## Video Player
- **Scrub bar hover**: thumb grows from 12px to 14px, track height may increase from 4px to 6px on hover for easier grabbing
- **Control bar icons hover**: background pill appears behind icon, rgba(255,255,255,0.1), radius 6px
- **Center brand lockup**: this is a poster/idle state shown before or when video content isn't actively rendering frames (branding placeholder) — disappears once actual video frame content plays
- **Play button click**: toggles to pause icon, canvas overlay (brand lockup) fades out if video begins playing

## Tag Chips
- **Default**: as specified
- **Hover**: slight background darken to #E9E5FC
- **Add chip (+) hover**: border color darkens, background tints light violet

## Resource Cards
- **Hover**: card lifts slightly — box-shadow increases to `0 4px 12px rgba(16,24,40,0.08)`, border color darkens to #E0E0E8, cursor pointer, translateY(-2px)
- **Click**: navigates to / opens the resource (video plays inline or file opens in viewer)

## Add More Card
- **Hover**: dashed border color shifts from #D1D5DB to #6D5CE1, background tints to #FAFAFF, "+" icon color shifts to brand violet
- **Click**: opens file picker or "add resource" modal

## Study Timer
- **Live update**: "01:24:36" increments once per second while session is active (green status dot pulses subtly, 2s ease-in-out infinite opacity animation between 1.0 and 0.6)
- **Pause button click**: timer stops incrementing, "Pauses Taken" counter increments by 1, button label may toggle to "Resume"
- **Stop Session click**: likely triggers a confirmation dialog/modal before ending session (not visible in screenshot but standard UX pattern) — session then marked complete

## Progress Bars
- **Goal progress bar**: animates fill width on load (0 → 70%) over ~600ms ease-out; updates live as study time accumulates
- **Video scrub**: draggable; dragging updates video playhead in real time with a tooltip showing target timestamp

## Focus Score Chart
- **Hover on data point**: tooltip appears showing exact score + timestamp, marker enlarges from 4px to 6px
- **Live update**: new data point appended periodically while session is active; line redraws with smooth transition

## Choose Video File Button
- **Click**: opens native OS file picker filtered to video mime types (mp4, webm, mkv, mov)
- **Drag-and-drop**: card area likely accepts drag-over state — border becomes solid brand violet, background tints #F1EFFD, helper text changes to "Drop file to upload"

## Overflow Menu ("...")
- **Click**: opens a dropdown menu (anchored bottom-right of trigger) with contextual actions (e.g., Rename, Move, Delete, Share, Download) — `shadow/dropdown` token, radius 12px, white background, 1px border #E5E7EB, min-width 180px, 8px vertical padding, items 36px height each with hover state bg #F9FAFB

## Tooltips (implied, not directly visible)
- Standard tooltip style: dark background #111827, white text 12px/500, radius 6px, padding 6px 10px, small triangle pointer, appears on hover after ~400ms delay, fades in 100ms
