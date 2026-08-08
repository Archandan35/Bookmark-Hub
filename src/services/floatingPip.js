// Document Picture-in-Picture floating Study Session controller.
//
// A premium lightweight floating panel that is a *visual controller* for the
// single, central Study Session state. The PiP never owns a timer and never
// creates a session — it only reads / issues commands against the shared store.
//
// This component is reached from the Session Modal's "Open in Floating Timer"
// link (see md folder/pip.md §8). By then a study session is already running,
// so the floating window opens directly on the Normal running view.
//
// PiP states (ONE window, four visual states):
//
//   NORMAL    — header "📚 Study Session ☼ − □ × >" + timer ● 01:24:32 + ⏸ ⏹ ↻
//   MINIMIZED — compact floating bar (still visible, movable); header ☼ − □ × >
//   MAXIMIZED — header "📚 Study Session ☼ − □ ×" + metadata + timer + [▶][↻][⏹][●] + stats
//   HIDDEN    — tiny edge tab "<" anchored to the right viewport edge; restores
//
// Transitions:
//   Normal  —(−)→ Minimized   Minimized —(−)→ Normal        (minimize toggle)
//   Normal  —(□)→ Maximized   Maximized —(□)→ Normal       (maximize toggle)
//   any panel —(>)→ Hidden     Hidden —(<)→ restored view
//
// All controller logic runs in the OPENER window context and mutates the PiP
// window's document directly (the pattern recommended by the Document PiP
// spec/MDN). Closing/hiding the PiP never stops the session (pip.md §11/16).
//
// THEME: the PiP theme is COMPLETELY INDEPENDENT from the Bookmark Hub app
// theme. Toggling the PiP's ☼/◐ control only restyles the floating window and
// is persisted under the dedicated localStorage key 'bookmarkHub.pipTheme'. The
// app's theme preference is never touched (the app and PiP may run opposite
// themes simultaneously — pip.md §7).

const NORMAL_W = 300
const NORMAL_H = 190
const MINIMIZED_W = 280
const MINIMIZED_H = 56
const MAXIMIZED_W = 320
const MAXIMIZED_H = 280
const HIDDEN_W = 52
const HIDDEN_H = 52
const DEFAULT_W = NORMAL_W
const DEFAULT_H = NORMAL_H

const PIP_THEME_KEY = 'bookmarkHub.pipTheme'

function isSupported() {
  return typeof window !== 'undefined' && 'documentPictureInPicture' in window
}

