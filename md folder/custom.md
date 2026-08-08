# Study Timer & Video Player Synchronization — Functional Specification

## 1. Overview

The **Study Timer** and **Video Player** must operate as a single synchronized study-session system.

When a user selects a video from the local folder and plays it inside the **`learn-video-card`**** VLC-style video player**, the Study Timer must automatically start from **`00:00:00`**.

The timer tracks only the current study session. When the session is stopped or the video reaches the end, the session is automatically saved and its duration is added to the user's study statistics.

The recorded study duration must be reflected in:

* **Today's Total Study Hours**
* **Weekly Study Hours**
* **Monthly Study Hours**
* **Lifetime Study Hours**
* **Sessions Completed**
* **Statistics Page**
* **Goal Page**

The existing CSS classes must be preserved.

---

# 2. Existing CSS Classes

Do not rename or replace the existing classes.

### Timer Display

currently used the css classes::

```text
learn-timer-display
```

for the Study Timer display.

### Timer Buttons

currently used the css classes::

```text
learn-timer-btns
```

for the timer control area.

The **Remember** checkbox must also be displayed inside this section.

### Pause Button

currently used the css classes::

```text
learn-btn-outline-sm
```

for the Study Timer **Pause** button.

### Stop Session Button

currently used the css classes::

```text
learn-btn-danger
```

for the **Stop Session** button.

---

# 3. Core Synchronization Rule

The Video Player and Study Timer must always remain synchronized.

The video playback state is the primary trigger for automatic timer synchronization, while the Study Timer controls must also control the video player.

### Required synchronization

| Video Player State             | Study Timer State                               |
| ------------------------------ | ----------------------------------------------- |
| Playing                        | Running                                         |
| Paused + user chooses Pause    | Paused                                          |
| Paused + user chooses Continue | Running                                         |
| Stopped                        | Session completed and timer reset               |
| Video ended                    | Session automatically completed and timer reset |
| Replay                         | New session starts at `00:00:00`                |

There must never be multiple timers running for the same session.

---

# 4. Automatic Timer Start

When a video is selected but has not yet been played:

```text
Timer = 00:00:00
Session = Not Started
```

When the user presses **Play**:

1. Start video playback.
2. Create a new study session.
3. Reset the timer to `00:00:00` if this is a new session.
4. Start counting elapsed study time immediately.
5. Continue counting while the video is actively playing.

The timer must use elapsed-time calculation rather than relying only on repeated one-second increments so that it remains accurate when the browser is throttled or the tab is inactive.

---

# 5. Video Pause Behaviour

When the user pauses the video, display a confirmation popup.

The popup must ask whether the Study Timer should continue running or pause.

### Popup options

```text
Video Paused

Should the Study Timer continue?

[ Continue Timer ]   [ Pause Timer ]

☐ Remember my choice
```

### Continue Timer

If the user selects **Continue Timer**:

* Video remains paused.
* Study Timer continues counting.
* The current session remains active.
* When the video resumes, the timer continues normally.

### Pause Timer

If the user selects **Pause Timer**:

* Video remains paused.
* Study Timer pauses immediately.
* The elapsed study time is preserved.
* When the video resumes, the Study Timer resumes automatically.

---

# 6. Remember Choice

The pause popup must contain:

```text
☐ Remember my choice
```

The same Remember checkbox must also be visible inside the same section where as :

```text
learn-timer-btns
```

If the user checks **Remember my choice**, store the selected behaviour.

For example:

```text
Remembered preference:
Pause Timer
```

or:

```text
Remembered preference:
Continue Timer
```

For subsequent video pauses:

* Do not show the popup.
* Automatically apply the remembered behaviour.

The remembered preference must remain active until the user unticks the **Remember** checkbox.

If the user unticks it:

* Remove the stored preference.
* Show the pause popup again on the next video pause.

---

# 7. Video Player Controls

## Play

When the user clicks the Video Player **Play** button:

* Start or resume video playback.
* Start or resume the Study Timer.
* Maintain the current session.
* Do not create a duplicate session.

---

## Pause

When the user clicks the Video Player **Pause** button:

* Pause the video.
* Apply the remembered pause behaviour if available.
* Otherwise display the pause confirmation popup.

