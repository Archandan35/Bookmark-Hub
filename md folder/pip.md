# Study Session PiP — Functional Behavior Specification

## 1. Opening the Study Session

The existing button:

```html
class="class="btn btn-primary btn-sm" .study-timer-empty .btn + .btn"
```

is the entry point for the entire Study Session feature.

When the user clicks `class="btn btn-primary btn-sm" .study-timer-empty .btn + .btn`, the system must first check for any active or previous session. If a previous session exists, it should be saved to the database and properly closed before starting a new one. The “Create New Session” action should not continue or reuse the previous session.

After closing the previous session, a popup form must be shown to start a completely new study session.

* Open a centered modal overlay above the existing application UI.
* Do not open the floating PiP immediately.
* The background application remains visible behind the modal.
* The modal should visually sit above the application using a backdrop/overlay.
* The user must first create/start a study session from this modal.

### Initial Modal

The first modal contains only the session creation form:

```text
┌──────────────────────────────┐
│ Enter Course Name            │
│                              │
│ Enter Lesson No.             │
│                              │
│ [ Source ] [ Educator ]      │
│                              │
│          [ START ]           │
└──────────────────────────────┘
```

### Form fields

The modal must collect:

1. **Course Name**
2. **Lesson Number**
3. **Source**
4. **Educator**

The values entered by the user become the information for the new study session.

The `START` button creates/starts the study session.

---

# 2. START Does NOT Open the PiP

When the user clicks `START`:

* Do NOT close the modal.
* Do NOT open the floating PiP yet.
* Replace the form content inside the **same modal** with the active Study Session view.

In other words:

```text
class="btn btn-primary btn-sm" .study-timer-empty .btn + .btn
      ↓
Form Modal
      ↓ START
Same Modal
      ↓
Active Study Session
```

There should not be two separate modals.

---

# 3. Active Study Session Modal

After clicking `START`, the same modal changes from the form into the Study Session information/control panel.

Example:

```text
┌──────────────────────────────────────┐
│                                  ×   │
│ React JS Complete Course             │
│ Lesson No. 6                         │
│                                      │
│ [ YouTube ] [ Code With Harry ]      │
│                                      │
│ ● 01:24:32                           │
│                                      │
│ [ ⏸ ]   [ ⏹ ]    ↻    [ ● ]         │
│ Pause    Stop   Reset   Restart      │
│                                      │
│ Today total study Hours : 04h 32m    │
│ Today Sessions Count: 3              │
│                                      │
│       Open in Floating Timer         │
└──────────────────────────────────────┘
```

The `×` in this modal closes the modal.

The active study session itself should remain governed by the application's existing Study Timer/session state.

---

# 4. Session Information

The active session modal displays the information entered during session creation.

Example:

```text
React JS Complete Course
Lesson No. 6

[ YouTube ] [ Code With Harry ]
```

The displayed values must come from the current session state.

Do not hard-code:

```text
React JS Complete Course
Lesson No. 6
YouTube
Code With Harry
```

Those are examples only.

---

# 5. Study Timer

The timer displayed in the active modal represents the current study session.

Example:

```text
● 01:24:32
```

Where:

* `●` pulse blinking dot indicator 
* `01:24:32` represents the elapsed study time.
* The timer must use the existing Study Timer state.
* The PiP must NOT create another independent timer.

There must be one source of truth for the timer.

```text
Study Timer State
       │
       ├── Active Session Modal
       │
       ├── Floating PiP
       │
       ├── Statistics
       │
       └── Goal
```

---

# 6. Session Controls

The active modal contains four controls:

```text
[ ⏸ ]    [ ⏹ ]    ↻    [ ● ]
 Pause    Stop    Reset  Restart
```

### Pause

When the user clicks `Pause`:

* Pause the current study timer.
* Change the study status to paused.
* The timer must stop increasing.
* The same paused state must be reflected in the floating PiP if it is open.

### Stop

When the user clicks `Stop`:

* Stop the current study session.
* Save/finalize the accumulated study time according to the existing Study Timer logic.
* Update today's study hours.
* Update today's session count according to the application's existing session rules.
* The PiP must reflect the stopped state.

### Reset

When the user clicks `Reset`:

* Reset the current session timer according to the application's existing timer rules.
* Do not create a duplicate session.
* Do not create a second timer.

### Restart

The `●` Restart control starts a new study session using the appropriate existing session logic.

It must not create a separate independent timer.

---

# 7. Today's Statistics

The modal displays:

