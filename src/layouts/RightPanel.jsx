import { useState, useEffect, useMemo } from 'react'
import { Play, Pause, Square, Clock, TrendingUp, BarChart3, Video, FileText, Music, Image, Target, Check, CheckCircle, Calendar, Flag, Activity, Flame, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { useSessionStore } from '../hooks/useSessionStore'
import { useBookmarkStore, useAuthStore, useAppStore } from '../hooks/useStore'
import { formatDuration, formatRelativeTime } from '../utils/helpers'
import { Button } from '../components/Button'
import { StudyService } from '../services/StudyService'
import { secureLog } from '../utils/security'
import { Player } from '../components/Player'
import { Viewer } from '../components/Viewer'
import { BOOKMARK_TYPES } from '../constants'
import { useLocation } from 'react-router-dom'

function StatisticsRail({ sessions, bookmarks }) {
  const streakData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const daySessions = sessions.filter(s => s.started_at?.startsWith(dateStr))
       const duration = daySessions.reduce((sum, s) => sum + (s.elapsedSeconds || s.elapsed_seconds || 0), 0)
      days.push({
        date: dateStr,
        short: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1),
        completed: duration >= 30 * 60,
      })
    }
    let streak = 0
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].completed) streak++
      else break
    }
    return { days, streak }
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
      const daySessions = sessions.filter(s => s.started_at?.startsWith(date.toISOString().split('T')[0]))
      let score = 75
      if (daySessions.length > 0) {
        let total = 0
        daySessions.forEach(s => {
          const d = s.elapsedSeconds || s.elapsed_seconds || s.total_duration || 0
          if (d > 3600) total += 92
          else if (d > 1800) total += 88
          else if (d > 600) total += 82
          else total += 78
        })
        score = Math.round(total / daySessions.length)
      }
      points.push({ date: date.toISOString().split('T')[0], score })
    }
    return points
  }, [sessions])

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
      <div className="rail-card streak-card">
        <h3 className="rail-card-title">Current Streak</h3>
        <div className="streak-body">
          <div className="streak-flame-wrap">
            <div className="streak-flame-icon"><Flame size={28} /></div>
            <div className="streak-info">
              <span className="streak-value">{streakData.streak} <span className="streak-unit">Days</span></span>
              <span className="streak-best">Best: 28 Days</span>
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
          <button className="view-details-btn">View Details</button>
        </div>
        <div className="focus-body">
          <div className="focus-chart">
            <FocusScoreSparkline data={focusScoreData} />
          </div>
          <div className="focus-stats">
            <span className="focus-big-value">87</span>
            <span className="focus-caption">Average Score</span>
            <span className="focus-delta">↑ 8% vs last period</span>
          </div>
        </div>
      </div>

      <div className="rail-card subjects-card">
        <div className="subjects-header">
          <h3 className="rail-card-title">Top Subjects</h3>
          <button className="view-details-btn">View All</button>
        </div>
        <div className="subjects-list">
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

  const xLabels = ['May 6', 'May 20', 'Jun 3']
  const xIndices = [0, Math.floor(data.length / 2), data.length - 1]

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
  const [selectedDay, setSelectedDay] = useState(6)

  const donutData = [
    { label: 'Completed', value: 12, percent: 32, color: '#10B981' },
    { label: 'In Progress', value: 20, percent: 52, color: '#3B82F6' },
    { label: 'Not Started', value: 6, percent: 16, color: '#D9DEE7' },
  ]

  const milestones = [
    { id: 1, title: 'Complete UGC NET Paper 1', target: 'May 20, 2025', percent: '25% left', days: 'In 5 days', iconBg: '#E5F6EF', iconColor: '#10B981', badgeColor: '#10B981' },
    { id: 2, title: 'Finish React Hooks Module', target: 'May 25, 2025', percent: '40% left', days: 'In 10 days', iconBg: '#FFF1E0', iconColor: '#F59E0B', badgeColor: '#F59E0B' },
    { id: 3, title: 'Read Atomic Habits', target: 'May 30, 2025', percent: '80% left', days: 'In 15 days', iconBg: '#EFEAFC', iconColor: '#8B5CF6', badgeColor: '#8B5CF6' },
  ]

  const recentlyCompleted = [
    { id: 1, title: 'CSS Flexbox Guide', date: 'May 8, 2025', badge: '2h 15m' },
    { id: 2, title: 'JavaScript Basics', date: 'May 5, 2025', badge: '3h 30m' },
  ]

  const calendarDays = useMemo(() => {
    const days = []
    const year = 2025
    const month = 4
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
  }, [])

  const eventDays = { 3: '#10B981', 13: '#F59E0B', 17: '#10B981', 20: '#8B5CF6', 22: '#8B5CF6', 25: '#EC4899', 26: '#F59E0B' }

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
        <a href="#" className="goals-footer-link">View detailed analytics <ArrowRight size={12} /></a>
      </div>

      <div className="right-panel-card">
        <h3 className="right-panel-title">Goal Calendar</h3>
        <div className="goals-calendar-body">
          <div className="goals-calendar-nav">
            <button className="goals-cal-nav-btn"><ChevronLeft size={16} /></button>
            <span className="goals-cal-month">May 2025</span>
            <button className="goals-cal-nav-btn"><ChevronRight size={16} /></button>
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
        <a href="#" className="goals-footer-link">View full calendar <ArrowRight size={12} /></a>
      </div>

      <div className="right-panel-card">
        <h3 className="right-panel-title">Upcoming Milestones</h3>
        <div className="goals-milestones-list">
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
        <a href="#" className="goals-footer-link">View all milestones <ArrowRight size={12} /></a>
      </div>

      <div className="right-panel-card">
        <h3 className="right-panel-title">Recently Completed</h3>
        <div className="goals-recently-list">
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
        <a href="#" className="goals-footer-link">View all completed <ArrowRight size={12} /></a>
      </div>
    </div>
  )
}