The timer must follow the user's selected behaviour.

---

## Stop

When the user clicks **Stop**:

1. Stop video playback.
2. End the current study session.
3. Save the session record.
4. Add the session duration to all applicable study statistics.
5. Reset the Study Timer to:

```text
00:00:00
```

6. Keep the selected video loaded.
7. Replace **Stop Session** with **Replay**.

The session must be saved only once.

---

# 8. Study Timer Controls

The Study Timer controls must control the Video Player.

## Play

The Study Timer Play control must:

* Start the selected video.
* Start the Study Timer.
* Resume the existing session if it was paused.
* Create a new session only when starting a completely new/replayed session.

---

## Pause

currently used the css classes:

```text
learn-btn-outline-sm
```

for the Pause button.

Clicking Pause must:

* Pause the video.
* Pause the Study Timer.
* Preserve the elapsed time.
* Keep the current study session active.

Both components must enter the paused state together.

---

## Stop Session

currently used the css classes:

```text
learn-btn-danger
```

for the Stop Session button.

Clicking Stop Session must:

1. Stop the video.
2. End the current session.
3. Save the session record.
4. Update study statistics.
5. Reset the timer to `00:00:00`.
6. Keep the video loaded.
7. Replace the Stop Session button with **Replay**.

---

# 9. Replay Behaviour

After a study session has been stopped while the video remains loaded:

```text
Stop Session
```

must be replaced by:

```text
Replay
```

### Clicking Replay

When Replay is clicked:

1. Seek the video to `00:00:00`.
2. Reset the Study Timer to `00:00:00`.
3. Create a completely new study session.
4. Start video playback.
5. Start the Study Timer.
6. Generate a new Session ID.
7. Preserve all previous session records.
8. Never overwrite the previous session.

Each Replay therefore represents a new independent study session.

---

# 10. Multiple Session Support

The application must support unlimited completed sessions for the same video.

Example:

```text
Session 1
00:35:20

Session 2
00:42:10

Session 3
00:18:45
```

The daily total must be calculated independently from all completed sessions:

```text
01:36:15
```

Every session must remain separately identifiable in Session History.

---

# 11. Video End Behaviour

When the video reaches its natural end:

1. Detect the video `ended` event.
2. Stop the Study Timer.
3. Complete the current study session.
4. Calculate the final watch duration.
5. Calculate completion percentage.
6. Save the session exactly once.
7. Update study statistics.
8. Reset the timer to `00:00:00`.
9. Keep the video loaded.
10. Display the **Replay** button.

The session must not be saved again if the user subsequently clicks Replay.

---

# 12. Seeking Behaviour

Seeking must never incorrectly stop or reset the Study Timer.

If the video is actively playing and the user:

* Seeks forward
* Seeks backward
* Drags the progress bar
* Jumps to another timestamp

then:

```text
Video = Playing
Timer = Running
```

The timer continues uninterrupted.

Seeking must not create a new session.

---

# 13. Playback Speed Changes

Changing playback speed must not affect the Study Timer state.

For example:

```text
0.5×
0.75×
1×
1.25×
1.5×
2×
```

If the video is playing:

```text
Timer = Running
```

Changing playback speed must not:

* Reset the timer.
* Pause the timer.
* Create a new session.
* Complete the current session.

The timer measures actual study-session elapsed time, not the video's media duration.

---

# 14. Video Quality Changes

Changing video quality must not affect the Study Timer.

If the video remains actively playing:

```text
Timer = Running
```

The timer must continue without interruption.

Quality changes must not:

* Reset the timer.
* Create a new session.
* Save the session.
* Pause the timer.

---

# 15. Session Recording

A completed study session must be saved when:

* The user clicks **Stop Session**.
* The video reaches the end.
* The current video is removed/unloaded while a session is active.

Each saved session must contain:

```text
Session ID
Video ID
Video Title
Video Name
Folder / Bookmark Name
Start Timestamp
End Timestamp
Total Watch Duration
Playback Completion Percentage
Date
Time
Session Number
```

### Duration format

Store/represent the duration as:

```text
HH:MM:SS
```

Example:

```text
01:36:15
```

---

# 16. Completion Percentage

The application must calculate the percentage of the video watched for the current session.

Example:

