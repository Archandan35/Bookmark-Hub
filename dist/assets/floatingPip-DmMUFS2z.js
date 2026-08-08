const U="bookmarkHub.pipTheme";function X(){return typeof window<"u"&&"documentPictureInPicture"in window}function te(){return`<!DOCTYPE html>
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
</html>`}function V(){try{return window.__bookmarkHubSessionStore||null}catch{return null}}function B(){try{return window.__studySessionController||null}catch{return null}}const ne={normal:[300,190],minimized:[280,56],maximized:[320,280],hidden:[52,52]};function oe(s){const c=s.document,o=e=>c.getElementById(e);let p="normal",S=null,T=null,y=(function(){try{const e=localStorage.getItem(U);if(e==="light"||e==="dark")return e}catch{}return window.document.documentElement.hasAttribute("data-theme"),"light"})();function k(e){return String(e).padStart(2,"0")}function q(e){const t=Math.max(0,Math.floor(e||0));return k(Math.floor(t/3600))+":"+k(Math.floor(t%3600/60))+":"+k(t%60)}function K(e){const t=Math.max(0,Math.floor(e||0));return Math.floor(t/3600)+"h "+String(Math.floor(t%3600/60)).padStart(2,"0")+"m"}function E(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function h(e){const t=o("toast");t.textContent=e,t.classList.add("show"),clearTimeout(h._t),h._t=setTimeout(()=>t.classList.remove("show"),2200)}function w(){const e=V();if(!e)return null;try{const t=e.getState();return{phase:t.sessionPhase,session:t.activeSession||null,last:t.lastCompletedSession||null,sessions:t.sessions||[]}}catch{return null}}function $(e){try{const n=V();if(n&&n.getState&&n.getState().getElapsedSeconds)return n.getState().getElapsedSeconds()}catch{}const t=e.session;return t?(t.baseElapsedSeconds||0)+Math.floor((t.accumulatedMs||0)/1e3):0}function H(e){if(!e)return"No active session";const t=e.lessonNumber,n=e.lessonTitle;return t&&n?"Lesson No. "+t+" · "+n:t?"Lesson No. "+t:n?"Lesson: "+n:"No active session"}function J(e){return e&&(e.courseName||e.sourceName||e.lessonTitle)||"Study Session"}function N(e,t,n){e.textContent=t,e.className="status-glyph "+n}function _(e,t,n,i,a){if(e.classList.remove("replay"),a){e.textContent="↻",e.disabled=!n||p!=="maximized";return}e.textContent=i?"⏸":"▶",e.disabled=!n}function R(){const e=w();if(!e){o("normalTime").textContent="—",o("minTime").textContent="—",o("maxTime").textContent="—",o("maxBadge").textContent="OFFLINE";return}const t=e.session,n=e.phase,i=n==="completed",a=!!t&&n!=="completed"&&n!=="discarded"&&n!=="idle",v=a&&t.runningSince!=null;let u=0;a?u=$(e):i&&e.last&&(u=e.last.elapsedSeconds||0);let f="●",d="idle",b="IDLE",m="IDLE";a&&v?(f="●",d="active",b="ACTIVE",m="● Studying"):a?(f="●",d="paused",b="PAUSED",m="● Paused"):i?(f="✓",d="done",b="COMPLETED",m="✓ Session Saved"):t&&!i&&(f="●",d="idle",b="IDLE",m="● Idle");const L=q(u);o("normalTime").textContent=L,o("normalGlyph").textContent=f,o("normalStatus").textContent=m,o("normalTime").className="time",N(o("normalGlyph"),f,d),o("normalStatus").className="study-status "+d,_(o("normalPlayBtn"),n,a,v,i),o("normalStopBtn").disabled=!a&&!i&&!t,o("normalResetBtn").disabled=!1,o("minTime").textContent=L,N(o("minGlyph"),f,d),o("minStatus").textContent=m,o("minStatus").className="study-status "+d,o("maxTime").textContent=L,N(o("maxGlyph"),f,d),o("maxBadge").className="status-badge "+d,o("maxBadge").textContent=b,o("maxStatus").className="study-status "+d,o("maxStatus").textContent=m,_(o("maxPlayBtn"),n,a,v,i),o("maxStopBtn").disabled=!a&&!i&&!t,o("maxResetBtn").disabled=!1;const r=i?e.last:t;r?(o("maxCourse").textContent=J(r),o("maxCourse").title=r.courseName||r.sourceName||r.lessonTitle||"",o("maxLesson").textContent=H(r),o("maxLesson").title=H(r)):(o("maxCourse").textContent="No active session",o("maxCourse").title="",o("maxLesson").textContent="Start a study session from the PiP or Bookmark Hub.",o("maxLesson").title="");const P=[];r&&r.sourceName&&P.push('<span class="badge" title="'+E(r.sourceName)+'">'+E(r.sourceName)+"</span>"),r&&r.educatorName&&P.push('<span class="badge edu" title="'+E(r.educatorName)+'">'+E(r.educatorName)+"</span>"),o("maxBadges").innerHTML=P.join("")||"";const z=new Date,j=z.getFullYear()+"-"+String(z.getMonth()+1).padStart(2,"0")+"-"+String(z.getDate()).padStart(2,"0");let D=0,G=0;(e.sessions||[]).forEach(M=>{(M.date||M.started_at||""||"").slice(0,10)===j&&(D+=M.elapsedSeconds||M.elapsed_seconds||0,G+=1)}),t&&(t.startTime||"").slice(0,10)===j&&(D+=u),o("todayTotal").textContent=K(D),o("todaySessions").textContent=String(G)}function A(){const e=w();if(!e)return;const t=B();if(!t)return;if(e.phase==="completed"){t.replayContinue&&t.replayContinue();return}const n=e.session;if(!n){h("No active session");return}n.runningSince!=null?t.pause():t.resume()}function W(){const e=w();if(!(e&&e.session))return;const n=B();if(n&&typeof n.stopStudy=="function")try{n.stopStudy()}catch{}else n&&n.pause()}function O(){const e=w();if(!(e&&e.session))return;const n=B();if(n){try{n.resetSession()}catch{}h("Session reset")}}function Q(){const e=B();if(e)try{const t=w(),n=t&&(t.last||t.session),i={courseName:(n==null?void 0:n.courseName)||"",lessonNumber:(n==null?void 0:n.lessonNumber)||null,lessonTitle:(n==null?void 0:n.lessonTitle)||"",sourceName:(n==null?void 0:n.sourceName)||null,educatorName:(n==null?void 0:n.educatorName)||"",contentType:(n==null?void 0:n.contentType)||"video",sourceUrl:(n==null?void 0:n.sourceUrl)||"",domain:(n==null?void 0:n.domain)||""};if(t&&t.session&&t.phase!=="completed")try{e.stopStudy()}catch{}e.startNew(i),h("New session started")}catch(t){h((t==null?void 0:t.message)||"Could not start a new session")}}function x(e){e!=="hidden"&&(e!=="normal"&&p!=="hidden"&&(T=p),S=e),p=e,c.body.setAttribute("data-view",p);const t=ne[p];try{s.resizeTo(t[0],t[1])}catch{}}function C(){const e={},t={};try{for(const a of Array.from(window.document.styleSheets)){let v;try{v=a.cssRules}catch{continue}for(const u of v){if(!u||u.constructor.name!=="CSSStyleRule")continue;const f=(u.selectorText||"").trim(),d=f===":root"?e:f==='[data-theme="dark"]'?t:null;if(d)for(let b=0;b<u.style.length;b++){const m=u.style[b];m&&m.indexOf("--")===0&&(d[m]=u.style.getPropertyValue(m).trim())}}}}catch{}let n=`:root{
`;for(const a in e)n+="  "+a+": "+e[a]+`;
`;n+=`}
[data-theme="dark"]{
`;for(const a in t)n+="  "+a+": "+t[a]+`;
`;n+=`}
`;let i=c.getElementById("pip-theme");i||(i=c.createElement("style"),i.id="pip-theme",c.head.appendChild(i)),i.textContent=n}function I(){y==="dark"?c.documentElement.setAttribute("data-theme","dark"):c.documentElement.removeAttribute("data-theme");const e=y==="dark",t=e?"◐":"☼",n=e?"Switch to Light Theme":"Switch to Dark Theme";for(const i of["normalThemeBtn","minThemeBtn","maxThemeBtn"]){const a=o(i);a&&(a.textContent=t,a.title=n)}}function ee(){y=y==="dark"?"light":"dark";try{localStorage.setItem(U,y)}catch{}I()}for(const e of["normalThemeBtn","minThemeBtn","maxThemeBtn"]){const t=o(e);t&&t.addEventListener("click",ee)}for(const e of["normalMinBtn","maxMinBtn"]){const t=o(e);t&&t.addEventListener("click",()=>x(p==="minimized"?"normal":"minimized"))}for(const e of["minMinBtn"]){const t=o(e);t&&t.addEventListener("click",()=>x("normal"))}for(const e of["normalMaxBtn","minMaxBtn","maxMaxBtn"]){const t=o(e);t&&t.addEventListener("click",()=>{p==="maximized"?x(T||"normal"):(T=p,x("maximized"))})}for(const e of["normalHideBtn","minHideBtn"]){const t=o(e);t&&t.addEventListener("click",()=>{S=p,x("hidden")})}for(const e of["normalCloseBtn","minCloseBtn","maxCloseBtn"]){const t=o(e);t&&t.addEventListener("click",Y)}o("normalPlayBtn").addEventListener("click",A),o("normalStopBtn").addEventListener("click",W),o("normalResetBtn").addEventListener("click",O),o("maxPlayBtn").addEventListener("click",A),o("maxStopBtn").addEventListener("click",W),o("maxResetBtn").addEventListener("click",O),o("maxNewBtn")&&o("maxNewBtn").addEventListener("click",Q);const F=o("restoreBtn");F&&F.addEventListener("click",()=>x(S||"normal")),c.addEventListener("keydown",e=>{e.key==="Escape"&&p==="hidden"&&x(S||"normal")}),C(),I();try{new MutationObserver(()=>{C(),I()}).observe(window.document.documentElement,{attributes:!0,attributeFilter:["data-theme"]})}catch{}s.addEventListener("storage",e=>{e.key==="bookmarkhub_theme"&&C()}),x("normal");const Z=setInterval(R,250);R(),s.addEventListener("pagehide",()=>clearInterval(Z)),s.addEventListener("close",()=>clearInterval(Z))}let l=null,g=null;function se(s){s.addEventListener("pagehide",()=>{l===s&&(l=null)}),s.addEventListener("close",()=>{if(l===s&&(l=null),g){const c=g;g=null,c({closed:!0,reason:"pip-closed"})}})}async function ae(){if(!X())return{supported:!1,reason:"unsupported"};if(l&&!l.closed)return l.focus(),{supported:!0,window:l,reopened:!0};try{const s=await window.documentPictureInPicture.requestWindow({width:300,height:190,preferInitialWindowPlacement:!0});if(s.document.title="Floating Study Timer",s.document.open(),s.document.write(te()),s.document.close(),oe(s),l=s,se(s),g){const c=g;g=null,c({closed:!1,window:s})}return{supported:!0,window:s}}catch(s){return{supported:!0,reason:"error",error:s}}}function Y(){if(l&&!l.closed)try{l.close()}catch{}l=null}function ie(){return l&&!l.closed?new Promise(s=>{g=s}):Promise.resolve({closed:!0,reason:"no-window"})}const le={isSupported:X,open:ae,close:Y,onClosed:ie};export{Y as closeFloatingTimer,le as default,le as floatingPip,ie as onFloatingTimerClosed,ae as openFloatingTimer};
