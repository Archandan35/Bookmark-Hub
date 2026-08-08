import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Clock, TrendingUp, BookOpen, Target, Radar, Info,
  Calendar, ChevronDown, RotateCcw, AlertCircle,
} from 'lucide-react'
import { useAuthStore, useBookmarkStore } from '../hooks/useStore'
import { useSessionStore } from '../hooks/useSessionStore'
import { StudyService } from '../services/StudyService'
import { BookmarkService } from '../services/BookmarkService'
import { CollectionService } from '../services/CollectionService'
import { secureLog } from '../utils/security'

export function Statistics() {
  const { user } = useAuthStore()
  const { bookmarks, collections, setBookmarks, setCollections } = useBookmarkStore()
  const { sessions, activeSession, totalStudySeconds, getTodayStudySeconds, getWeeklyStudySeconds, getMonthlyStudySeconds, setSessions } = useSessionStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState(null)
  const [compareRange, setCompareRange] = useState(null)

  useEffect(() => {
    if (user) loadData()
  }, [user])

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const [sessionsData, bookmarksData, collectionsData] = await Promise.all([
        StudyService.getAll(user.id).catch(() => []),
        BookmarkService.getAll(user.id).catch(() => []),
        CollectionService.getAll(user.id).catch(() => []),
      ])
      setSessions(sessionsData)
      setBookmarks(bookmarksData)
      setCollections(collectionsData)
    } catch (err) {
      setError('Failed to load statistics data. Please try again.')
      secureLog('error', 'Failed to load statistics data', { error: err.message })
    } finally {
      setLoading(false)
    }
  }, [user, setBookmarks, setCollections, setSessions])

  const completedSessions = useMemo(() => {
    return sessions.filter(s => s.status === 'completed' || s.status === 'stopped' || s.status === 'paused')
  }, [sessions])

  const previousSessions = useMemo(() => {
    if (completedSessions.length === 0) return []
    const sortedDates = completedSessions
      .map(s => new Date(s.startTime || s.started_at).getTime())
      .sort((a, b) => a - b)
    if (sortedDates.length === 0) return []
    const earliestDate = sortedDates[0]
    const latestDate = sortedDates[sortedDates.length - 1]
    const periodLength = latestDate - earliestDate
    const previousStart = earliestDate - periodLength
    const previousEnd = earliestDate
    return completedSessions.filter(s => {
      const d = new Date(s.startTime || s.started_at).getTime()
      return d >= previousStart && d < previousEnd
    })
  }, [completedSessions])

  const formatDuration = useCallback((seconds) => {
    if (!seconds || seconds <= 0) return '0m'
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hrs > 0) return `${hrs}h ${mins}m`
    return `${mins}m`
  }, [])

  const calculateDelta = useCallback((current, previous) => {
    if (previous === 0 || previous == null) return current > 0 ? '+100%' : '0%'
    const delta = ((current - previous) / previous) * 100
    const sign = delta >= 0 ? '+' : ''
    return `${sign}${Math.round(delta)}%`
  }, [])

  const totalDuration = useMemo(() => {
    return completedSessions.reduce((sum, s) => sum + (s.elapsedSeconds || s.elapsed_seconds || s.total_duration || 0), 0)
  }, [completedSessions])

  const previousDuration = useMemo(() => {
    return previousSessions.reduce((sum, s) => sum + (s.elapsedSeconds || s.elapsed_seconds || s.total_duration || 0), 0)
  }, [previousSessions])

  const sessionsCount = completedSessions.length
  const previousSessionsCount = previousSessions.length

  const resourcesStudied = useMemo(() => {
    return new Set(completedSessions.map(s => s.bookmark_id).filter(Boolean)).size
  }, [completedSessions])

  const previousResourcesStudied = useMemo(() => {
    return new Set(previousSessions.map(s => s.bookmark_id).filter(Boolean)).size
  }, [previousSessions])

  const avgFocusScore = useMemo(() => {
    if (completedSessions.length === 0) return 0
    let total = 0
    completedSessions.forEach(s => {
      const d = s.total_duration || 0
      if (d > 3600) total += 92
      else if (d > 1800) total += 88
      else if (d > 600) total += 82
      else total += 78
    })
    return Math.round(total / completedSessions.length)
  }, [completedSessions])

  const previousAvgFocusScore = useMemo(() => {
    if (previousSessions.length === 0) return 0
    let total = 0
    previousSessions.forEach(s => {
      const d = s.total_duration || 0
      if (d > 3600) total += 92
      else if (d > 1800) total += 88
      else if (d > 600) total += 82
      else total += 78
    })
    return Math.round(total / previousSessions.length)
  }, [previousSessions])

  const dailyGoalAchievement = useMemo(() => {
    if (completedSessions.length === 0) return 0
    const daysWithSessions = new Set(
      completedSessions.map(s => s.started_at?.split('T')[0])
    ).size
    const totalDays = Math.max(1, (() => {
      const dates = completedSessions.map(s => new Date(s.started_at).getTime()).sort((a, b) => a - b)
      if (dates.length < 2) return 1
      return Math.ceil((dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24))
    })())
    return Math.round((daysWithSessions / totalDays) * 100)
  }, [completedSessions])

  const studyByType = useMemo(() => {
    const typeMap = {
      video: { label: 'Video', color: '#3B82F6' },
      pdf: { label: 'PDF', color: '#8B5CF6' },
      website: { label: 'Website', color: '#14B8A6' },
      note: { label: 'Notes', color: '#F59E0B' },
    }
    const result = {}
    bookmarks.forEach(b => {
      const type = b.type
      const sessionsOfType = completedSessions.filter(s => s.bookmark_id === b.id)
      const duration = sessionsOfType.reduce((sum, s) => sum + (s.total_duration || 0), 0)
      if (!result[type]) {
        result[type] = { label: typeMap[type]?.label || 'Others', color: typeMap[type]?.color || '#D1D5DB', duration }
      } else {
        result[type].duration += duration
      }
    })
    const total = Object.values(result).reduce((sum, t) => sum + t.duration, 0) || 1
    return Object.entries(result).map(([key, val]) => ({
      type: key,
      label: val.label,
      color: val.color,
      hours: val.duration / 3600,
      percent: Math.round((val.duration / total) * 100),
    })).sort((a, b) => b.hours - a.hours)
  }, [completedSessions, bookmarks])

  const studyByDay = useMemo(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const colors = ['#3B82F6', '#8B5CF6', '#14B8A6', '#2DD4BF', '#FB923C', '#F59E0B', '#F97316']
    const result = days.map((day, i) => ({
      day,
      hours: 0,
      percent: 0,
      color: colors[i],
    }))
    completedSessions.forEach(session => {
      const date = new Date(session.started_at)
      const dayIndex = date.getDay()
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1
      result[adjustedIndex].hours += (session.total_duration || 0) / 3600
    })
    const total = result.reduce((sum, d) => sum + d.hours, 0) || 1
    return result.map(d => ({ ...d, percent: Math.round((d.hours / total) * 100) }))
  }, [completedSessions])

  const weeklyData = useMemo(() => {
    if (completedSessions.length === 0) return []
    const sortedDates = completedSessions
      .map(s => new Date(s.started_at).getTime())
      .sort((a, b) => a - b)
    const earliestDate = new Date(sortedDates[0])
    const latestDate = new Date(sortedDates[sortedDates.length - 1])
    const totalDays = Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24))
    const weekCount = Math.max(1, Math.ceil(totalDays / 7))
    const weeks = []
    for (let i = weekCount - 1; i >= 0; i--) {
      const weekEnd = new Date(latestDate)
      weekEnd.setDate(weekEnd.getDate() - i * 7)
      const weekStart = new Date(weekEnd)
      weekStart.setDate(weekStart.getDate() - 6)
      const weekSessions = completedSessions.filter(s => {
        const d = new Date(s.started_at)
        return d >= weekStart && d <= weekEnd
      })
      const hours = weekSessions.reduce((sum, s) => sum + (s.total_duration || 0), 0) / 3600
      weeks.push({
        label: `${weekStart.toLocaleDateString('en-US', { month: 'short' })} ${weekStart.getDate()} - ${weekEnd.getDate()}`,
        hours,
      })
    }
    return weeks
  }, [completedSessions])

  const recentSessions = useMemo(() => {
    return [...completedSessions]
      .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
      .slice(0, 10)
      .map(session => {
        const bookmark = bookmarks.find(b => b.id === session.bookmark_id)
        const duration = session.total_duration || 0
        let focusScore = 78
        if (duration > 3600) focusScore = 92
        else if (duration > 1800) focusScore = 88
        else if (duration > 600) focusScore = 82
        const date = new Date(session.started_at)
        const isToday = date.toDateString() === new Date().toDateString()
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        return {
          id: session.id,
          title: session.bookmark_title || bookmark?.title || 'Unknown Resource',
          category: bookmark ? `${bookmark.type} / Study` : 'Study',
          type: bookmark?.type || 'Video',
          duration,
          durationFormatted: formatDuration(duration),
          time: isToday ? `Today, ${timeStr}` : `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`,
          focusScore,
        }
      })
  }, [completedSessions, bookmarks, formatDuration])

  useMemo(() => {
    if (completedSessions.length === 0 && !dateRange) {
      const now = new Date()
      const start = new Date(now)
      start.setDate(start.getDate() - 30)
      setDateRange(`${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`)
      setCompareRange(`Compare: ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`)
    }
    if (completedSessions.length > 0 && !dateRange) {
      const sortedDates = completedSessions
        .map(s => new Date(s.started_at).getTime())
        .sort((a, b) => a - b)
      const start = new Date(sortedDates[0])
      const end = new Date(sortedDates[sortedDates.length - 1])
      setDateRange(`${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`)
      const periodLength = end.getTime() - start.getTime()
      const prevStart = new Date(start.getTime() - periodLength)
      const prevEnd = new Date(start)
      setCompareRange(`Compare: ${prevStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${prevEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`)
    }
  }, [completedSessions, dateRange])

  const statCards = [
    {
      id: 'study-time',
      label: 'Total Study Time',
      value: formatDuration(totalDuration),
      icon: Clock,
      iconBg: '#EFF6FF',
      iconColor: '#3B82F6',
      delta: calculateDelta(totalDuration, previousDuration),
      showInfo: true,
    },
    {
      id: 'sessions',
      label: 'Sessions',
      value: sessionsCount.toString(),
      icon: TrendingUp,
      iconBg: '#F5F3FF',
      iconColor: '#8B5CF6',
      delta: calculateDelta(sessionsCount, previousSessionsCount),
      showInfo: false,
    },
    {
      id: 'resources',
      label: 'Resources Studied',
      value: resourcesStudied.toString(),
      icon: BookOpen,
      iconBg: '#ECFDF5',
      iconColor: '#10B981',
      delta: calculateDelta(resourcesStudied, previousResourcesStudied),
      showInfo: true,
    },
    {
      id: 'focus',
      label: 'Average Focus Score',
      value: avgFocusScore.toString(),
      unit: '/100',
      icon: Target,
      iconBg: '#FFFBEB',
      iconColor: '#F59E0B',
      delta: calculateDelta(avgFocusScore, previousAvgFocusScore),
      showInfo: true,
    },
    {
      id: 'goal',
      label: 'Daily Goal Achievement',
      value: `${dailyGoalAchievement}%`,
      icon: Radar,
      iconBg: '#F0FDFA',
      iconColor: '#14B8A6',
      delta: '0%',
      showInfo: false,
    },
  ]

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'time-analysis', label: 'Time Analysis' },
    { id: 'content-analysis', label: 'Content Analysis' },
    { id: 'subject-analysis', label: 'Subject Analysis' },
    { id: 'weekly-trends', label: 'Weekly Trends' },
    { id: 'monthly-trends', label: 'Monthly Trends' },
  ]

  if (error) {
    return (
      <div className="statistics-page">
        <div className="statistics-error">
          <AlertCircle size={48} />
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button className="retry-btn" onClick={loadData}>
            <RotateCcw size={16} /> Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="statistics-page">
      {loading && (
        <div className="statistics-loading">
          <div className="stat-cards-grid">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="stat-card-skeleton" />
            ))}
          </div>
        </div>
      )}

      <div className="statistics-content">
        <div className="statistics-header">
          <div className="statistics-header-title">
            <h1 className="statistics-page-title">Study Statistics</h1>
            <p className="statistics-page-subtitle">Track your learning progress and productivity</p>
          </div>
          <div className="statistics-header-controls">
            <button className="statistics-datepicker" type="button">
              <Calendar size={16} />
              <span>{dateRange || 'Select range'}</span>
              <ChevronDown size={14} />
            </button>
            <button className="statistics-compare-btn" type="button">
              <Calendar size={16} />
              <span>{compareRange || 'Compare'}</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        <div className="stat-cards-grid">
              {statCards.map((card) => (
                <div key={card.id} className="stat-metric-card">
                  <div className="stat-metric-label">
                    <span>{card.label}</span>
                    {card.showInfo && <Info size={12} className="stat-info-icon" />}
                  </div>
                  <div className="stat-metric-value-row">
                    <span className="stat-metric-value">{card.value}</span>
                    {card.unit && <span className="stat-metric-unit">{card.unit}</span>}
                    <div className="stat-metric-icon" style={{ backgroundColor: card.iconBg, color: card.iconColor }}>
                      <card.icon size={20} />
                    </div>
                  </div>
                  <div className="stat-metric-delta">
                    <TrendingUp size={12} />
                    <span className="delta-percent">{card.delta}</span>
                    <span className="delta-text"> vs last period</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="statistics-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`statistics-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <>
                <div className="statistics-row">
                  <div className="chart-card combo-chart-card">
                    <div className="chart-card-header">
                      <h3 className="chart-card-title">
                        Study Time Over Time
                        <Info size={12} className="chart-info-icon" />
                      </h3>
                      <div className="chart-legend">
                        <span className="legend-item">
                          <span className="legend-dot solid" style={{ backgroundColor: '#3B82F6' }} />
                          This Period
                        </span>
                        <span className="legend-item">
                          <span className="legend-dot dashed" />
                          Last Period
                        </span>
                      </div>
                    </div>
                    <ComboChartSVG sessions={completedSessions} />
                  </div>

                  <div className="chart-card donut-chart-card">
                    <div className="chart-card-header">
                      <h3 className="chart-card-title">
                        Study Time by Type
                        <Info size={12} className="chart-info-icon" />
                      </h3>
                      <button className="view-all-btn">View All</button>
                    </div>
                    <div className="donut-chart-container">
                      <DonutChartSVG data={studyByType} total={formatDuration(totalDuration)} />
                    </div>
                  </div>
                </div>

                <div className="statistics-row">
                  <div className="chart-card bar-chart-card">
                    <div className="chart-card-header">
                      <h3 className="chart-card-title">
                        Weekly Study Time
                        <Info size={12} className="chart-info-icon" />
                      </h3>
                      <button className="view-all-btn">Hours <ChevronDown size={14} /></button>
                    </div>
                    <BarChartSVG data={weeklyData} />
                  </div>

                  <div className="chart-card donut-chart-card">
                    <div className="chart-card-header">
                      <h3 className="chart-card-title">
                        Study Time by Day
                        <Info size={12} className="chart-info-icon" />
                      </h3>
                      <button className="view-all-btn">Hours <ChevronDown size={14} /></button>
                    </div>
                    <div className="donut-chart-container">
                      <DonutChartSVG data={studyByDay} total={formatDuration(totalDuration)} />
                    </div>
                  </div>
                </div>

                <div className="table-card">
                  <div className="table-card-header">
                    <h3 className="chart-card-title">Recent Sessions</h3>
                    <button className="view-all-btn">View All</button>
                  </div>
                  <table className="sessions-table">
                    <thead>
                      <tr>
                        <th>Resource</th>
                        <th>Type</th>
                        <th>Duration</th>
                        <th>Time</th>
                        <th>Focus Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSessions.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="no-sessions">No study sessions yet</td>
                        </tr>
                      ) : (
                        recentSessions.map((session) => {
                          const focusClass = session.focusScore >= 90 ? 'high' : session.focusScore >= 80 ? 'medium' : 'low'
                          return (
                            <tr key={session.id}>
                              <td>
                                <div className="session-resource">
                                  <div className="session-resource-icon" style={{ backgroundColor: session.type === 'pdf' ? '#FEF2F2' : '#F5F3FF', color: session.type === 'pdf' ? '#EF4444' : '#8B5CF6' }}>
                                    {session.type === 'pdf' ? <FileText size={14} /> : <BookOpen size={14} />}
                                  </div>
                                  <div className="session-resource-text">
                                    <span className="session-resource-title">{session.title}</span>
                                    <span className="session-resource-subtitle">{session.category}</span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="type-badge" style={{ backgroundColor: '#F5F3FF', color: '#7C3AED' }}>
                                  {session.type === 'pdf' ? 'PDF' : session.type === 'video' ? 'Video' : session.type === 'website' ? 'Website' : 'Note'}
                                </span>
                              </td>
                              <td className="session-duration">{session.durationFormatted}</td>
                              <td className="session-time">{session.time}</td>
                              <td>
                                <span className={`focus-badge ${focusClass}`}>{session.focusScore}</span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'time-analysis' && <TimeAnalysisTab sessions={completedSessions} />}
            {activeTab === 'content-analysis' && <ContentAnalysisTab sessions={completedSessions} bookmarks={bookmarks} />}
            {activeTab === 'subject-analysis' && <SubjectAnalysisTab sessions={completedSessions} bookmarks={bookmarks} collections={collections} />}
            {activeTab === 'weekly-trends' && <WeeklyTrendsTab sessions={completedSessions} />}
            {activeTab === 'monthly-trends' && <MonthlyTrendsTab sessions={completedSessions} />}
      </div>
    </div>
  )
}

function TimeAnalysisTab({ sessions }) {
  const hourlyDistribution = useMemo(() => {
    const hours = Array(24).fill(0)
    sessions.forEach(s => {
      const h = new Date(s.started_at).getHours()
      hours[h] += s.total_duration || 0
    })
    const maxVal = Math.max(...hours, 1)
    return hours.map((sec, h) => ({
      hour: h,
      label: `${h.toString().padStart(2, '0')}:00`,
      minutes: Math.round(sec / 60),
      percent: Math.round((sec / maxVal) * 100),
    }))
  }, [sessions])

  const peakHour = useMemo(() => {
    if (sessions.length === 0) return { hour: 0, minutes: 0 }
    const max = hourlyDistribution.reduce((max, h) => h.minutes > max.minutes ? h : max, hourlyDistribution[0])
    return max
  }, [hourlyDistribution, sessions.length])

  const avgSessionLength = useMemo(() => {
    if (sessions.length === 0) return 0
    return Math.round(sessions.reduce((sum, s) => sum + (s.total_duration || 0), 0) / sessions.length / 60)
  }, [sessions])

  const longestSession = useMemo(() => {
    if (sessions.length === 0) return 0
    return Math.round(Math.max(...sessions.map(s => s.total_duration || 0)) / 60)
  }, [sessions])

  const totalMinutes = useMemo(() => {
    return Math.round(sessions.reduce((sum, s) => sum + (s.total_duration || 0), 0) / 60)
  }, [sessions])

  return (
    <div className="tab-content-grid">
      <div className="tab-content-row">
        <div className="chart-card time-dist-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Daily Distribution</h3>
          </div>
          <div className="time-dist-bars">
            {hourlyDistribution.filter((_, i) => i >= 6 && i <= 22).map((h) => (
              <div key={h.hour} className="time-dist-bar-wrapper">
                <div className="time-dist-bar" style={{ height: `${Math.max(2, h.percent)}%` }} />
                <span className="time-dist-label">{h.hour}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="chart-card time-stats-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Session Insights</h3>
          </div>
          <div className="time-stats-grid">
            <div className="time-stat-item">
              <span className="time-stat-value">{avgSessionLength}m</span>
              <span className="time-stat-label">Avg Session</span>
            </div>
            <div className="time-stat-item">
              <span className="time-stat-value">{longestSession}m</span>
              <span className="time-stat-label">Longest Session</span>
            </div>
            <div className="time-stat-item">
              <span className="time-stat-value">{peakHour.hour}:00</span>
              <span className="time-stat-label">Peak Hour</span>
            </div>
            <div className="time-stat-item">
              <span className="time-stat-value">{totalMinutes}m</span>
              <span className="time-stat-label">Total Minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContentAnalysisTab({ sessions, bookmarks }) {
  const typeBreakdown = useMemo(() => {
    const typeMap = {
      video: { label: 'Video', color: '#3B82F6', bg: '#EFF6FF' },
      pdf: { label: 'PDF', color: '#8B5CF6', bg: '#F5F3FF' },
      website: { label: 'Website', color: '#14B8A6', bg: '#ECFDF5' },
      note: { label: 'Notes', color: '#F59E0B', bg: '#FFFBEB' },
    }
    const result = {}
    bookmarks.forEach(b => {
      const type = b.type
      const sOfType = sessions.filter(s => s.bookmark_id === b.id)
      const duration = sOfType.reduce((sum, s) => sum + (s.total_duration || 0), 0)
      const count = sOfType.length
      if (!result[type]) {
        result[type] = { type, label: typeMap[type]?.label || 'Others', color: typeMap[type]?.color || '#D1D5DB', bg: typeMap[type]?.bg || '#F3F4F6', duration, count }
      } else {
        result[type].duration += duration
        result[type].count += count
      }
    })
    const total = Object.values(result).reduce((sum, t) => sum + t.duration, 0) || 1
    return Object.values(result).map(t => ({
      ...t,
      percent: Math.round((t.duration / total) * 100),
      hours: (t.duration / 3600).toFixed(1),
    })).sort((a, b) => b.duration - a.duration)
  }, [sessions, bookmarks])

  const topResources = useMemo(() => {
    return [...sessions]
      .sort((a, b) => (b.total_duration || 0) - (a.total_duration || 0))
      .slice(0, 5)
      .map(s => {
        const b = bookmarks.find(bm => bm.id === s.bookmark_id)
        return {
          title: s.bookmark_title || b?.title || 'Unknown',
          type: b?.type || 'unknown',
          duration: s.total_duration || 0,
        }
      })
  }, [sessions, bookmarks])

  return (
    <div className="tab-content-grid">
      <div className="tab-content-row">
        <div className="chart-card content-breakdown-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Content Type Breakdown</h3>
          </div>
          <div className="content-type-list">
            {typeBreakdown.length === 0 ? (
              <div className="empty-cell">No content data</div>
            ) : (
              typeBreakdown.map((item) => (
                <div key={item.type} className="content-type-row">
                  <div className="content-type-info">
                    <div className="content-type-icon" style={{ backgroundColor: item.bg, color: item.color }}>
                      <span className="content-type-dot" style={{ backgroundColor: item.color }} />
                    </div>
                    <span className="content-type-label">{item.label}</span>
                  </div>
                  <div className="content-type-stats">
                    <span className="content-type-hours">{item.hours}h</span>
                    <span className="content-type-count">{item.count} sessions</span>
                    <span className="content-type-percent">{item.percent}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="chart-card top-resources-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Top Resources</h3>
          </div>
          <div className="top-resources-list">
            {topResources.length === 0 ? (
              <div className="empty-cell">No resources studied</div>
            ) : (
              topResources.map((r, i) => (
                <div key={i} className="top-resource-row">
                  <span className="top-resource-rank">{i + 1}</span>
                  <div className="top-resource-info">
                    <span className="top-resource-title">{r.title}</span>
                    <span className="top-resource-duration">{Math.round(r.duration / 60)}m</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SubjectAnalysisTab({ sessions, bookmarks, collections }) {
  const subjectPerformance = useMemo(() => {
    const subjectMap = {}
    sessions.forEach(s => {
      const bookmark = bookmarks.find(b => b.id === s.bookmark_id)
      const subjectName = collections.find(c => c.id === bookmark?.collection_id)?.name || bookmark?.title || 'Unknown'
      const duration = s.total_duration || 0
      if (!subjectMap[subjectName]) {
        subjectMap[subjectName] = { name: subjectName, duration, sessions: 0, totalFocus: 0 }
      }
      subjectMap[subjectName].duration += duration
      subjectMap[subjectName].sessions += 1
      let focus = 78
      if (duration > 3600) focus = 92
      else if (duration > 1800) focus = 88
      else if (duration > 600) focus = 82
      subjectMap[subjectName].totalFocus += focus
    })
    return Object.values(subjectMap)
      .map(s => ({
        ...s,
        avgFocus: s.sessions > 0 ? Math.round(s.totalFocus / s.sessions) : 0,
        hours: (s.duration / 3600).toFixed(1),
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
  }, [sessions, bookmarks, collections])

  const colors = ['#3B82F6', '#8B5CF6', '#14B8A6', '#F59E0B', '#D1D5DB']

  return (
    <div className="tab-content-grid">
      <div className="chart-card subject-performance-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Subject Performance</h3>
        </div>
        <div className="subject-performance-list">
          {subjectPerformance.length === 0 ? (
            <div className="empty-cell">No subject data</div>
          ) : (
            subjectPerformance.map((subject, i) => (
              <div key={subject.name} className="subject-perf-row">
                <div className="subject-perf-info">
                  <span className="subject-perf-rank" style={{ backgroundColor: colors[i % colors.length] }}>{i + 1}</span>
                  <div className="subject-perf-details">
                    <span className="subject-perf-name">{subject.name}</span>
                    <span className="subject-perf-meta">{subject.sessions} sessions - {subject.hours}h</span>
                  </div>
                </div>
                <div className="subject-perf-score">
                  <span className={`focus-badge ${subject.avgFocus >= 85 ? 'high' : subject.avgFocus >= 75 ? 'medium' : 'low'}`}>
                    {subject.avgFocus}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function WeeklyTrendsTab({ sessions }) {
  const weeklyComparison = useMemo(() => {
    const weeks = []
    const now = new Date()
    for (let i = 3; i >= 0; i--) {
      const weekEnd = new Date(now)
      weekEnd.setDate(weekEnd.getDate() - i * 7)
      const weekStart = new Date(weekEnd)
      weekStart.setDate(weekStart.getDate() - 6)
      const wSessions = sessions.filter(s => {
        const d = new Date(s.started_at)
        return d >= weekStart && d <= weekEnd
      })
      const hours = wSessions.reduce((sum, s) => sum + (s.total_duration || 0), 0) / 3600
      weeks.push({
        label: `${weekStart.toLocaleDateString('en-US', { month: 'short' })} ${weekStart.getDate()} - ${weekEnd.getDate()}`,
        hours: Math.round(hours * 10) / 10,
        sessions: wSessions.length,
        avgFocus: wSessions.length > 0 ? Math.round(wSessions.reduce((sum, s) => {
const d = s.elapsedSeconds || s.elapsed_seconds || s.total_duration || 0
          if (d > 3600) return sum + 92
          if (d > 1800) return sum + 88
          if (d > 600) return sum + 82
          return sum + 78
        }, 0) / wSessions.length) : 0,
      })
    }
    return weeks
  }, [sessions])

  const totalHours = useMemo(() => Math.round(weeklyComparison.reduce((sum, w) => sum + w.hours, 0) * 10) / 10, [weeklyComparison])
  const avgHours = useMemo(() => Math.round((totalHours / Math.max(weeklyComparison.length, 1)) * 10) / 10, [totalHours, weeklyComparison.length])

  return (
    <div className="tab-content-grid">
      <div className="tab-content-row">
        <div className="chart-card weekly-overview-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Weekly Overview</h3>
          </div>
          <div className="weekly-bars-list">
            {weeklyComparison.map((week, i) => (
              <div key={i} className="weekly-bar-row">
                <span className="weekly-bar-label">{week.label}</span>
                <div className="weekly-bar-track">
                  <div className="weekly-bar-fill" style={{ width: `${Math.min(100, (week.hours / Math.max(...weeklyComparison.map(w => w.hours), 1)) * 100)}%` }} />
                </div>
                <span className="weekly-bar-value">{week.hours}h</span>
              </div>
            ))}
          </div>
        </div>
        <div className="chart-card weekly-summary-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Summary</h3>
          </div>
          <div className="weekly-summary-stats">
            <div className="weekly-summary-item">
              <span className="weekly-summary-value">{totalHours}h</span>
              <span className="weekly-summary-label">Total (4 weeks)</span>
            </div>
            <div className="weekly-summary-item">
              <span className="weekly-summary-value">{avgHours}h</span>
              <span className="weekly-summary-label">Avg per Week</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MonthlyTrendsTab({ sessions }) {
  const monthlyData = useMemo(() => {
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const mSessions = sessions.filter(s => {
        const d = new Date(s.started_at)
        return d >= monthDate && d <= monthEnd
      })
      const hours = mSessions.reduce((sum, s) => sum + (s.total_duration || 0), 0) / 3600
      months.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        hours: Math.round(hours * 10) / 10,
        sessions: mSessions.length,
        goals: Math.min(100, Math.round((mSessions.length / 20) * 100)),
      })
    }
    return months
  }, [sessions])

  const maxHours = useMemo(() => Math.max(...monthlyData.map(m => m.hours), 1), [monthlyData])

  return (
    <div className="tab-content-grid">
      <div className="chart-card monthly-trends-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Monthly Overview (6 months)</h3>
        </div>
        <div className="monthly-bars-container">
          {monthlyData.map((month, i) => (
            <div key={i} className="monthly-bar-wrapper">
              <div className="monthly-bar-track">
                <div className="monthly-bar-fill" style={{ height: `${Math.max(2, (month.hours / maxHours) * 100)}%` }} />
              </div>
              <span className="monthly-bar-label">{month.month}</span>
              <span className="monthly-bar-value">{month.hours}h</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ComboChartSVG({ sessions }) {
  const chartData = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return { thisPeriod: [], lastPeriod: [], maxVal: 5, xLabels: [] }
    }

    const sortedSessions = [...sessions].sort((a, b) => new Date(a.started_at) - new Date(b.started_at))
    const earliestDate = new Date(sortedSessions[0].started_at)
    const latestDate = new Date(sortedSessions[sortedSessions.length - 1].started_at)
    const periodLength = latestDate.getTime() - earliestDate.getTime()
    const totalDays = Math.max(1, Math.ceil(periodLength / (1000 * 60 * 60 * 24)))

    const dayCount = Math.min(totalDays, 30)
    const thisPeriod = Array(dayCount).fill(0)

    sortedSessions.forEach(s => {
      const dayIndex = Math.floor((new Date(s.started_at).getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24))
      if (dayIndex >= 0 && dayIndex < dayCount) {
        thisPeriod[dayIndex] += (s.total_duration || 0) / 3600
      }
    })

    const prevStart = new Date(earliestDate.getTime() - periodLength)
    const prevEnd = new Date(earliestDate)
    const lastPeriod = Array(dayCount).fill(0)

    sortedSessions.forEach(s => {
      const sessionDate = new Date(s.started_at)
      if (sessionDate >= prevStart && sessionDate < prevEnd) {
        const dayIndex = Math.floor((sessionDate.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24))
        if (dayIndex >= 0 && dayIndex < dayCount) {
          lastPeriod[dayIndex] += (s.total_duration || 0) / 3600
        }
      }
    })

    const maxVal = Math.max(1, Math.max(...thisPeriod, ...lastPeriod) * 1.2)

    const xLabels = []
    const labelCount = Math.min(5, dayCount)
    for (let i = 0; i < labelCount; i++) {
      const date = new Date(earliestDate)
      date.setDate(date.getDate() + Math.floor(i * (dayCount - 1) / Math.max(1, labelCount - 1)))
      xLabels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    }

    return { thisPeriod, lastPeriod, maxVal, xLabels }
  }, [sessions])

  const width = 552
  const height = 190
  const padding = { top: 10, right: 10, bottom: 30, left: 35 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const pointCount = chartData.thisPeriod.length || 1
  const barWidth = Math.min(14, (chartWidth / pointCount) - 2)
  const barGap = pointCount > 1 ? (chartWidth - barWidth * pointCount) / (pointCount - 1) : 0

  const getY = (val) => padding.top + chartHeight - (val / chartData.maxVal) * chartHeight
  const getX = (i) => padding.left + i * (barWidth + barGap) + barWidth / 2

  const linePoints = chartData.thisPeriod.map((v, i) => ({
    x: getX(i),
    y: getY(v),
  }))

  const lastPoints = chartData.lastPeriod.map((v, i) => ({
    x: getX(i),
    y: getY(v),
  }))

  const linePath = linePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const lastPath = lastPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  const yLabelCount = 5
  const yLabels = Array.from({ length: yLabelCount + 1 }, (_, i) =>
    Math.round((chartData.maxVal / yLabelCount) * i)
  )

  if (chartData.thisPeriod.length === 0) {
    return (
      <div className="combo-chart-empty">
        <p>No session data</p>
      </div>
    )
  }

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="combo-chart-svg">
      {yLabels.map((val, i) => {
        const y = padding.top + chartHeight - (i / yLabelCount) * chartHeight
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#F0F1F4" strokeWidth={1} />
            <text x={padding.left - 6} y={y + 4} fontSize={11} fill="#9CA3AF" textAnchor="end">{val}h</text>
          </g>
        )
      })}
      {chartData.thisPeriod.map((v, i) => {
        const x = padding.left + i * (barWidth + barGap)
        const barH = padding.top + chartHeight - getY(v)
        return <rect key={i} x={x} y={getY(v)} width={barWidth} height={Math.max(0, barH)} rx={2} fill="#BFDBFE" opacity={0.6} />
      })}
      <path d={linePath} stroke="#3B82F6" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {linePoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="white" stroke="#3B82F6" strokeWidth={2} />
      ))}
      {lastPoints.length > 0 && (
        <>
          <path d={lastPath} stroke="#D1D5DB" strokeWidth={1.5} strokeDasharray="4,3" fill="none" />
          {lastPoints.map((p, i) => (
            <circle key={`l-${i}`} cx={p.x} cy={p.y} r={3} fill="white" stroke="#D1D5DB" strokeWidth={1.5} />
          ))}
        </>
      )}
      {chartData.xLabels.map((label, i) => {
        const x = getX(Math.floor(i * (pointCount - 1) / Math.max(1, chartData.xLabels.length - 1)))
        return <text key={i} x={x} y={height - 8} fontSize={11} fill="#9CA3AF" textAnchor="middle">{label}</text>
      })}
    </svg>
  )
}

function DonutChartSVG({ data, total }) {
  const size = 160
  const radius = 80
  const innerRadius = 52
  const center = size / 2
  let startAngle = -90

  if (!data || data.length === 0) {
    return (
      <div className="donut-chart-container">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={center} cy={center} r={radius} fill="#F3F4F6" />
          <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="#9CA3AF">No data</text>
        </svg>
      </div>
    )
  }

  const arcs = data.map((d) => {
    const sliceAngle = (d.percent / 100) * 360
    const endAngle = startAngle + sliceAngle
    const startRad = startAngle * Math.PI / 180
    const endRad = endAngle * Math.PI / 180
    const x1 = center + radius * Math.cos(startRad)
    const y1 = center + radius * Math.sin(startRad)
    const x2 = center + radius * Math.cos(endRad)
    const y2 = center + radius * Math.sin(endRad)
    const largeArc = sliceAngle > 180 ? 1 : 0
    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${center + innerRadius * Math.cos(endRad)} ${center + innerRadius * Math.sin(endRad)} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${center + innerRadius * Math.cos(startRad)} ${center + innerRadius * Math.sin(startRad)} Z`
    startAngle = endAngle
    return { path, color: d.color, label: d.label, percent: d.percent, hours: d.hours }
  })

  return (
    <div className="donut-chart-container">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-svg">
        {arcs.map((arc, i) => (
          <path key={i} d={arc.path} fill={arc.color} stroke="white" strokeWidth={2} />
        ))}
        <text x={center} y={center - 6} textAnchor="middle" fontSize={20} fontWeight={700} fill="#111827">{total}</text>
        <text x={center} y={center + 12} textAnchor="middle" fontSize={12} fontWeight={500} fill="#9CA3AF">Total</text>
      </svg>
      <div className="donut-legend">
        {data.map((item, i) => (
          <div key={i} className="donut-legend-row">
            <span className="donut-legend-dot" style={{ backgroundColor: item.color }} />
            <span className="donut-legend-label">{item.label}</span>
            <span className="donut-legend-value">({item.percent}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarChartSVG({ data }) {
  if (!data || data.length === 0) {
    return <div className="bar-chart-empty">No data available</div>
  }
  const width = 474
  const height = 190
  const padding = { top: 20, right: 10, bottom: 40, left: 35 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const maxVal = Math.max(...data.map(d => d.hours), 16)
  const barWidth = 56
  const gap = (chartWidth - barWidth * data.length) / (data.length - 1)

  const getY = (val) => padding.top + chartHeight - (val / maxVal) * chartHeight

  const yLabels = ['0h', '4h', '8h', '12h', '16h']

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bar-chart-svg">
      {yLabels.map((label, i) => {
        const y = padding.top + chartHeight - (i / (yLabels.length - 1)) * chartHeight
        return (
          <g key={label}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#F0F1F4" strokeWidth={1} />
            <text x={padding.left - 6} y={y + 4} fontSize={11} fill="#9CA3AF" textAnchor="end">{label}</text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const x = padding.left + i * (barWidth + gap)
        const y = getY(d.hours)
        const barHeight = padding.top + chartHeight - y
        const labelHrs = Math.floor(d.hours)
        const labelMins = Math.round((d.hours - labelHrs) * 60)
        return (
          <g key={i}>
            <text x={x + barWidth / 2} y={y - 6} fontSize={13} fontWeight={700} fill="#2563EB" textAnchor="middle">
              {labelHrs}h {labelMins.toString().padStart(2, '0')}m
            </text>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={6} fill="#3B82F6" />
            <text x={x + barWidth / 2} y={height - 10} fontSize={11} fill="#9CA3AF" textAnchor="middle">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