```text
Video Duration: 60:00
Watched Position: 45:00

Completion Percentage: 75%
```

The completion percentage must be stored with the session record.

Seeking forward must not falsely represent the skipped portion as actual watched time. Completion percentage and actual study duration should therefore be tracked as separate values.

---

# 17. Session Number

Sessions for the same video must have sequential session numbers.

Example:

```text
Session 1
Session 2
Session 3
Session 4
```

A Replay always creates the next session number.

Previous session numbers must never be modified.

---

# 18. Session History

Every completed study session must remain available after:

* Page refresh
* Browser refresh
* Application restart

Session History must display at least:

| Field             | Description                 |
| ----------------- | --------------------------- |
| Session Number    | Sequential session number   |
| Video Name        | Played video                |
| Folder / Bookmark | Source folder or bookmark   |
| Watch Duration    | Actual study duration       |
| Completion        | Video completion percentage |
| Date              | Session date                |
| Time              | Session time                |

The history must be persisted in the application's database/storage layer rather than only React component state.

---

# 19. Study Statistics

Whenever a valid study session is completed, add its duration to:

### Today

```text
Today's Study Hours
```

### Weekly

```text
Weekly Study Hours
```

### Monthly

```text
Monthly Study Hours
```

### Lifetime

```text
Lifetime Study Hours
```

Also increment:

```text
Sessions Completed
```

Only successfully completed and saved sessions may affect these totals.

The same session must never be counted twice.

---

# 20. Statistics Page

The Statistics Page must use the persisted session records to calculate and display:

* Today's Study Hours
* Weekly Study Hours
* Monthly Study Hours
* Lifetime Study Hours
* Sessions Completed
* Session History

The values must remain correct after refreshing the application.

---

# 21. Goal Page

The Goal Page must automatically reflect the updated study data.

At minimum, the relevant fields must show:

```text
Today's Total Study Hours
Sessions Completed
```

When a session is completed, the Goal Page must update without requiring the user to manually enter the study duration.

---

# 22. Timer Reset Rules

The Study Timer must reset to:

```text
00:00:00
```

only when:

* A session is completed by Stop Session.
* A session is completed because the video ended.
* The current session is explicitly discarded according to the application's session lifecycle.

When the video is merely paused:

```text
Do NOT reset timer.
```

When the video is seeked:

```text
Do NOT reset timer.
```

When playback speed changes:

```text
Do NOT reset timer.
```

When video quality changes:

```text
Do NOT reset timer.
```

---

# 23. Button States

## No Video Selected

```text
Play           Disabled
Pause          Disabled
Stop Session   Disabled
```

---

## Video Selected — Not Started

```text
Play           Enabled
Pause          Disabled
Stop Session   Disabled
```

---

## Video Playing

```text
Play           Hidden or Disabled
Pause          Enabled
Stop Session   Enabled
```

---

## Video Paused

```text
Play           Enabled
Pause          Disabled
Stop Session   Enabled
```

---

## Session Stopped — Video Still Loaded

```text
Replay         Enabled
Stop Session   Hidden
```

The Replay button starts a completely new session.

---

# 24. Video Removal / Unload Behaviour

If the user removes the currently loaded video while an active study session exists:

1. Detect the video unload/removal action.
2. Stop the timer.
3. Capture the current elapsed duration.
4. Save the current session once.
5. Update study statistics.
6. Reset the timer to `00:00:00`.
7. Clear the video player state.

The application must not save the same session again during cleanup.

---

# 25. Accidental Double-Click Protection

Prevent accidental duplicate actions.

### Play

Repeated/double clicks must not:

* Create multiple sessions.
* Start multiple timers.
* Add duplicate event listeners.

### Stop

Repeated/double clicks must not:

* Save the session multiple times.
* Increment session statistics multiple times.
* Create duplicate session records.

Use a session state/lock mechanism to guarantee that each session can be finalized only once.

---

# 26. Timer Concurrency Protection

Only one Study Timer may run at any time.

The implementation must prevent:

* Multiple intervals.
* Multiple animation loops.
* Duplicate playback listeners.
* Duplicate timer calculations.
* Multiple session records for one playback session.

Starting/resuming playback must first verify that the current timer is not already running.

---

# 27. Minimum Session Threshold

