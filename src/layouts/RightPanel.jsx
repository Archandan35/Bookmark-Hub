import { useState, useEffect, useMemo } from 'react'
import { Play, Pause, StopCircle, RotateCcw, Clock, TrendingUp, BarChart3, Video, FileText, Music, Image, Check, CheckCircle, Flag, Flame, ChevronLeft, ChevronRight, ArrowRight, Maximize2 } from 'lucide-react'
import { useSessionStore, formatHMS, VIDEO_STATE, sessionSeconds } from '../hooks/useSessionStore'
import { studySessionController } from '../services/studySessionController'
import { useBookmarkStore, useAuthStore, useAppStore } from '../hooks/useStore'
import { formatDuration, formatRelativeTime, localDateStr, parseLocalDate } from '../utils/helpers'
import { Button } from '../components/Button'
import { StudyService } from '../services/StudyService'
import { StudyTimerPanel } from '../components/study/StudyTimerPanel'
import { StartStudyModal } from '../components/study/StartStudyModal'
import { Player } from '../components/Player'
import { Viewer } from '../components/Viewer'
import { BOOKMARK_TYPES } from '../constants'
import { useLocation } from 'react-router-dom'
import { GoalsService } from '../services/GoalsService'
import { useDailyGoal } from '../hooks/useDailyGoal'
import { ExamsRail } from '../components/exam/ExamsRail'
import { Tabs } from '../components/Tabs'
import { Dialog } from '../components/Dialog'

export function focusScoreFor(durationSeconds) {
  const d = durationSeconds || 0
  if (d > 3600) return 92
  if (d > 1800) return 88
  if (d > 600) return 82
  if (d > 0) return 78
  return 0
}

function focusCaption(score) {
  if (!score) return 'Start a session to build your focus score'
  if (score >= 90) return 'Great focus! Keep it up!'
  if (score >= 80) return 'Solid focus this session'
  return 'Try longer uninterrupted sessions'
}

function formatGoalDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function relativeDays(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const diff = Math.ceil((d - new Date()) / 86400000)
  if (diff < 0) return 'Overdue'
  if (diff === 0) return 'Today'
  return `In ${diff} day${diff === 1 ? '' : 's'}`
}

const STREAK_WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function pad2(n) {
  return String(n).padStart(2, '0')
}

function monthCellHours(seconds) {
  const hrs = Math.floor((seconds || 0) / 3600)
  const mins = Math.floor(((seconds || 0) % 3600) / 60)
  if (hrs > 0) return `${hrs}h ${mins}m`
  if (mins > 0) return `${mins}m`
  return '0m'
}

function streakCellInfo(minutes) {
  if (minutes <= 0) return { bg: '#F1F3F9', dark: false }
  if (minutes < 60) return { bg: 'rgb(169, 169, 169)', dark: true }
  if (minutes < 180) return { bg: 'rgb(255, 205, 0)', dark: true }
  if (minutes < 300) return { bg: 'rgb(247, 255, 0)', dark: true }
  return { bg: '#5B3FD6', dark: true }
}

function formatStreakDuration(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  const parts = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0 || h > 0) parts.push(`${m}m`)
  parts.push(`${s}s`)
  return parts.join(' ')
}