```text
Today total study Hours : 04h 32m
Today Sessions Count: 3
```

These values must be dynamic.

They must come from the application's existing study statistics/session state.

Never hard-code:

```text
04h 32m
3
```

Those values are examples only.

When a session is paused, resumed, stopped, or completed, the relevant statistics must remain synchronized with the application's existing Study Timer and statistics logic.

---

# 8. Open in Floating Timer

The active modal contains:

```text
Open in Floating Timer
```

This is the action that opens the actual floating PiP.

When clicked:

1. close the popup modals
2. Keep the current Study Session state.
3. Open the floating PiP above the application.
4. The floating PiP must display the same session.
5. Do not start another timer.
6. Do not reset the current timer.
7. Do not create another study session.
8. The active modal can remain open or be handled according to the existing modal UX, but the floating PiP must use the same state.

The important rule is:

```text
Active Session Modal
        │
        │ Open in Floating Timer
        ▼
Floating PiP
        │
        ▼
Same Study Session
Same Timer
Same State
```

---

# 9. Floating PiP — Normal State

The floating timer should appear as a small desktop-style floating panel.

```text
┌──────────────────────────────────┐
│ 📚 Study Session   ☼  −  □  × > │
├──────────────────────────────────┤
│                                  │
│    ● 01:24:32     ⏸  ⏹  ↻      │
│                                  │
└──────────────────────────────────┘
```

The PiP is a visual controller for the existing Study Session.

It is NOT a new session and NOT a new timer.

---

# 10. Floating PiP Header

The PiP header contains:

```text
📚 Study Session   ☼   −   □   ×   >
```

Controls:

### `☼ / ◐`

PiP-only theme toggle.

It changes only the appearance of the floating PiP.

It must NOT change the application's global theme.

Example:

```text
Application = Light
PiP = Dark
```

must be allowed.

And:

```text
Application = Dark
PiP = Light
```

must also be allowed.

### `−`

Minimize the PiP according to the application's PiP minimize behavior.

### `□`

Maximize the PiP.

### `×`

Close the floating PiP.

Closing the PiP is a UI action and must not automatically stop the study session.

### `>`

Hide the PiP completely and show the edge restore button.

---

# 11. Hide Floating PiP

When the user clicks:

```text
>
```

the floating PiP must disappear completely from the visible application area.

It must NOT:

* stop the timer
* pause the timer
* reset the timer
* end the study session
* delete the session
* create a new session

Only the floating UI is hidden.

The session continues exactly as it was before hiding.

For example:

```text
Timer = 01:24:32
Status = Studying

User clicks >

PiP = Hidden
Timer = still running
Status = still Studying
```

---

# 12. Hidden PiP Edge Button

After hiding the PiP, display a small button attached to the right edge of the screen.

```text
                                      ┌───┐
                                      │ < │
                                      └───┘
```

This button is the restore control.

It must have:

* visible border
* subtle shadow
* rounded corners
* pointer cursor
* hover animation
* smooth transition

It should remain fixed to the screen edge rather than being part of the normal page layout.

---

# 13. Restore Hidden PiP

When the user clicks:

```text
<
```

the floating PiP becomes visible again.

It should restore to the previous normal PiP state:

```text
┌──────────────────────────────────┐
│ 📚 Study Session   ☼  −  □  × > │
├──────────────────────────────────┤
│                                  │
│    ● 01:24:32     ⏸  ⏹  ↻      │
│                                  │
└──────────────────────────────────┘
```

The current session state must be preserved.

For example, if the timer was:

```text
01:24:32
```

before hiding, restoring the PiP must show the current timer value rather than starting from zero.

---

# 14. Maximize Floating PiP

When the user clicks:

```text
□
```

the normal floating PiP expands into a larger floating Study Session panel.

It remains inside the current application.

It must NOT navigate to another page.

It must NOT open another browser window.

It must NOT create another session.

Example:

```text
┌──────────────────────────────────────┐
│ 📚 Study Session   ☼   −   □   ×    │
├──────────────────────────────────────┤
│                                      │
│ React JS Complete Course             │
│ Lesson No. 6                         │
│                                      │
│ [ YouTube ] [ Code With Harry ]      │
│                                      │
│ ● 01:24:32                           │
│                                      │
│       [ ▶ ]   [ ↻ ]   [ ⏹ ]   [ ● ] │
│                                      │
│ ● Studying                           │
│                                      │
│ Today: 04h 32m                       │
│ Sessions: 3                          │
│                                      │
└──────────────────────────────────────┘
```