To prevent accidental recordings, sessions shorter than a configurable threshold must not be stored.

Default threshold:

```text
5 seconds
```

Example:

```text
Session Duration = 03 seconds
→ Do not save
→ Do not update statistics
→ Do not increment Sessions Completed
```

```text
Session Duration = 08 seconds
→ Save session
→ Update statistics
→ Increment Sessions Completed
```

The threshold should be configurable rather than hard-coded into the session-recording logic.

---

# 28. Browser Tab / Minimize Behaviour

Timer accuracy must remain reliable when the user:

* Switches browser tabs.
* Minimizes the browser.
* Changes browser focus.
* Returns to the application later.

Do not rely on a continuously running `setInterval()` alone for elapsed-time accuracy.

Instead, calculate elapsed time using timestamps, for example:

```text
elapsedTime = currentTimestamp - sessionStartTimestamp
```

while respecting periods where the Study Timer is intentionally paused.

When the browser becomes active again, recalculate the timer from the stored timestamps rather than assuming every timer tick occurred.

---

# 29. Single Source of Truth

The application must maintain one authoritative study-session state.

The Video Player and Study Timer must not maintain separate independent timers.

The session state should represent:

```text
No Video
Video Selected
Playing
Paused
Stopped
Completed
```

along with:

```text
sessionId
videoId
videoTitle
folderName
startTimestamp
elapsedStudyTime
completionPercentage
sessionNumber
isRunning
isPaused
isCompleted
```

All Video Player and Study Timer UI controls must read from and update this shared state.

---

# 30. Complete Session Lifecycle

The expected lifecycle is:

```text
Select Video
     ↓
Video Loaded
     ↓
Play
     ↓
New Study Session Created
     ↓
Timer = 00:00:00
     ↓
Video Playing
     ↓
Timer Running
     ↓
 ┌───────────────┬────────────────┐
 ↓               ↓                ↓
Pause           Seek             Speed/Quality
 ↓               ↓                ↓
Pause Popup     Continue         Continue
 ↓               ↓                ↓
Continue/Pause   Timer            Timer
     ↓
Video Resumes
     ↓
Timer Resumes
     ↓
 ┌───────────────────────────────┐
 ↓                               ↓
Stop Session                  Video Ends
 ↓                               ↓
Save Session                   Save Session
 ↓                               ↓
Update Statistics              Update Statistics
 ↓                               ↓
Reset Timer                    Reset Timer
 ↓                               ↓
Replay Available              Replay Available
```

---

# 31. Replay Lifecycle

When Replay is clicked:

```text
Replay
  ↓
Seek Video → 00:00:00
  ↓
Reset Timer → 00:00:00
  ↓
Generate New Session ID
  ↓
Increment Session Number
  ↓
Start Video
  ↓
Start Timer
  ↓
New Independent Session
```

Previous sessions must remain unchanged.

---

# 32. Data Integrity Requirements

The implementation must guarantee:

1. Every completed session has a unique Session ID.
2. A session can be saved only once.
3. A Replay always creates a new session.
4. Previous sessions are never overwritten.
5. Study totals are updated only after successful session completion.
6. A session below the minimum threshold does not affect statistics.
7. Refreshing the application does not erase session history.
8. Video controls and timer controls always represent the same playback state.
9. Only one timer can run at a time.
10. A completed session cannot be completed again.

---

# 33. Expected Final User Experience

The complete experience should feel like a single integrated VLC-style study player:

```text
Select Local Video
       ↓
Click Play
       ↓
Video Starts
       +
Timer Starts
       ↓
00:00:01
00:00:02
00:00:03
...
       ↓
Pause Video
       ↓
"Should the Study Timer continue?"
       ↓
Continue / Pause
       ↓
Resume Video
       ↓
Timer Resumes
       ↓
Stop Session
       ↓
Session Saved
       ↓
Statistics Updated
       ↓
Goal Updated
       ↓
Timer → 00:00:00
       ↓
Replay Available
       ↓
Replay
       ↓
New Independent Session
```

The result must provide a reliable, persistent, multi-session study-tracking system in which the **Video Player, Study Timer, Session History, Statistics Page, and Goal Page all remain synchronized and use the same persisted study-session data.** 