function MonthlyStreakCard({ sessions, expandable = true }) {
  const [showFull, setShowFull] = useState(false)
  const now = new Date()
  const [anchor, setAnchor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [viewMode, setViewMode] = useState('month')
  const todayStr = localDateStr(new Date())

  const year = anchor.year
  const month = anchor.month
  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const daySeconds = useMemo(() => {
    const map = {}
    sessions.forEach((s) => {
      const ds = localDateStr(s.startTime || s.started_at)
      if (!ds) return
      const parts = ds.split('-').map(Number)
      if (parts[0] !== year || parts[1] !== month + 1) return
      const secs = sessionSeconds(s)
      if (secs > 0) map[ds] = (map[ds] || 0) + secs
    })
    return map
  }, [sessions, year, month])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7

  const cells = useMemo(() => {
    const list = []
    for (let i = 0; i < firstWeekday; i++) list.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${pad2(month + 1)}-${pad2(d)}`
      const seconds = daySeconds[ds] || 0
      list.push({
        day: d,
        dateStr: ds,
        seconds,
        minutes: Math.round(seconds / 60),
        studied: seconds > 0,
        isToday: ds === todayStr,
        weekday: STREAK_WEEKDAY_LABELS[(firstWeekday + d - 1) % 7],
      })
    }
    while (list.length % 7 !== 0) list.push(null)
    return list
  }, [firstWeekday, daysInMonth, daySeconds, todayStr, year, month])

  const studiedDays = useMemo(
    () => cells.filter(c => c && c.studied).sort((a, b) => a.dateStr.localeCompare(b.dateStr)),
    [cells]
  )

  const totalMonthSeconds = useMemo(() => studiedDays.reduce((sum, c) => sum + c.seconds, 0), [studiedDays])

  const { bestStreak, currentStreak } = useMemo(() => {
    const ord = (ds) => {
      const p = parseLocalDate(ds)
      return p ? Math.floor(p.getTime() / 86400000) : 0
    }
    let best = 0
    let run = 0
    let prev = null
    studiedDays.forEach((c) => {
      const o = ord(c.dateStr)
      if (prev !== null && o - prev === 1) run += 1
      else run = 1
      prev = o
      if (run > best) best = run
    })

    let current = 0
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()
    if (isCurrentMonth) {
      let cursor = new Date()
      const studiedSet = new Set(studiedDays.map(c => c.dateStr))
      if (!studiedSet.has(localDateStr(cursor))) cursor.setDate(cursor.getDate() - 1)
      while (studiedSet.has(localDateStr(cursor))) {
        current += 1
        cursor.setDate(cursor.getDate() - 1)
      }
    }
    return { bestStreak: best, currentStreak: current }
  }, [studiedDays, year, month, now])

  const weeks = useMemo(() => {
    const groups = []
    let week = []
    cells.forEach((c) => {
      week.push(c)
      if (week.length === 7) {
        groups.push(week)
        week = []
      }
    })
    if (week.length) groups.push(week)
    return groups
  }, [cells])

  const navigate = (dir) => {
    setAnchor(({ year: y, month: m }) => {
      let nm = m + dir
      let ny = y
      if (nm < 0) { nm = 11; ny -= 1 }
      if (nm > 11) { nm = 0; ny += 1 }
      return { year: ny, month: nm }
    })
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  return (
    <>
    <div className="chart-card monthly-streak-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">
          <Flame size={14} className="monthly-streak-title-icon" />
          Monthly Streak
          {expandable && (
            <button
              type="button"
              className="monthly-expand-btn"
              onClick={() => setShowFull(true)}
              aria-label="Full view"
              title="Full view"
            >
              <Maximize2 size={14} />
            </button>
          )}
        </h3>
        <div className="chart-card-header-actions">
          <div className="monthly-nav">
            <button type="button" className="monthly-nav-btn" onClick={() => navigate(-1)} aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <span className="monthly-nav-label">{monthName}</span>
            <button
              type="button"
              className="monthly-nav-btn"
              onClick={() => navigate(1)}
              disabled={isCurrentMonth}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <Tabs
            className="monthly-view-tabs"
            tabs={[
              { id: 'month', label: 'Month' },
              { id: 'week', label: 'Week' },
            ]}
            activeTab={viewMode}
            onChange={setViewMode}
          />
        </div>
      </div>

      <div className="monthly-streak-summary">
        <div className="monthly-streak-stat">
          <span className="monthly-streak-stat-label">{isCurrentMonth ? 'Current Streak' : 'Streak'}</span>
          <span className="monthly-streak-stat-value">{isCurrentMonth ? currentStreak : bestStreak} <span className="monthly-streak-stat-unit">days</span></span>
        </div>
        <div className="monthly-streak-stat">
          <span className="monthly-streak-stat-label">Best Streak</span>
          <span className="monthly-streak-stat-value">{bestStreak} <span className="monthly-streak-stat-unit">days</span></span>
        </div>
        <div className="monthly-streak-stat">
          <span className="monthly-streak-stat-label">Study Days</span>
          <span className="monthly-streak-stat-value">{studiedDays.length} <span className="monthly-streak-stat-unit">days</span></span>
        </div>
        <div className="monthly-streak-stat">
          <span className="monthly-streak-stat-label">Total Hours</span>
          <span className="monthly-streak-stat-value">{formatStreakDuration(totalMonthSeconds)}</span>
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="monthly-calendar">
          <div className="monthly-calendar-weekdays">
            {STREAK_WEEKDAY_LABELS.map((w) => (
              <span key={w} className="monthly-calendar-weekday">{w}</span>
            ))}
          </div>
          <div className="monthly-calendar-grid">
            {cells.map((c, i) => {
              if (!c) return <div key={i} className="monthly-calendar-cell empty" />
              const cellInfo = c.isToday && !c.studied
                ? { bg: '#5B3FD6', dark: true }
                : streakCellInfo(c.minutes)
              return (
                <div
                  key={i}
                  className={`monthly-calendar-cell ${c.studied ? 'studied' : ''} ${cellInfo.dark ? 'dark' : ''} ${c.isToday ? 'today' : ''}`}
                  style={{ backgroundColor: cellInfo.bg }}
                  title={`${c.dateStr}: ${monthCellHours(c.seconds)}`}
                >
                  <span className="monthly-calendar-date">{c.day}</span>
                  <span className="monthly-calendar-hours">{c.studied ? monthCellHours(c.seconds) : ''}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="monthly-week-view">
          {weeks.map((week, wi) => {
            const weekSeconds = week.filter(Boolean).reduce((sum, c) => sum + c.seconds, 0)
            return (
              <div key={wi} className="monthly-week-row">
                <div className="monthly-week-cells">
                  {STREAK_WEEKDAY_LABELS.map((w, di) => {
                    const c = week[di]
                    if (!c) return <div key={di} className="monthly-week-cell empty" />
                    const cellInfo = c.isToday && !c.studied
                      ? { bg: '#5B3FD6', dark: true }
                      : streakCellInfo(c.minutes)
                    return (
                      <div
                        key={di}
                        className={`monthly-week-cell ${c.studied ? 'studied' : ''} ${cellInfo.dark ? 'dark' : ''} ${c.isToday ? 'today' : ''}`}
                        style={{ backgroundColor: cellInfo.bg }}
                        title={`${c.dateStr}: ${monthCellHours(c.seconds)}`}
                      >
                        <span className="monthly-week-cell-weekday">{w}</span>
                        <span className="monthly-week-cell-date">{c.day}</span>
                        <span className="monthly-week-cell-hours">{c.studied ? monthCellHours(c.seconds) : '—'}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="monthly-week-total">
                  <span className="monthly-week-total-value">{formatStreakDuration(weekSeconds)}</span>
                  <span className="monthly-week-total-label">Week {wi + 1}</span>
                </div>
              </div>
            )
          })}
          {weeks.length === 0 && <p className="empty-state-desc">No weeks to display</p>}
        </div>
      )}

      <div className="monthly-streak-footer">
        <span>Week starting Monday</span>
        <span className="monthly-streak-legend">
          <span className="monthly-legend-swatch" style={{ backgroundColor: '#F1F3F9' }} />0
          <span className="monthly-legend-swatch" style={{ backgroundColor: 'rgb(169, 169, 169)' }} />1h
          <span className="monthly-legend-swatch" style={{ backgroundColor: 'rgb(255, 205, 0)' }} />3h
          <span className="monthly-legend-swatch" style={{ backgroundColor: 'rgb(247, 255, 0)' }} />5h
          <span className="monthly-legend-swatch" style={{ backgroundColor: '#5B3FD6' }} />7h+
        </span>
      </div>
    </div>
    {expandable && (
      <Dialog isOpen={showFull} onClose={() => setShowFull(false)} title="Monthly Streak" size="lg" className="streak-dialog">
        <MonthlyStreakCard sessions={sessions} expandable={false} />
      </Dialog>
    )}
    </>
  )
}

function StatisticsRail({ sessions, bookmarks }) {
  const streakData = useMemo(() => {
    const dayDuration = {}
    sessions.forEach((s) => {
      const ds = localDateStr(s.startTime || s.started_at)
      if (!ds) return
      dayDuration[ds] = (dayDuration[ds] || 0) + (s.elapsedSeconds || s.elapsed_seconds || s.total_duration || 0)
    })
    const studied = (ds) => (dayDuration[ds] || 0) > 0

    const today = localDateStr(new Date())
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const ds = localDateStr(date)
      days.push({
        date: ds,
        short: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1),
        completed: studied(ds),
      })
    }

    let streak = 0
    const startIndex = studied(today) ? days.length - 1 : days.length - 2
    for (let i = startIndex; i >= 0; i--) {
      if (days[i].completed) streak++
      else break
    }

    const studiedDays = Object.keys(dayDuration).filter(studied).sort()
    const dayOrd = (ds) => Math.floor(new Date(`${ds}T00:00:00`).getTime() / 86400000)
    let best = 0
    let run = 0
    let prevOrd = null
    studiedDays.forEach((ds) => {
      const ord = dayOrd(ds)
      if (prevOrd !== null && ord - prevOrd === 1) run += 1
      else run = 1
      prevOrd = ord
      if (run > best) best = run
    })

    return { days, streak, best: Math.max(best, streak) }
  }, [sessions])

  const heatmapData = useMemo(() => {
    const colorMap = { 0: '#EEF4FF', 1: '#D7E6FE', 2: '#A8C8FC', 3: '#5C9BFA', 4: '#2563EB' }
    const grid = []
    for (let day = 0; day < 7; day++) {
      for (let block = 0; block < 8; block++) {
        const startHour = block * 3
        const daySessions = sessions.filter(session => {
          const d = new Date(session.started_at)
          return d.getDay() === day && d.getHours() >= startHour && d.getHours() < startHour + 3
        })
        const totalMin = daySessions.reduce((sum, s) => sum + (s.elapsedSeconds || s.elapsed_seconds || s.total_duration || 0), 0) / 60
        const intensity = totalMin > 0 ? Math.min(4, Math.max(1, Math.floor(totalMin / 30) + 1)) : 0
        grid.push({ day, block, intensity, color: colorMap[intensity] || colorMap[0] })
      }
    }
    return grid
  }, [sessions])

  const focusScoreData = useMemo(() => {
    const points = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i * 3)
      const dateStr = localDateStr(date)
      const daySessions = sessions.filter(s => localDateStr(s.startTime || s.started_at) === dateStr)
      let score = 0
      if (daySessions.length > 0) {
        const total = daySessions.reduce(
          (sum, s) => sum + focusScoreFor(s.elapsedSeconds || s.elapsed_seconds || s.total_duration || 0),
          0
        )
        score = Math.round(total / daySessions.length)
      }
      points.push({ date: dateStr, score })
    }
    return points
  }, [sessions])

  const focusSummary = useMemo(() => {
    if (focusScoreData.length === 0) return { average: 0, delta: 0 }
    const half = Math.max(1, Math.floor(focusScoreData.length / 2))
    const older = focusScoreData.slice(0, half)
    const recent = focusScoreData.slice(half)
    const avg = (arr) => (arr.length ? Math.round(arr.reduce((s, p) => s + p.score, 0) / arr.length) : 0)
    const recentAvg = avg(recent)
    const olderAvg = avg(older)
    const delta = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0
    return { average: avg(focusScoreData), delta }
  }, [focusScoreData])

  const topSubjects = useMemo(() => {
    const colors = ['#3B82F6', '#8B5CF6', '#14B8A6', '#F59E0B', '#D1D5DB']
    const subjectMap = {}
    bookmarks.forEach(b => {
      const bSessions = sessions.filter(s => s.bookmark_id === b.id)
      const duration = bSessions.reduce((sum, s) => sum + (s.elapsedSeconds || s.elapsed_seconds || s.total_duration || 0), 0)
      const name = b.title || 'Unknown'
      if (duration > 0) {
        if (!subjectMap[name]) subjectMap[name] = { name, duration }
        else subjectMap[name].duration += duration
      }
    })
    const total = Object.values(subjectMap).reduce((sum, s) => sum + s.duration, 0) || 1
    return Object.entries(subjectMap)
      .map(([_, val], i) => ({
        ...val,
        color: colors[i % colors.length],
        percent: Math.round((val.duration / total) * 100),
        hours: val.duration / 3600,
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
  }, [sessions, bookmarks])

  const formatHours = (hrs) => {
    const h = Math.floor(hrs)
    const m = Math.round((hrs - h) * 60)
    return `${h}h ${m}m`
  }

  return (
    <div className="statistics-rail">
      <MonthlyStreakCard sessions={sessions} />
      <div className="rail-card streak-card">
        <h3 className="rail-card-title">Current Streak</h3>
        <div className="streak-body">
          <div className="streak-flame-wrap">
            <div className="streak-flame-icon"><Flame size={28} /></div>
            <div className="streak-info">
              <span className="streak-value">{streakData.streak} <span className="streak-unit">Days</span></span>
              <span className="streak-best">Best: {streakData.best} Days</span>
            </div>
          </div>
          <div className="streak-week-row">
            <div className="streak-day-labels">
              {streakData.days.map((d, i) => (
                <span key={i} className="streak-day-letter">{d.short}</span>
              ))}
            </div>
            <div className="streak-day-circles">
              {streakData.days.map((d, i) => {
                const isToday = i === streakData.days.length - 1
                const status = d.completed ? 'completed' : isToday ? 'today' : 'future'
                return (
                  <div key={i} className={`streak-day-circle ${status}`}>
                    {d.completed && <Check size={12} strokeWidth={2} />}
                  </div>
                )
              })}
            </div>
          </div>
          <p className="streak-footer-text">Keep it up! You're doing great.</p>
        </div>
      </div>

      <div className="rail-card heatmap-card">
        <h3 className="rail-card-title">Time of Day Analysis</h3>
        <div className="heatmap-body">
          <div className="heatmap-grid">
            <div className="heatmap-time-labels">
              {['12 AM', '6 AM', '12 PM', '6 PM', '12 AM'].map((label, i) => (
                <span key={i} className="heatmap-time-label">{label}</span>
              ))}
            </div>
            <div className="heatmap-cells-container">
              <div className="heatmap-day-labels">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                  <span key={i} className="heatmap-day-label">{d}</span>
                ))}
              </div>
              <div className="heatmap-cells-grid">
                {heatmapData.map((cell, i) => (
                  <div key={i} className="heatmap-cell" style={{ backgroundColor: cell.color }} />
                ))}
              </div>
            </div>
          </div>
          <p className="heatmap-footer-text">Darker color = More study time</p>
        </div>
      </div>

      <div className="rail-card focus-card">
        <div className="focus-header">
          <h3 className="rail-card-title">Focus Score Trend</h3>
          <span className="view-details-btn">{sessions.length} sessions</span>
        </div>
        <div className="focus-body">
          <div className="focus-chart">
            <FocusScoreSparkline data={focusScoreData} />
          </div>
          <div className="focus-stats">
            <span className="focus-big-value">{focusSummary.average}</span>
            <span className="focus-caption">Average Score</span>
            <span className="focus-delta">
              {focusSummary.delta >= 0 ? '↑' : '↓'} {Math.abs(focusSummary.delta)}% vs last period
            </span>
          </div>
        </div>
      </div>

      <div className="rail-card subjects-card">
        <div className="subjects-header">
          <h3 className="rail-card-title">Top Subjects</h3>
          <span className="view-details-btn">{topSubjects.length}</span>
        </div>
        <div className="subjects-list">
          {topSubjects.length === 0 && <p className="empty-state-desc">No subject data yet</p>}
          {topSubjects.map((subject, i) => (
            <div key={subject.name + i} className="subject-row">
              <span className="subject-rank">{i + 1}</span>
              <div className="subject-info">
                <div className="subject-name-row">
                  <span className="subject-name">{subject.name}</span>
                  <span className="subject-value">{formatHours(subject.hours)}</span>
                </div>
                <div className="subject-progress-track">
                  <div className="subject-progress-fill" style={{ width: `${subject.percent}%`, backgroundColor: subject.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FocusScoreSparkline({ data }) {
  const width = 150
  const height = 100
  const padding = { top: 10, right: 5, bottom: 20, left: 28 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const yMin = 0
  const yMax = 100

  const getY = (score) => padding.top + chartHeight - ((score - yMin) / (yMax - yMin)) * chartHeight
  const getX = (i) => padding.left + (i / (data.length - 1)) * chartWidth

  const points = data.map((d, i) => ({
    x: getX(i),
    y: getY(d.score),
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`

  const yLabels = ['100', '50', '0']
  const yValues = [100, 50, 0]

  const xIndices = [0, Math.floor(data.length / 2), data.length - 1]
  const xLabels = xIndices.map((idx) => {
    const raw = data[idx]?.date
    if (!raw) return ''
    return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="focus-sparkline-svg">
      <defs>
        <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(34,197,94,0.15)" />
          <stop offset="100%" stopColor="rgba(34,197,94,0)" />
        </linearGradient>
      </defs>
      {yValues.map((val, i) => {
        const y = getY(val)
        return (
          <g key={val}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#F0F1F4" strokeWidth={1} />
            <text x={padding.left - 4} y={y + 3} fontSize={9} fill="#9CA3AF" textAnchor="end">{yLabels[i]}</text>
          </g>
        )
      })}
      <path d={areaPath} fill="url(#focusGradient)" />
      <path d={linePath} stroke="#22C55E" strokeWidth={2} fill="none" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2} fill="#22C55E" />
      ))}
      {xIndices.map((idx, i) => (
        <text key={i} x={getX(idx)} y={height - 4} fontSize={9} fill="#9CA3AF" textAnchor="middle">{xLabels[i]}</text>
      ))}
    </svg>
  )
}