function LearnRail() {
  const [timerSeconds, setTimerSeconds] = useState(5076) // 1:24:36
  const [isTimerRunning, setIsTimerRunning] = useState(true)
  const [pausesTaken, setPausesTaken] = useState(2)
  const [focusScoreData, setFocusScoreData] = useState([65, 55, 72, 68, 85])

  // Study Timer - live countdown
  useEffect(() => {
    let interval = null
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  // Focus Score - simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setFocusScoreData(prev => {
          const newData = [...prev.slice(1), Math.min(100, prev[prev.length - 1] + Math.floor(Math.random() * 10) - 3)]
        return newData
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const formatTimer = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handlePauseTimer = () => {
    setIsTimerRunning(!isTimerRunning)
    if (isTimerRunning) {
      setPausesTaken(prev => prev + 1)
    }
  }

  const handleStopSession = () => {
    setIsTimerRunning(false)
  }

  return (
    <div className="learn-rail">

      {/* Study Timer */}
      <div className="right-panel-card learn-rail-card">
        <div className="learn-rail-header">
          <span className="learn-status-dot" style={{ opacity: isTimerRunning ? 1 : 0.5 }} />
          <h3 className="learn-rail-title">Study Timer</h3>
        </div>
        <div className="learn-timer-display">{formatTimer(timerSeconds)}</div>
        <p className="learn-rail-subtext">Active since 10:15 AM</p>
        <div className="learn-timer-btns">
          <button className="learn-btn-outline-sm" onClick={handlePauseTimer}>
            {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
            <span>{isTimerRunning ? 'Pause' : 'Resume'}</span>
          </button>
          <button className="learn-btn-danger" onClick={handleStopSession}>
            <Square size={14} />
            <span>Stop Session</span>
          </button>
        </div>
        <div className="learn-timer-footer">
          <span>Pauses Taken</span>
          <span>{pausesTaken}</span>
        </div>
      </div>

      {/* Session Details */}
      <div className="right-panel-card learn-rail-card">
        <h3 className="learn-rail-title">Session Details</h3>
        <div className="learn-details-list">
          <div className="learn-detail-row"><span>Started At</span><span>Today, 10:15 AM</span></div>
          <div className="learn-detail-row"><span>Last Active</span><span>Today, 11:39 AM</span></div>
          <div className="learn-detail-row"><span>Total Time</span><span>01:24:36</span></div>
          <div className="learn-detail-row"><span>Break Time</span><span>00:08:15</span></div>
          <div className="learn-detail-row"><span>Completed</span><span>0%</span></div>
          <div className="learn-detail-row"><span>Notes</span><span>12</span></div>
          <div className="learn-detail-row"><span>Bookmarks</span><span>5</span></div>
        </div>
      </div>

      {/* Total Study Hours Today */}
      <div className="right-panel-card learn-rail-card learn-hours-card">
        <div className="learn-hours-icon">🕐</div>
        <div className="learn-hours-text">
          <span className="learn-hours-label">Total Study Hours Today</span>
          <span className="learn-hours-value">3h 45m</span>
        </div>
        <div className="learn-hours-delta">
          <TrendingUp size={10} />
          <span>18% vs yesterday</span>
        </div>
      </div>

      {/* Today's Goal */}
      <div className="right-panel-card learn-rail-card">
        <div className="learn-goal-header">
          <span className="learn-rail-title">Today's Goal</span>
          <span className="learn-goal-target">3h 30m / 5h</span>
        </div>
        <div className="learn-goal-track">
          <div className="learn-goal-fill" style={{ width: '70%' }} />
        </div>
        <span className="learn-goal-percent">70%</span>
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
          <span>Great focus! Keep it up!</span>
        </div>
      </div>

      {/* Session Activity */}
      <div className="right-panel-card learn-rail-card">
        <h3 className="learn-rail-title">Session Activity</h3>
        <div className="learn-activity-list">
          <div className="learn-activity-row"><span>Video Watched</span><span>15:32 / 1:22:45</span></div>
          <div className="learn-activity-row"><span>Notes Added</span><span>12</span></div>
          <div className="learn-activity-row"><span>Bookmarks Added</span><span>5</span></div>
          <div className="learn-activity-row"><span>Resources Opened</span><span>8</span></div>
          <div className="learn-activity-row"><span>Chat Interactions</span><span>6</span></div>
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
  const { activeSession, sessions, elapsedSeconds, pauseSession, resumeSession, stopSession } = useSessionStore()
  const { bookmarks } = useBookmarkStore()
  const [playerFile, setPlayerFile] = useState(null)
  const [viewerFile, setViewerFile] = useState(null)
  const location = useLocation()
  const isGoalsPage = location.pathname === '/goals'
  const isStatisticsPage = location.pathname === '/statistics'
  const isLearnPage = location.pathname === '/learn'

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
    const dateStr = date.toISOString().split('T')[0]
    const daySessions = sessions.filter((s) => {
      const st = s.startTime || s.started_at
      return st?.startsWith(dateStr) && (s.status === 'completed' || s.status === 'stopped')
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

  const currentElapsed = activeSession?.elapsedSeconds || elapsedSeconds || 0
  const currentStatus = activeSession?.status || 'idle'

  const handlePause = async () => {
    if (!activeSession) return
    try {
      pauseSession()
    } catch (err) {
      secureLog('error', 'Failed to pause session', { error: err })
    }
  }

  const handleResume = async () => {
    if (!activeSession) return
    try {
      resumeSession()
    } catch (err) {
      secureLog('error', 'Failed to resume session', { error: err })
    }
  }

  const handleStop = async () => {
    if (!activeSession) return
    try {
      stopSession()
    } catch (err) {
      secureLog('error', 'Failed to stop session', { error: err })
    }
  }

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

  return (
    <aside className="right-panel">
      {activeSession && (
        <div className="right-panel-card">
          <h3 className="right-panel-title">Current Study Session</h3>
          <div className="study-session-card">
            <p className="study-session-file">{activeSession.videoTitle || activeSession.bookmark_title}</p>
            <div className="study-session-timer">{formatDuration(currentElapsed)}</div>
            <div className="study-session-controls">
              {currentStatus === 'active' ? (
                <Button variant="secondary" size="sm" onClick={handlePause}>
                  <Pause size={14} /> Pause
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={handleResume}>
                  <Play size={14} /> Resume
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleStop}>
                <Square size={14} /> Stop
              </Button>
            </div>
          </div>
        </div>
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
    </aside>
  )
}