The maximized panel contains more information than the compact PiP.

---

# 15. Maximize / Restore

The `□` control works as a toggle.

Normal state:

```text
Normal PiP
    │
    │ click □
    ▼
Maximized PiP
```

Maximized state:

```text
Maximized PiP
    │
    │ click □
    ▼
Normal PiP
```

Switching between these states must not affect:

* timer value
* course
* lesson
* source
* educator
* session status
* today's study hours
* today's session count

Only the PiP presentation size changes.

---

# 16. Floating PiP Close

When the user clicks:

```text
×
```

inside the floating PiP:

* Close/hide the PiP UI.
* Do not automatically stop the Study Session.
* Do not reset the timer.
* Do not delete session information.

The Study Session state remains controlled by the central Study Timer.

If the application already defines a specific Close → Stop behavior, follow that existing application rule. Otherwise, closing the PiP is only a UI close operation.

---

# 17. Central State Architecture

The most important implementation rule is:

**There must be only ONE Study Session state and ONE Study Timer.**

Do NOT create:

```text
Modal Timer
+
PiP Timer
```

Instead create:

```text
                 ┌────────────────────────┐
                 │   STUDY SESSION STATE  │
                 │                        │
                 │ Course                 │
                 │ Lesson                 │
                 │ Source                 │
                 │ Educator               │
                 │ Timer                  │
                 │ Status                 │
                 │ Session ID             │
                 └───────────┬────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        Session Modal     Floating PiP    Main Timer
              │              │              │
              └──────────────┼──────────────┘
                             │
                             ▼
                  Statistics / Goal Page
```

Every interface reads from and modifies the same state.

---

# 18. Complete User Flow

The complete workflow is:

```text
Click class="btn btn-primary btn-sm" .study-timer-empty .btn + .btn
        ↓
Open Form Modal
        ↓
Enter Course
        ↓
Enter Lesson
        ↓
Select Source
        ↓
Select Educator
        ↓
Click START
        ↓
Same Modal Changes to Active Session
        ↓
Study Timer Runs
        ↓
User can Pause / Stop / Reset / Restart
        ↓
User clicks "Open in Floating Timer"
        ↓
Floating PiP Opens
        ↓
Same Study Session + Same Timer
        ↓
      ┌───────────────┬────────────────┬─────────────────┐
      ▼               ▼                ▼                 ▼
    Pause            Stop            Reset             Hide >
      │               │                │                 │
      ▼               ▼                ▼                 ▼
 Timer Paused    Save Session      Reset Timer      PiP Hidden
                                                        │
                                                        ▼
                                                   Show < Tab
                                                        │
                                                        │ click <
                                                        ▼
                                                   Restore PiP
```

---

# 19. Maximize Flow

```text
Floating PiP — Normal
        │
        │ click □
        ▼
Floating PiP — Maximized
        │
        │ click □
        ▼
Floating PiP — Normal
```

Hide can happen from the normal floating PiP:

```text
Normal PiP
    │
    │ click >
    ▼
PiP Hidden
    │
    ▼
< Edge Button
    │
    │ click <
    ▼
Normal PiP
```

---

# 20. State Relationship

The UI should be understood as three presentation layers around one session:

```text
                 ONE STUDY SESSION
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
     FORM MODAL    SESSION MODAL   FLOATING PiP
          │            │            │
       START       Controls      Compact View
                       │            │
                       └─────┬──────┘
                             ▼
                       SAME TIMER
                             │
                             ▼
                  Statistics + Goal
```

The **Form Modal** exists only before the session starts.

The **Session Modal** appears after `START` and contains the full session controls/statistics.

The **Floating PiP** is an optional floating representation of that already-running session.

The PiP can be hidden, restored, minimized, maximized, themed, or closed without creating a second session.

---

# 21. Critical Implementation Rules

The implementation must follow these rules exactly:

1. `class=" btn-primary btn-sm" .study-timer-empty .btn + .btn` btn opens the **form modal first**.
2. `START` changes the content of the **same modal** to the active Study Session.
3. `START` does not immediately open the floating PiP.
4. `Open in Floating Timer` opens the floating PiP.
5. The modal and PiP use the **same Study Session state**.
6. The modal and PiP use the **same Study Timer**.
7. Never create a second timer for the PiP.
8. Clicking `>` hides only the PiP UI.
9. Hiding the PiP does not affect the timer or session.
10. `<` restores the PiP.
11. `□` toggles Normal ↔ Maximized.
12. Maximizing does not create a new window or page.
13. `☼ / ◐` changes only the PiP theme.
14. `×` closes the PiP UI and does not automatically stop the session unless existing application logic explicitly requires it.
15. Today's study hours and session count must always come from real application state.
16. All timer/session changes must remain synchronized with the existing Study Timer, Statistics, Goal, and video-player synchronization logic.