function GoalsRail() {
  const { user } = useAuthStore()
  const [goals, setGoals] = useState([])
  const [milestonesData, setMilestonesData] = useState([])
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [selectedDay, setSelectedDay] = useState(new Date().getDate())

  const sessions = useSessionStore((s) => s.sessions)
  const getSessionHistory = useSessionStore((s) => s.getSessionHistory)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    Promise.all([GoalsService.getAll(user.id), GoalsService.getMilestones(user.id)]).then(
      ([g, m]) => {
        if (cancelled) return
        setGoals(g)
        setMilestonesData(m)
      }
    )
    return () => { cancelled = true }
  }, [user])

  const stats = useMemo(() => GoalsService.computeStats(goals), [goals])

  const donutData = useMemo(() => ([
    { label: 'Completed', value: stats.completed, percent: stats.percentOf(stats.completed), color: '#10B981' },
    { label: 'In Progress', value: stats.inProgress, percent: stats.percentOf(stats.inProgress), color: '#3B82F6' },
    { label: 'Not Started', value: stats.notStarted, percent: stats.percentOf(stats.notStarted), color: '#D9DEE7' },
  ]), [stats])

  const milestones = useMemo(() => milestonesData.slice(0, 3).map((m) => ({
    id: m.id,
    title: m.title,
    target: formatGoalDate(m.target_date),
    percent: `${Math.max(0, 100 - (m.progress || 0))}% left`,
    days: relativeDays(m.target_date),
    iconBg: '#E5F6EF',
    iconColor: m.color || '#10B981',
    badgeColor: m.color || '#10B981',
  })), [milestonesData])

  const recentlyCompleted = useMemo(() => {
    const completedGoals = goals
      .filter((g) => g.completed || g.status === 'completed')
      .sort((a, b) => new Date(b.completed_at || 0) - new Date(a.completed_at || 0))
      .slice(0, 2)
      .map((g) => ({
        id: g.id,
        title: g.title,
        date: formatGoalDate(g.completed_at),
        badge: g.goal_type === 'study_time' ? formatHMS(g.current_value || 0) : `${g.current_value || 0}`,
      }))
    if (completedGoals.length > 0) return completedGoals
    return getSessionHistory(2).map((s) => ({
      id: s.id,
      title: s.videoName || s.videoTitle,
      date: formatGoalDate(s.startTime),
      badge: s.durationFormatted,
    }))
  }, [goals, getSessionHistory, sessions])

  const calendarDays = useMemo(() => {
    const days = []
    const { year, month } = viewMonth
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ day: null, isCurrentMonth: false })
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true })
    }
    return days
  }, [viewMonth])

  const eventDays = useMemo(() => {
    const map = {}
    const { year, month } = viewMonth
    milestonesData.forEach((m) => {
      if (!m.target_date) return
      const d = new Date(m.target_date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        map[d.getDate()] = m.color || '#8B5CF6'
      }
    })
    goals.forEach((g) => {
      if (!g.target_date) return
      const d = new Date(g.target_date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        map[d.getDate()] = map[d.getDate()] || g.progress_color || '#3B82F6'
      }
    })
    return map
  }, [milestonesData, goals, viewMonth])

  const monthLabel = new Date(viewMonth.year, viewMonth.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const shiftMonth = (delta) => {
    setViewMonth((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  return (
    <div className="goals-rail">
      <div className="right-panel-card">
        <h3 className="right-panel-title">Goals Overview</h3>
        <div className="goals-overview-body">
          <GoalsDonutChartSVG data={donutData} />
          <div className="goals-donut-legend">
            {donutData.map((item) => (
              <div key={item.label} className="goals-legend-row">
                <span className="goals-legend-dot" style={{ backgroundColor: item.color }} />
                <span className="goals-legend-label">{item.label}</span>
                <span className="goals-legend-value">{item.value} ({item.percent}%)</span>
              </div>
            ))}
          </div>
        </div>
        <span className="goals-footer-link">{stats.total} goals tracked <ArrowRight size={12} /></span>
      </div>

      <div className="right-panel-card">
        <h3 className="right-panel-title">Goal Calendar</h3>
        <div className="goals-calendar-body">
          <div className="goals-calendar-nav">
            <button className="goals-cal-nav-btn" type="button" onClick={() => shiftMonth(-1)}><ChevronLeft size={16} /></button>
            <span className="goals-cal-month">{monthLabel}</span>
            <button className="goals-cal-nav-btn" type="button" onClick={() => shiftMonth(1)}><ChevronRight size={16} /></button>
          </div>
          <div className="goals-cal-weekdays">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <span key={d} className="goals-cal-weekday">{d}</span>
            ))}
          </div>
          <div className="goals-cal-grid">
            {calendarDays.map((day, i) => (
              <div
                key={i}
                className={`goals-cal-day ${day.isCurrentMonth ? '' : 'out-of-month'} ${selectedDay === day.day ? 'selected' : ''}`}
                onClick={() => day.isCurrentMonth && setSelectedDay(day.day)}
              >
                {day.day && (
                  <>
                    <span className="goals-cal-day-number">{day.day}</span>
                    {eventDays[day.day] && <span className="goals-cal-event-dot" style={{ backgroundColor: eventDays[day.day] }} />}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <span className="goals-footer-link">{Object.keys(eventDays).length} dated items this month <ArrowRight size={12} /></span>
      </div>

      <div className="right-panel-card">
        <h3 className="right-panel-title">Upcoming Milestones</h3>
        <div className="goals-milestones-list">
          {milestones.length === 0 && <p className="empty-state-desc">No upcoming milestones</p>}
          {milestones.map((m) => (
            <div key={m.id} className="goals-milestone-row">
              <div className="goals-milestone-icon" style={{ backgroundColor: m.iconBg, color: m.iconColor }}>
                <Flag size={16} />
              </div>
              <div className="goals-milestone-content">
                <span className="goals-milestone-title">{m.title}</span>
                <span className="goals-milestone-target">Target: {m.target}</span>
              </div>
              <div className="goals-milestone-right">
                <span className="goals-milestone-percent" style={{ color: m.badgeColor }}>{m.percent}</span>
                <span className="goals-milestone-days">{m.days}</span>
              </div>
            </div>
          ))}
        </div>
        <span className="goals-footer-link">{milestonesData.length} milestones <ArrowRight size={12} /></span>
      </div>

      <div className="right-panel-card">
        <h3 className="right-panel-title">Recently Completed</h3>
        <div className="goals-recently-list">
          {recentlyCompleted.length === 0 && <p className="empty-state-desc">Nothing completed yet</p>}
          {recentlyCompleted.map((r) => (
            <div key={r.id} className="goals-recently-row">
              <div className="goals-recently-icon">
                <Check size={16} />
              </div>
              <div className="goals-recently-content">
                <span className="goals-recently-title">{r.title}</span>
                <span className="goals-recently-date">Completed on {r.date}</span>
              </div>
              <span className="goals-recently-badge">{r.badge}</span>
            </div>
          ))}
        </div>
        <span className="goals-footer-link">{stats.completed} completed goals <ArrowRight size={12} /></span>
      </div>
    </div>
  )
}

function LearnRail() {
  const { user } = useAuthStore()
  const { targetSeconds: dailyGoalSeconds } = useDailyGoal(user?.id)
  const activeSession = useSessionStore((s) => s.activeSession)
  const videoState = useSessionStore((s) => s.videoState)
  const rememberPauseChoice = useSessionStore((s) => s.rememberPauseChoice)
  const setRememberPauseChoice = useSessionStore((s) => s.setRememberPauseChoice)
  const getElapsedSeconds = useSessionStore((s) => s.getElapsedSeconds)
  const isTimerRunning = useSessionStore((s) => s.isTimerRunning)
  const getTodayStudySeconds = useSessionStore((s) => s.getTodayStudySeconds)
  const getSessionsCompletedCount = useSessionStore((s) => s.getSessionsCompletedCount)
  const getSessionHistory = useSessionStore((s) => s.getSessionHistory)
  useSessionStore((s) => s.now)
  const railSessions = useSessionStore((s) => s.sessions)

  const focusScoreData = useMemo(() => {
    const recent = getSessionHistory(5).reverse()
    if (recent.length === 0) return [0]
    return recent.map((s) => focusScoreFor(s.elapsedSeconds))
  }, [getSessionHistory, railSessions])

  const elapsed = getElapsedSeconds()
  const running = isTimerRunning()
  const hasVideo = videoState !== VIDEO_STATE.NO_VIDEO
  const stopped = videoState === VIDEO_STATE.STOPPED
  const todaySeconds = getTodayStudySeconds()
  const sessionsCompleted = getSessionsCompletedCount()
  const goalPercent = dailyGoalSeconds > 0
    ? Math.min(100, Math.round((todaySeconds / dailyGoalSeconds) * 100))
    : 0
  const completion = activeSession?.completionPercent || 0

  const handlePauseTimer = () => {
    if (!activeSession) {
      studySessionController.playFromTimer()
      return
    }
    if (running) studySessionController.pauseFromTimer()
    else studySessionController.playFromTimer()
  }

  const handleStopSession = () => { studySessionController.stop() }
  const handleReplaySession = () => { studySessionController.replay() }

  return (
    <div className="learn-rail">

      {/* Study Timer */}
      <div className="right-panel-card learn-rail-card">
        <div className="learn-rail-header">
          <span className="learn-status-dot" style={{ opacity: running ? 1 : 0.5 }} />
          <h3 className="learn-rail-title">Study Timer</h3>
        </div>
        <div className="learn-timer-display">{formatHMS(elapsed)}</div>
        <p className="learn-rail-subtext">
          {activeSession
            ? `Session #${activeSession.sessionNumber} · started ${new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : hasVideo ? 'Ready to start' : 'No video selected'}
        </p>
        <div className="learn-timer-btns">
          <div className="learn-timer-btn-row">
            <button
              className="learn-btn-outline-sm"
              onClick={handlePauseTimer}
              disabled={!hasVideo || (!activeSession && stopped)}
            >
              {running ? <Pause size={14} /> : <Play size={14} />}
              <span>{running ? 'Pause' : activeSession ? 'Resume' : 'Play'}</span>
            </button>
            {stopped && !activeSession ? (
              <button className="learn-btn-danger" onClick={handleReplaySession} disabled={!hasVideo}>
                <RotateCcw size={14} />
                <span>Replay</span>
              </button>
            ) : (
              <button className="learn-btn-danger" onClick={handleStopSession} disabled={!activeSession}>
                <StopCircle size={14} />
                <span>Stop Session</span>
              </button>
            )}
          </div>
          <label className="learn-timer-remember">
            <input
              type="checkbox"
              checked={rememberPauseChoice}
              onChange={(e) => setRememberPauseChoice(e.target.checked)}
            />
            <span>Remember play/pause interval</span>
          </label>
        </div>
        <div className="learn-timer-footer">
          <span>Sessions Completed</span>
          <span>{sessionsCompleted}</span>
        </div>
      </div>

      {/* Session Details */}
      <div className="right-panel-card learn-rail-card">
        <h3 className="learn-rail-title">Session Details</h3>
        <div className="learn-details-list">
          <div className="learn-detail-row">
            <span>Started At</span>
            <span>{activeSession ? new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
          </div>
          <div className="learn-detail-row"><span>Video</span><span>{activeSession?.videoName || '—'}</span></div>
          <div className="learn-detail-row"><span>Folder</span><span>{activeSession?.folderName || '—'}</span></div>
          <div className="learn-detail-row"><span>Total Time</span><span>{formatHMS(elapsed)}</span></div>
          <div className="learn-detail-row"><span>Completed</span><span>{completion}%</span></div>
          <div className="learn-detail-row"><span>Session Number</span><span>{activeSession?.sessionNumber || '—'}</span></div>
          <div className="learn-detail-row"><span>Status</span><span>{running ? 'Running' : activeSession ? 'Paused' : stopped ? 'Stopped' : 'Idle'}</span></div>
        </div>
      </div>

      {/* Total Study Hours Today */}
      <div className="right-panel-card learn-rail-card learn-hours-card">
        <div className="learn-hours-icon">🕐</div>
        <div className="learn-hours-text">
          <span className="learn-hours-label">Total Study Hours Today</span>
          <span className="learn-hours-value">{formatHMS(todaySeconds)}</span>
        </div>
        <div className="learn-hours-delta">
          <TrendingUp size={10} />
          <span>{sessionsCompleted} sessions</span>
        </div>
      </div>

      {/* Today's Goal */}
      <div className="right-panel-card learn-rail-card">
        <div className="learn-goal-header">
          <span className="learn-rail-title">Today's Goal</span>
          <span className="learn-goal-target">{formatHMS(todaySeconds)} / {formatHMS(dailyGoalSeconds)}</span>
        </div>
        <div className="learn-goal-track">
          <div className="learn-goal-fill" style={{ width: `${goalPercent}%` }} />
        </div>
        <span className="learn-goal-percent">{goalPercent}%</span>
      </div>

      {/* Focus Score */}
      <div className="right-panel-card learn-rail-card">
        <div className="learn-focus-header">
          <span className="learn-rail-title">Focus Score</span>
          <span className="learn-focus-score">{focusScoreData[focusScoreData.length - 1]}<span className="learn-focus-max">/100</span></span>
        </div>
        <div className="learn-focus-chart">
          <LearnFocusChartSVG data={focusScoreData} />
        </div>
        <div className="learn-focus-caption">
          <CheckCircle size={14} />
          <span>{focusCaption(focusScoreData[focusScoreData.length - 1])}</span>
        </div>
      </div>

      {/* Session Activity */}
      <div className="right-panel-card learn-rail-card">
        <h3 className="learn-rail-title">Session Activity</h3>
        <div className="learn-activity-list">
          <div className="learn-activity-row"><span>Current Session</span><span>{formatHMS(elapsed)}</span></div>
          <div className="learn-activity-row"><span>Video Completion</span><span>{completion}%</span></div>
          <div className="learn-activity-row"><span>Today</span><span>{formatHMS(todaySeconds)}</span></div>
          <div className="learn-activity-row"><span>Sessions Completed</span><span>{sessionsCompleted}</span></div>
          <div className="learn-activity-row"><span>Timer</span><span>{running ? 'Running' : 'Stopped'}</span></div>
        </div>
      </div>
    </div>
  )
}

function LearnFocusChartSVG({ data = [65, 55, 72, 68, 85] }) {
  const width = 280
  const height = 80
  const padding = 5
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const points = data.map((v, i) => ({
    x: padding + (i / (data.length - 1)) * chartWidth,
    y: padding + chartHeight - (v / 100) * chartHeight,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="learn-focus-svg">
      <path d={linePath} stroke="#6D5CE1" strokeWidth={2} fill="none" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#6D5CE1" />
      ))}
    </svg>
  )
}

function GoalsDonutChartSVG({ data }) {
  const size = 100
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="goals-donut-svg">
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#E7ECF2" strokeWidth={strokeWidth} />
      {data.map((segment, i) => {
        const dashLength = (segment.percent / 100) * circumference
        const dashOffset = -(offset)
        offset += dashLength
        return (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        )
      })}
      <text x={center} y={center - 4} textAnchor="middle" fontSize={22} fontWeight={700} fill="#0B0F1E">68%</text>
      <text x={center} textAnchor="middle" fontSize={10} fontWeight={400} fill="#9CA3AF">
        <tspan x={center} y={center + 10}>Overall</tspan>
        <tspan x={center} y={center + 22}>Progress</tspan>
      </text>
    </svg>
  )
}

export function RightPanel() {
  const { rightPanelOpen } = useAppStore()
  const { user } = useAuthStore()
  const { sessions } = useSessionStore()
  const { bookmarks } = useBookmarkStore()
  const [playerFile, setPlayerFile] = useState(null)
  const [viewerFile, setViewerFile] = useState(null)
  const [showStudySession, setShowStudySession] = useState(true)
  const [showStartStudy, setShowStartStudy] = useState(false)
  const location = useLocation()
  const isGoalsPage = location.pathname === '/goals'
  const isStatisticsPage = location.pathname === '/statistics'
  const isLearnPage = location.pathname === '/learn'
  const isExamsPage = location.pathname === '/exams'

  const recentBookmarks = [...bookmarks]
    .filter(b => b.last_opened_at)
    .sort((a, b) => new Date(b.last_opened_at) - new Date(a.last_opened_at))
    .slice(0, 5)

  const recentSessions = [...sessions]
    .filter(s => s.status === 'completed' || s.status === 'stopped')
    .sort((a, b) => {
      const ta = new Date(a.startTime || a.started_at || 0)
      const tb = new Date(b.startTime || b.started_at || 0)
      return tb - ta
    })
    .slice(0, 4)

  const totalDuration = sessions.reduce((sum, s) => sum + (s.elapsedSeconds || s.elapsed_seconds || s.total_duration || 0), 0)
  const avgDaily = sessions.length > 0 ? totalDuration / 7 : 0

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date
  })

  const weeklyData = last7Days.map((date) => {
    const dateStr = localDateStr(date)
    const daySessions = sessions.filter((s) => {
      const st = s.startTime || s.started_at
      return localDateStr(st) === dateStr && (s.status === 'completed' || s.status === 'stopped')
    })
    const hours = daySessions.reduce((sum, s) => sum + (s.elapsedSeconds || s.elapsed_seconds || s.total_duration || 0), 0) / 3600
    return {
      day: date.toLocaleDateString('en', { weekday: 'short' }).slice(0, 3),
      hours: parseFloat(hours.toFixed(1)),
    }
  })
  const maxHours = Math.max(...weeklyData.map((d) => d.hours), 1)

  const mediaBookmarks = bookmarks.filter(b =>
    ['video', 'audio', 'image', 'pdf', 'markdown'].includes(b.type)
  ).slice(0, 3)

  const completedSessions = sessions.filter(s => s.status === 'completed' || s.status === 'stopped')

  if (isStatisticsPage) {
    return (
      <aside className="right-panel statistics-right-panel">
        <StatisticsRail sessions={completedSessions} bookmarks={bookmarks} />
      </aside>
    )
  }

  if (isGoalsPage) {
    return (
      <aside className="right-panel goals-right-panel">
        <GoalsRail />
      </aside>
    )
  }

  if (isLearnPage) {
    return (
      <aside className="right-panel learn-right-panel">
        <LearnRail />
      </aside>
    )
  }

  if (isExamsPage) {
    return (
      <aside className="right-panel exams-right-panel">
        <ExamsRail />
      </aside>
    )
  }

  return (
    <aside className="right-panel">
      {showStudySession ? (
        <StudyTimerPanel
          compact
          dismissible
          onDismiss={() => setShowStudySession(false)}
          onStartNew={() => setShowStartStudy(true)}
        />
      ) : (
        <button
          className="right-panel-reopen-study"
          onClick={() => setShowStudySession(true)}
          title="Show Study Session card"
        >
          <Play size={14} /> Show Study Session
        </button>
      )}

      {mediaBookmarks.length > 0 && (
        <div className="right-panel-card">
          <h3 className="right-panel-title">Media Player</h3>
          <div className="media-list">
            {mediaBookmarks.map((b) => (
              <div
                key={b.id}
                className="media-item"
                onClick={() => {
                  if ([BOOKMARK_TYPES.VIDEO, BOOKMARK_TYPES.AUDIO].includes(b.type)) {
                    setPlayerFile(b)
                  } else {
                    setViewerFile(b)
                  }
                }}
                role="button"
                tabIndex={0}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     if ([BOOKMARK_TYPES.VIDEO, BOOKMARK_TYPES.AUDIO].includes(b.type)) {
                       setPlayerFile(b)
                     } else {
                       setViewerFile(b)
                     }
                   }
                 }}
              >
                <div className="media-item-icon">
                  {b.type === 'video' && <Video size={14} />}
                  {b.type === 'audio' && <Music size={14} />}
                  {b.type === 'image' && <Image size={14} />}
                  {(b.type === 'pdf' || b.type === 'markdown') && <FileText size={14} />}
                </div>
                <div className="media-item-info">
                  <p className="media-item-name">{b.title}</p>
                  <p className="media-item-type">{b.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {playerFile && (
        <Player
          src={playerFile.url}
          title={playerFile.title}
          onEnded={() => setPlayerFile(null)}
        />
      )}

      {viewerFile && (
        <Viewer file={viewerFile} onClose={() => setViewerFile(null)} />
      )}

      <div className="right-panel-card">
        <h3 className="right-panel-title">Recent Activity</h3>
        <div className="activity-list">
          {recentBookmarks.length === 0 && recentSessions.length === 0 ? (
            <p className="empty-state-desc">No recent activity</p>
          ) : (
            <>
              {recentBookmarks.map((b) => (
                <div key={b.id} className="activity-item">
                  <div className="activity-dot" />
                  <div className="activity-content">
                    <p className="activity-name">{b.title}</p>
                    <p className="activity-meta">
                      Opened &middot; {formatRelativeTime(b.last_opened_at)}
                    </p>
                  </div>
                </div>
              ))}
              {recentSessions.map((s) => (
                <div key={s.id} className="activity-item">
                  <div className="activity-dot" />
                  <div className="activity-content">
                    <p className="activity-name">{s.bookmark_title}</p>
                    <p className="activity-meta">
                      Studied {formatDuration(s.elapsedSeconds || s.elapsed_seconds || s.total_duration || 0)} &middot; {formatRelativeTime(s.startTime || s.started_at)}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="right-panel-card">
        <h3 className="right-panel-title">Study Overview</h3>
        <div className="study-chart">
          {weeklyData.map((d) => (
            <div key={d.day} className="study-chart-bar-wrapper">
              <div
                className="study-chart-bar"
                style={{ '--bar-height': `${(d.hours / maxHours) * 100}%` }}
              />
              <span className="study-chart-label">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="study-stats">
          <div className="study-stat">
            <Clock size={14} />
            <span>Total: {formatDuration(totalDuration)}</span>
          </div>
          <div className="study-stat">
            <TrendingUp size={14} />
            <span>Avg: {formatDuration(Math.floor(avgDaily))}/day</span>
          </div>
          <div className="study-stat">
            <BarChart3 size={14} />
            <span>Sessions: {sessions.length}</span>
          </div>
        </div>
      </div>

      <StartStudyModal
        open={showStartStudy}
        onClose={() => setShowStartStudy(false)}
        onStarted={() => {}}
      />
    </aside>
  )
}