function buildPipDocument() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Floating Study Timer</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; overflow: hidden; }
  body {
    font-family: var(--font-family, 'Segoe UI', system-ui, -apple-system, sans-serif);
    background: var(--bg-primary, #0f1117);
    color: var(--color-text-primary, #f1f5f9);
    user-select: none; -webkit-user-select: none;
    padding: 0;
  }
  #app { display: flex; flex-direction: column; height: 100%; }
  body[data-view="normal"] .view.normal,
  body[data-view="minimized"] .view.minimized,
  body[data-view="maximized"] .view.maximized,
  body[data-view="hidden"] .view.hidden { display: flex; }
  .view { display: none; flex-direction: column; height: 100%; }

  .status-glyph { font-size: 12px; line-height: 1; flex: 0 0 auto; }
  .status-glyph.active { color: var(--color-success, #22c55e); animation: pulse 1.4s ease-in-out infinite; }
  .status-glyph.paused { color: var(--color-warning, #f59e0b); }
  .status-glyph.done { color: var(--color-success, #22c55e); }
  .status-glyph.idle { color: var(--color-text-muted, #64748b); }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

  .time { font-variant-numeric: tabular-nums; font-weight: 800; letter-spacing: 0.5px; color: var(--color-text-primary, #f1f5f9); white-space: nowrap; }

  /* ---------- Shared header / panel ---------- */
  .header {
    display: flex; align-items: center; gap: 2px; padding: 3px 6px; flex: 0 0 auto; height: 32px;
    background: var(--bg-tertiary, #232640);
    border-bottom: 1px solid var(--color-border-light, #3a3f5c);
  }
  .header .logo { font-size: 13px; line-height: 1; flex: 0 0 auto; }
  .header .title {
    flex: 1; font-size: 11.5px; font-weight: 700; letter-spacing: 0.2px;
    color: var(--color-text-primary, #f1f5f9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .hbtn {
    width: 26px; height: 26px; flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center;
    background: transparent; color: var(--color-text-secondary, #94a3b8);
    border: none; border-radius: 7px; font-size: 15px; line-height: 1; cursor: pointer;
    transition: background 150ms ease, transform 150ms ease, color 150ms ease;
  }
  .hbtn:hover { background: var(--bg-primary, #0f1117); color: var(--color-text-primary, #f1f5f9); transform: translateY(-1px); }
  .hbtn:active { transform: scale(0.95); }
  .hbtn:focus-visible { outline: 2px solid var(--color-primary, #5b3fd6); outline-offset: 1px; }
  .hbtn.close:hover { background: rgba(239, 68, 68, 0.18); color: var(--color-danger, #ef4444); }
  .hbtn:disabled { opacity: 0.35; cursor: not-allowed; }
  .panel {
    flex: 1; display: flex; flex-direction: column; overflow: hidden;
    background: var(--bg-secondary, #1a1d2e);
    border: 1px solid var(--color-border, #2d3154);
    border-radius: 12px;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.28);
  }

  /* ---------- NORMAL ---------- */
  .view.normal { padding: 6px; gap: 6px; }
  .normal-body { flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 6px 10px; }
  .normal-timer { display: flex; align-items: center; justify-content: center; gap: 8px; }
  .normal-timer .status-glyph { font-size: 15px; }
  .normal-timer .time { font-size: 26px; letter-spacing: 0.5px; }
  .study-status { font-size: 11px; font-weight: 700; text-align: center; }
  .study-status .active { color: var(--color-success, #22c55e); }
  .study-status .paused { color: var(--color-warning, #f59e0b); }
  .study-status .done { color: var(--color-success, #22c55e); }
  .study-status .idle { color: var(--color-text-muted, #64748b); }
  .normal-controls { display: flex; gap: 8px; flex-wrap: nowrap; }

  /* ---------- MINIMIZED ---------- */
  .view.minimized { padding: 0; }
  .min-body { flex: 1; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 0 10px; }
  .min-body .status-glyph { font-size: 15px; }
  .min-body .time { font-size: 17px; }
  .min-body .study-status { font-size: 11px; font-weight: 600; }

  /* ---------- MAXIMIZED ---------- */
  .view.maximized { padding: 6px; gap: 6px; }
  .max-body { flex: 1; display: flex; flex-direction: column; gap: 6px; padding: 6px 10px; }
  .meta { overflow: hidden; }
  .course { font-size: 13px; font-weight: 700; color: var(--color-text-primary, #f1f5f9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lesson { font-size: 11.5px; color: var(--color-text-secondary, #94a3b8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .badges { display: flex; flex-wrap: nowrap; gap: 5px; overflow: hidden; }
  .badge {
    font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 999px;
    background: var(--bg-tertiary, #232640); color: var(--color-text-secondary, #94a3b8);
    border: 1px solid var(--color-border, #2d3154); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .badge.edu { color: var(--color-accent, #7a63f7); }
  .time-wrap { display: flex; align-items: center; justify-content: center; gap: 8px; flex: 0 0 auto; }
  .time-wrap .time { font-size: 32px; letter-spacing: 1px; }
  .status-badge {
    font-size: 9px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 3px 8px; border-radius: 999px; margin-left: auto;
    background: var(--bg-tertiary, #232640); color: var(--color-text-muted, #64748b); border: 1px solid var(--color-border, #2d3154);
  }
  .status-badge.active { color: var(--color-success, #22c55e); }
  .status-badge.paused { color: var(--color-warning, #f59e0b); }
  .status-badge.done { color: var(--color-success, #22c55e); }
  .controls { display: flex; gap: 6px; flex: 0 0 auto; flex-wrap: nowrap; }
  .btn {
    flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 5px;
    border-radius: 10px; border: 1px solid var(--color-border, #2d3154);
    background: var(--bg-tertiary, #232640); color: var(--color-text-primary, #f1f5f9);
    font-size: 12.5px; font-weight: 700; padding: 8px 0; cursor: pointer;
    transition: transform 150ms ease, filter 150ms ease, background 150ms ease;
  }
  .btn:focus-visible { outline: 2px solid var(--color-primary, #5b3fd6); outline-offset: 1px; }
  .btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
  .btn:active { transform: scale(0.97); }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; filter: none; }
  .btn.primary { background: var(--color-primary, #5b3fd6); border-color: transparent; color: #fff; }
  .btn.warn { background: rgba(245, 158, 11, 0.14); border-color: rgba(245, 158, 11, 0.35); color: var(--color-warning, #f59e0b); }
  .btn.danger { background: rgba(239, 68, 68, 0.14); border-color: rgba(239, 68, 68, 0.35); color: var(--color-danger, #ef4444); }
  .btn.replay { background: var(--color-primary, #5b3fd6); border-color: transparent; color: #fff; }
  .stats { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 11px; color: var(--color-text-secondary, #94a3b8); flex: 0 0 auto; }
  .stats strong { color: var(--color-text-primary, #f1f5f9); font-variant-numeric: tabular-nums; }

  /* ---------- HIDDEN edge tab ---------- */
  .tab {
    flex: 1; display: flex; align-items: center; justify-content: center;
    background: var(--bg-secondary, #1a1d2e);
    border: 1px solid var(--color-border, #2d3154); border-radius: 12px;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.28);
  }
  .tab button {
    width: 40px; height: 40px; border-radius: 9px; font-size: 17px; line-height: 1;
    background: var(--bg-tertiary, #232640); border: 1px solid var(--color-border, #2d3154);
    color: var(--color-text-primary, #f1f5f9); cursor: pointer;
    transition: background 150ms ease, transform 150ms ease;
  }
  .tab button:hover { background: var(--color-primary, #5b3fd6); color: #fff; transform: translateY(-1px) scale(1.03); }
  .tab button:active { transform: scale(0.93); }

  /* ---------- toast ---------- */
  .toast {
    position: fixed; left: 10px; right: 10px; bottom: 10px;
    background: var(--bg-tertiary, #232640); color: var(--color-text-primary, #f1f5f9);
    border: 1px solid var(--color-border, #2d3154); border-radius: 10px; padding: 8px 12px; font-size: 11.5px; text-align: center;
    box-shadow: 0 4px 18px rgba(0,0,0,0.28); display: none; z-index: 50;
  }
  .toast.show { display: block; }
</style>
</head>
<body data-view="normal">
<div id="app">
  <!-- NORMAL -->
  <div class="view normal">
    <div class="panel">
      <div class="header">
        <span class="logo">📚</span>
        <span class="title">Study Session</span>
        <button class="hbtn" id="normalThemeBtn" aria-label="Toggle PiP theme" title="Toggle PiP theme">☼</button>
        <button class="hbtn" id="normalMinBtn" aria-label="Minimize" title="Minimize">−</button>
        <button class="hbtn" id="normalMaxBtn" aria-label="Maximize" title="Maximize">□</button>
        <button class="hbtn close" id="normalCloseBtn" aria-label="Close PiP" title="Close floating timer (session continues)">×</button>
        <button class="hbtn" id="normalHideBtn" aria-label="Hide to edge" title="Hide to screen edge">></button>
      </div>
      <div class="normal-body">
        <div class="normal-timer">
          <span class="status-glyph idle" id="normalGlyph">●</span>
          <span class="time" id="normalTime">00:00:00</span>
        </div>
        <div class="normal-controls" id="normalControls">
          <button class="btn primary" id="normalPlayBtn" aria-label="Play / Pause">▶</button>
          <button class="btn danger" id="normalStopBtn" aria-label="Stop and Save Study Session" title="Stop and save">⏹</button>
          <button class="btn warn" id="normalResetBtn" aria-label="Reset Study Session" title="Reset">↻</button>
        </div>
        <div class="study-status" id="normalStatus">IDLE</div>
      </div>
    </div>
  </div>

  <!-- MINIMIZED -->
  <div class="view minimized">
    <div class="panel">
      <div class="header">
        <span class="logo">📚</span>
        <span class="title">Study Session</span>
        <button class="hbtn" id="minThemeBtn" aria-label="Toggle PiP theme" title="Toggle PiP theme">☼</button>
        <button class="hbtn" id="minMinBtn" aria-label="Restore" title="Restore">−</button>
        <button class="hbtn" id="minMaxBtn" aria-label="Maximize" title="Maximize">□</button>
        <button class="hbtn close" id="minCloseBtn" aria-label="Close PiP" title="Close floating timer (session continues)">×</button>
        <button class="hbtn" id="minHideBtn" aria-label="Hide to edge" title="Hide to screen edge">></button>
      </div>
      <div class="min-body">
        <span class="status-glyph idle" id="minGlyph">●</span>
        <span class="time" id="minTime">00:00:00</span>
        <span class="study-status" id="minStatus">IDLE</span>
      </div>
    </div>
  </div>

  <!-- MAXIMIZED -->
  <div class="view maximized">
    <div class="panel">
      <div class="header">
        <span class="logo">📚</span>
        <span class="title">Study Session</span>
        <button class="hbtn" id="maxThemeBtn" aria-label="Toggle PiP theme" title="Toggle PiP theme">☼</button>
        <button class="hbtn" id="maxMinBtn" aria-label="Minimize" title="Minimize">−</button>
        <button class="hbtn" id="maxMaxBtn" aria-label="Restore" title="Restore">□</button>
        <button class="hbtn close" id="maxCloseBtn" aria-label="Close PiP" title="Close floating timer (session continues)">×</button>
      </div>
      <div class="max-body">
        <div class="meta">
          <div class="course" id="maxCourse">Study Session</div>
          <div class="lesson" id="maxLesson">No active session</div>
          <div class="badges" id="maxBadges"></div>
        </div>
        <div class="time-wrap">
          <span class="status-glyph idle" id="maxGlyph">●</span>
          <span class="time" id="maxTime">00:00:00</span>
          <span class="status-badge idle" id="maxBadge">IDLE</span>
        </div>
        <div class="controls" id="maxControls">
          <button class="btn primary" id="maxPlayBtn" aria-label="Play / Pause">▶</button>
          <button class="btn warn" id="maxResetBtn" aria-label="Reset Study Session" title="Reset">↻</button>
          <button class="btn danger" id="maxStopBtn" aria-label="Stop and Save Study Session" title="Stop and save">⏹</button>
          <button class="btn" id="maxNewBtn" aria-label="New Session" title="New Session">➕</button>
        </div>
        <div class="study-status" id="maxStatus">IDLE</div>
        <div class="stats">
          <span>Today: <strong id="todayTotal">0h 0m</strong></span>
          <span>Sessions: <strong id="todaySessions">0</strong></span>
        </div>
      </div>
    </div>
  </div>

  <!-- HIDDEN edge tab -->
  <div class="view hidden">
    <div class="tab">
      <button id="restoreBtn" aria-label="Restore Study Session PiP" title="Restore">‹</button>
    </div>
  </div>
</div>
<div class="toast" id="toast"></div>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Opener-side controller. Runs entirely in the opener window, mutating the
// PiP window's DOM (the reliable, spec-recommended approach).
// ---------------------------------------------------------------------------

function hostStore() {
  try { return window.__bookmarkHubSessionStore || null } catch (e) { return null }
}
function hostController() {
  try { return window.__studySessionController || null } catch (e) { return null }
}

const VIEWS = {
  normal: [NORMAL_W, NORMAL_H],
  minimized: [MINIMIZED_W, MINIMIZED_H],
  maximized: [MAXIMIZED_W, MAXIMIZED_H],
  hidden: [HIDDEN_W, HIDDEN_H],
}

function setupPipController(win) {
  const doc = win.document
  const $ = (id) => doc.getElementById(id)

  let view = 'normal'
  let preHideView = null
  let preMaximizeView = null

  let pipTheme = (function () {
    try {
      const stored = localStorage.getItem(PIP_THEME_KEY)
      if (stored === 'light' || stored === 'dark') return stored
    } catch (e) {}
    return window.document.documentElement.hasAttribute('data-theme') ? 'light' : 'light'
  })()

  function pad(n) { return String(n).padStart(2, '0') }
  function fmtHMS(totalSeconds) {
    const safe = Math.max(0, Math.floor(totalSeconds || 0))
    return pad(Math.floor(safe / 3600)) + ':' + pad(Math.floor((safe % 3600) / 60)) + ':' + pad(safe % 60)
  }
  function fmtHoursMins(totalSeconds) {
    const safe = Math.max(0, Math.floor(totalSeconds || 0))
    return Math.floor(safe / 3600) + 'h ' + String(Math.floor((safe % 3600) / 60)).padStart(2, '0') + 'm'
  }
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }
  function showToast(msg) {
    const t = $('toast')
    t.textContent = msg
    t.classList.add('show')
    clearTimeout(showToast._t)
    showToast._t = setTimeout(() => t.classList.remove('show'), 2200)
  }

  function state() {
    const store = hostStore()
    if (!store) return null
    try {
      const s = store.getState()
      return {
        phase: s.sessionPhase,
        session: s.activeSession || null,
        last: s.lastCompletedSession || null,
        sessions: s.sessions || [],
      }
    } catch (e) { return null }
  }

  function elapsedSeconds(st) {
    try {
      const store = hostStore()
      if (store && store.getState && store.getState().getElapsedSeconds) {
        return store.getState().getElapsedSeconds()
      }
    } catch (e) {}
    const s = st.session
    if (!s) return 0
    return (s.baseElapsedSeconds || 0) + Math.floor((s.accumulatedMs || 0) / 1000)
  }

  function lessonLabel(s) {
    if (!s) return 'No active session'
    const num = s.lessonNumber
    const title = s.lessonTitle
    if (num && title) return 'Lesson No. ' + num + ' · ' + title
    if (num) return 'Lesson No. ' + num
    if (title) return 'Lesson: ' + title
    return 'No active session'
  }

  function courseLabel(s) {
    if (!s) return 'Study Session'
    return s.courseName || s.sourceName || s.lessonTitle || 'Study Session'
  }

  function setGlyph(el, glyph, cls) {
    el.textContent = glyph
    el.className = 'status-glyph ' + cls
  }

  function updatePlay(btn, phase, hasActive, running, completed) {
    btn.classList.remove('replay')
    if (completed) { btn.textContent = '↻'; btn.disabled = !hasActive || view !== 'maximized'; return }
    btn.textContent = running ? '⏸' : '▶'
    btn.disabled = !hasActive
  }

  function render() {
    const st = state()
    if (!st) {
      $('normalTime').textContent = '—'
      $('minTime').textContent = '—'
      $('maxTime').textContent = '—'
      $('maxBadge').textContent = 'OFFLINE'
      return
    }
    const s = st.session
    const phase = st.phase
    const completed = phase === 'completed'
    const hasActive = !!s && phase !== 'completed' && phase !== 'discarded' && phase !== 'idle'
    const running = hasActive && s.runningSince != null

    let elapsed = 0
    if (hasActive) elapsed = elapsedSeconds(st)
    else if (completed && st.last) elapsed = st.last.elapsedSeconds || 0

    let glyph = '●', glyphCls = 'idle', statusLabel = 'IDLE', studyText = 'IDLE'
    if (hasActive && running) { glyph = '●'; glyphCls = 'active'; statusLabel = 'ACTIVE'; studyText = '● Studying' }
    else if (hasActive) { glyph = '●'; glyphCls = 'paused'; statusLabel = 'PAUSED'; studyText = '● Paused' }
    else if (completed) { glyph = '✓'; glyphCls = 'done'; statusLabel = 'COMPLETED'; studyText = '✓ Session Saved' }
    else if (s && !completed) { glyph = '●'; glyphCls = 'idle'; statusLabel = 'IDLE'; studyText = '● Idle' }

    const t = fmtHMS(elapsed)
    $('normalTime').textContent = t
    $('normalGlyph').textContent = glyph
    $('normalStatus').textContent = studyText
    $('normalTime').className = 'time'
    // glyph color classes
    setGlyph($('normalGlyph'), glyph, glyphCls)
    $('normalStatus').className = 'study-status ' + glyphCls
    updatePlay($('normalPlayBtn'), phase, hasActive, running, completed)
    $('normalStopBtn').disabled = !hasActive && !completed && !s
    $('normalResetBtn').disabled = false

    $('minTime').textContent = t
    setGlyph($('minGlyph'), glyph, glyphCls)
    $('minStatus').textContent = studyText
    $('minStatus').className = 'study-status ' + glyphCls

    $('maxTime').textContent = t
    setGlyph($('maxGlyph'), glyph, glyphCls)
    $('maxBadge').className = 'status-badge ' + glyphCls
    $('maxBadge').textContent = statusLabel
    $('maxStatus').className = 'study-status ' + glyphCls
    $('maxStatus').textContent = studyText
    updatePlay($('maxPlayBtn'), phase, hasActive, running, completed)
    $('maxStopBtn').disabled = !hasActive && !completed && !s
    $('maxResetBtn').disabled = false

    const src = completed ? st.last : s
    if (src) {
      $('maxCourse').textContent = courseLabel(src)
      $('maxCourse').title = src.courseName || src.sourceName || src.lessonTitle || ''
      $('maxLesson').textContent = lessonLabel(src)
      $('maxLesson').title = lessonLabel(src)
    } else {
      $('maxCourse').textContent = 'No active session'
      $('maxCourse').title = ''
      $('maxLesson').textContent = 'Start a study session from the PiP or Bookmark Hub.'
      $('maxLesson').title = ''
    }

    const badges = []
    if (src && src.sourceName) badges.push('<span class="badge" title="' + esc(src.sourceName) + '">' + esc(src.sourceName) + '</span>')
    if (src && src.educatorName) badges.push('<span class="badge edu" title="' + esc(src.educatorName) + '">' + esc(src.educatorName) + '</span>')
    $('maxBadges').innerHTML = badges.join('') || ''

    const today = new Date()
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
    let todaySeconds = 0
    let todayCount = 0
    ;(st.sessions || []).forEach((x) => {
      const stDate = x.date || x.started_at || ''
      if ((stDate || '').slice(0, 10) === todayStr) {
        todaySeconds += x.elapsedSeconds || x.elapsed_seconds || 0
        todayCount += 1
      }
    })
    if (s && (s.startTime || '').slice(0, 10) === todayStr) todaySeconds += elapsed
    $('todayTotal').textContent = fmtHoursMins(todaySeconds)
    $('todaySessions').textContent = String(todayCount)
  }

  function onPlay() {
    const st = state()
    if (!st) return
    const c = hostController()
    if (!c) return
    if (st.phase === 'completed') { if (c.replayContinue) c.replayContinue(); return }
    const s = st.session
    if (!s) { showToast('No active session'); return }
    if (s.runningSince != null) c.pause()
    else c.resume()
  }

  function onStop() {
    const st = state()
    const s = st && st.session
    if (!s) return
    const c = hostController()
    if (c && typeof c.stopStudy === 'function') { try { c.stopStudy() } catch (e) {} }
    else if (c) c.pause()
  }

  function onReset() {
    const st = state()
    const s = st && st.session
    if (!s) return
    const c = hostController()
    if (c) {
      try { c.resetSession() } catch (e) {}
      showToast('Session reset')
    }
  }

  function onNewSession() {
    const c = hostController()
    if (!c) return
    // Start a fresh session reusing the last session's metadata.
    try {
      const st = state()
      const last = st && (st.last || st.session)
      const meta = {
        courseName: last?.courseName || '',
        lessonNumber: last?.lessonNumber || null,
        lessonTitle: last?.lessonTitle || '',
        sourceName: last?.sourceName || null,
        educatorName: last?.educatorName || '',
        contentType: last?.contentType || 'video',
        sourceUrl: last?.sourceUrl || '',
        domain: last?.domain || '',
      }
      // Ensure the live session is closed before starting a new one.
      if (st && st.session && st.phase !== 'completed') {
        try { c.stopStudy() } catch (e) {}
      }
      c.startNew(meta)
      showToast('New session started')
    } catch (e) {
      showToast(e?.message || 'Could not start a new session')
    }
  }

  function setView(next) {
    if (next !== 'hidden') {
      if (next !== 'normal' && view !== 'hidden') preMaximizeView = view
      preHideView = next
    }
    view = next
    doc.body.setAttribute('data-view', view)
    const size = VIEWS[view]
    try { win.resizeTo(size[0], size[1]) } catch (e) {}
  }

  function syncThemeTokens() {
    const light = {}, dark = {}
    try {
      for (const sheet of Array.from(window.document.styleSheets)) {
        let rules
        try { rules = sheet.cssRules } catch (e) { continue }
        for (const rule of rules) {
          if (!rule || rule.constructor.name !== 'CSSStyleRule') continue
          const sel = (rule.selectorText || '').trim()
          const target = sel === ':root' ? light : sel === '[data-theme="dark"]' ? dark : null
          if (!target) continue
          for (let i = 0; i < rule.style.length; i++) {
            const name = rule.style[i]
            if (name && name.indexOf('--') === 0) target[name] = rule.style.getPropertyValue(name).trim()
          }
        }
      }
    } catch (e) {}
    let css = ':root{\n'
    for (const k in light) css += '  ' + k + ': ' + light[k] + ';\n'
    css += '}\n[data-theme="dark"]{\n'
    for (const k in dark) css += '  ' + k + ': ' + dark[k] + ';\n'
    css += '}\n'
    let style = doc.getElementById('pip-theme')
    if (!style) { style = doc.createElement('style'); style.id = 'pip-theme'; doc.head.appendChild(style) }
    style.textContent = css
  }

  function applyPipTheme() {
    if (pipTheme === 'dark') doc.documentElement.setAttribute('data-theme', 'dark')
    else doc.documentElement.removeAttribute('data-theme')
    const isDark = pipTheme === 'dark'
    const icon = isDark ? '◐' : '☼'
    const tip = isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'
    for (const id of ['normalThemeBtn', 'minThemeBtn', 'maxThemeBtn']) {
      const b = $(id)
      if (b) { b.textContent = icon; b.title = tip }
    }
  }

  function togglePipTheme() {
    pipTheme = pipTheme === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem(PIP_THEME_KEY, pipTheme) } catch (e) {}
    applyPipTheme()
  }

  // --- header button wiring ---
  for (const id of ['normalThemeBtn', 'minThemeBtn', 'maxThemeBtn']) {
    const b = $(id)
    if (b) b.addEventListener('click', togglePipTheme)
  }
  // − (minimize): normal↔minimized toggle; from maximized → minimized
  for (const id of ['normalMinBtn', 'maxMinBtn']) {
    const b = $(id)
    if (b) b.addEventListener('click', () => setView(view === 'minimized' ? 'normal' : 'minimized'))
  }
  for (const id of ['minMinBtn']) {
    const b = $(id)
    if (b) b.addEventListener('click', () => setView('normal'))
  }
  // □ (maximize toggle): normal↔maximized; from minimized → maximized
  for (const id of ['normalMaxBtn', 'minMaxBtn', 'maxMaxBtn']) {
    const b = $(id)
    if (b) b.addEventListener('click', () => {
      if (view === 'maximized') setView(preMaximizeView || 'normal')
      else { preMaximizeView = view; setView('maximized') }
    })
  }
  // > (hide to edge): visible states → hidden
  for (const id of ['normalHideBtn', 'minHideBtn']) {
    const b = $(id)
    if (b) b.addEventListener('click', () => { preHideView = view; setView('hidden') })
  }
  // × (close)
  for (const id of ['normalCloseBtn', 'minCloseBtn', 'maxCloseBtn']) {
    const b = $(id)
    if (b) b.addEventListener('click', closeFloatingTimer)
  }
  // controls
  $('normalPlayBtn').addEventListener('click', onPlay)
  $('normalStopBtn').addEventListener('click', onStop)
  $('normalResetBtn').addEventListener('click', onReset)
  $('maxPlayBtn').addEventListener('click', onPlay)
  $('maxStopBtn').addEventListener('click', onStop)
  $('maxResetBtn').addEventListener('click', onReset)
  if ($('maxNewBtn')) $('maxNewBtn').addEventListener('click', onNewSession)
  const restoreBtn = $('restoreBtn')
  if (restoreBtn) restoreBtn.addEventListener('click', () => setView(preHideView || 'normal'))

  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && view === 'hidden') setView(preHideView || 'normal')
  })

  syncThemeTokens()
  applyPipTheme()
  try {
    new MutationObserver(() => { syncThemeTokens(); applyPipTheme() }).observe(window.document.documentElement, {
      attributes: true, attributeFilter: ['data-theme'],
    })
  } catch (e) {}
  win.addEventListener('storage', (e) => {
    if (e.key === 'bookmarkhub_theme') syncThemeTokens()
  })

  // The floating PiP opens on the Normal running view (a session is active by
  // the time it is launched from the modal).
  setView('normal')
  const timer = setInterval(render, 250)
  render()
  win.addEventListener('pagehide', () => clearInterval(timer))
  win.addEventListener('close', () => clearInterval(timer))
}

let pipWindow = null
let pipOpenResolve = null

function wireCloseHandlers(win) {
  win.addEventListener('pagehide', () => { if (pipWindow === win) pipWindow = null })
  win.addEventListener('close', () => {
    if (pipWindow === win) pipWindow = null
    if (pipOpenResolve) {
      const resolve = pipOpenResolve
      pipOpenResolve = null
      resolve({ closed: true, reason: 'pip-closed' })
    }
  })
}

/**
 * Open the floating timer in a Document Picture-in-Picture window.
 * Returns { supported, window, reopened } — never throws when unsupported.
 */
export async function openFloatingTimer() {
  if (!isSupported()) {
    return { supported: false, reason: 'unsupported' }
  }
  if (pipWindow && !pipWindow.closed) {
    pipWindow.focus()
    return { supported: true, window: pipWindow, reopened: true }
  }
  try {
    const win = await window.documentPictureInPicture.requestWindow({
      width: DEFAULT_W,
      height: DEFAULT_H,
      preferInitialWindowPlacement: true,
    })
    win.document.title = 'Floating Study Timer'
    win.document.open()
    win.document.write(buildPipDocument())
    win.document.close()
    setupPipController(win)
    pipWindow = win
    wireCloseHandlers(win)
    if (pipOpenResolve) {
      const resolve = pipOpenResolve
      pipOpenResolve = null
      resolve({ closed: false, window: win })
    }
    return { supported: true, window: win }
  } catch (err) {
    return { supported: true, reason: 'error', error: err }
  }
}

/** Called by UI when the app wants to proactively close the PiP window. */
export function closeFloatingTimer() {
  if (pipWindow && !pipWindow.closed) {
    try { pipWindow.close() } catch { /* ignore */ }
  }
  pipWindow = null
}

/** Promise that resolves when the PiP window closes (for UI callbacks). */
export function onFloatingTimerClosed() {
  if (pipWindow && !pipWindow.closed) {
    return new Promise((resolve) => { pipOpenResolve = resolve })
  }
  return Promise.resolve({ closed: true, reason: 'no-window' })
}

export const floatingPip = {
  isSupported,
  open: openFloatingTimer,
  close: closeFloatingTimer,
  onClosed: onFloatingTimerClosed,
}

export default floatingPip