flow chart

```text
[ class="btn btn-primary btn-sm" .study-timer-empty .btn + .btn-btn ]
        │
        ▼
┌──────────────────────────────┐
│       STUDY SESSION          │
│                              │
│ [ Enter Course Name ]        │
│                              │
│ [ Enter Lesson No. ]         │
│                              │
│ [ Source ] [ Educator ]      │
│                              │
│          [ START ]           │
└──────────────┬───────────────┘
               │
               │ START
               ▼
┌──────────────────────────────────────┐
│                              ×       │
│ React JS Complete Course             │
│ Lesson No. 6                         │
│                                      │
│ [ YouTube ] [ Code With Harry ]      │
│                                      │
│ ● 01:24:32                           │
│                                      │
│  [ ⏸ ]   [ ⏹ ]   ↻   [ ● ]          │
│   Pause    Stop   Reset  Restart     │
│                                      │
│ Today total study Hours : 04h 32m    │
│ Today Sessions Count: 3              │
│                                      │
│       [ Open in Floating Timer ]      │
└──────────────────────┬───────────────┘
                       │
                       │ Open in Floating Timer
                       ▼
┌──────────────────────────────────┐
│ 📚 Study Session   ☼  −  □  × > │
├──────────────────────────────────┤
│                                  │
│    ● 01:24:32     ⏸  ⏹  ↻      │
│                                  │
└──────────────────────────────────┘
                       │
             ┌─────────┼─────────┐
             │         │         │
             ▼         ▼         ▼
            [−]       [□]       [>]
             │         │         │
             ▼         ▼         ▼
        Minimize   Maximize    Hide
                       │         │
                       │         ▼
                       │    ┌───────┐
                       │    │   <   │
                       │    └───┬───┘
                       │        │
                       │        ▼
                       │    Restore PiP
                       │
                       ▼
┌──────────────────────────────────────┐
│ 📚 Study Session   ☼  −  □  ×        │
├──────────────────────────────────────┤
│ React JS Complete Course             │
│ Lesson No. 6                         │
│                                      │
│ [ YouTube ] [ Code With Harry ]      │
│                                      │
│ ● 01:24:32                           │
│                                      │
│       [ ▶ ] [ ↻ ] [ ⏹ ] [ ● ]       │
│                                      │
│ Today: 04h 32m                       │
│ Sessions: 3                          │
└──────────────────────────────────────┘
```

### The important distinction

```text
class="btn btn-primary btn-sm" .study-timer-empty .btn + .btn -btn
     │
     ▼
┌──────────────┐
│ FORM MODAL   │   ← NOT PiP yet
└──────┬───────┘
       │ START
       ▼
┌──────────────┐
│ SESSION MODAL│   ← timer + details
└──────┬───────┘
       │ Open in Floating Timer
       ▼
┌──────────────┐
│ FLOATING PiP │   ← normal/minimize/maximize/hide
└──────────────┘
```

### Hide/restore flow

```text
[ Floating PiP ]
       │
       │ click >
       ▼
PiP disappears
       │
       ▼
                         ┌─────┐
                         │  <  │
                         └──┬──┘
                            │
                            │ click <
                            ▼
                    [ Floating PiP ]
```

**Hide means visual hide only.** The timer continues running and the session remains active.

### Maximize flow

```text
[ Normal Floating PiP ]
          │
          │ click □
          ▼
[ Maximized Floating PiP ]
          │
          │ click □
          ▼
[ Normal Floating PiP ]
```

### Single source of truth

```text
                 ┌──────────────────────┐
                 │   STUDY SESSION      │
                 │   SINGLE STATE        │
                 │                      │
                 │ Course                │
                 │ Lesson                │
                 │ Source                │
                 │ Educator              │
                 │ Timer                 │
                 │ Status                │
                 │ Sessions              │
                 └──────────┬───────────┘
                            │
          ┌─────────────────┼──────────────────┐
          ▼                 ▼                  ▼
     Session Modal       Floating PiP      Main Timer
          │                 │                  │
          └─────────────────┼──────────────────┘
                            ▼
                 Statistics + Goal Page
```

So the **modal and floating PiP are two visual representations of the same Study Session**, not two separate timers.
