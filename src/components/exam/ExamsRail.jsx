import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, Clock3, Timer, BarChart3, FileText, CheckCircle2,
  Lightbulb, Activity, Pencil, RotateCcw, Trash2, List,
  ChevronDown, ChevronLeft, ChevronRight, Maximize2,
} from 'lucide-react'
import { Dialog } from '../Dialog'
import { useExamStore, useExamNow, formatExamActivityTime } from '../../hooks/useExamStore'
import { localDateStr, cn } from '../../utils/helpers'
import {
  daysLeft, deriveStatus, STATUS_META, filterExams, sortExams, computeExamStats,
  formatExamDate, formatExamTime,
} from '../../services/ExamService'

const STUDY_TIPS = [
  'Break big goals into small daily targets. Consistency beats intensity!',
  'Revise within 24 hours of learning — recall strengthens memory.',
  'Practice previous-year papers under timed conditions every week.',
  'Teach a concept to someone else to master it twice as fast.',
  'Sleep 7–8 hours before an exam; a rested brain recalls better.',
  'Make short notes for the last 7 days — skim, don’t re-read everything.',
  'Attempt mock tests and analyse every mistake the same day.',
]

const ACT_META = {
  added: { icon: FileText, bg: '#E6F1FE', color: '#2563EB' },
  updated: { icon: Pencil, bg: '#FEF3C7', color: '#B45309' },
  completed: { icon: CheckCircle2, bg: '#DCFCE7', color: '#16A34A' },
  restored: { icon: RotateCcw, bg: '#EFEAFC', color: '#7C3AED' },
  deleted: { icon: Trash2, bg: '#FEE2E2', color: '#DC2626' },
}

function activityText(entry) {
  if (entry.type === 'completed') return `Marked ${entry.name} as completed`
  const verbs = { added: 'Added', updated: 'Updated', restored: 'Restored', deleted: 'Deleted' }
  return `${verbs[entry.type] || 'Updated'} ${entry.name}`
}

const SOON_COLORS = [
  { bg: '#E6F1FE', color: '#2563EB' },
  { bg: '#FEF3C7', color: '#B45309' },
  { bg: '#EFEAFC', color: '#7C3AED' },
]

function dayKeyOf(dateStr) {
  const m = String(dateStr || '').match(/^(\d{4}-\d{2}-\d{2})/)
  if (m) return m[1]
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function monthKeyOf(dateStr) {
  const day = dayKeyOf(dateStr)
  return day ? day.slice(0, 7) : null
}

function monthLabelFromKey(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function shortDate(dateStr) {
  const m = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(dateStr)
  if (!d || Number.isNaN(d.getTime())) return String(dateStr || '—')
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Compact Exam Schedule panel: switchable Calendar / List views. */
function ExamSchedule({ expandable = true }) {
  const exams = useExamStore((s) => s.exams)
  const setDetailExam = useExamStore((s) => s.setDetailExam)
  const now = useExamNow()

  const [showFull, setShowFull] = useState(false)

  const [view, setView] = useState('calendar')
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const [selected, setSelected] = useState(() => localDateStr(new Date()))
  const [openMonths, setOpenMonths] = useState({})
  const defaultsSet = useRef(false)

  const todayKey = localDateStr(now)

  const byDay = useMemo(() => {
    const map = {}
    exams.forEach((e) => {
      const key = dayKeyOf(e.exam_date)
      if (!key) return
      if (!map[key]) map[key] = []
      map[key].push(e)
    })
    return map
  }, [exams])

  const cells = useMemo(() => {
    const first = new Date(month.y, month.m, 1)
    const offset = first.getDay() // Sunday-first
    const daysInMonth = new Date(month.y, month.m + 1, 0).getDate()
    const arr = []
    for (let i = 0; i < offset; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(month.y, month.m, d))
    return arr
  }, [month])

  const monthLabel = new Date(month.y, month.m, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const shiftMonth = (dir) => {
    const d = new Date(month.y, month.m + dir, 1)
    setMonth({ y: d.getFullYear(), m: d.getMonth() })
  }

  const selectedExams = byDay[selected] || []

  // Monthly groups: rolling 12-month window starting from the current month
  // (e.g. Sep → Aug), regardless of which months contain exams.
  const monthGroups = useMemo(() => {
    const groups = {}
    exams.forEach((e) => {
      const key = monthKeyOf(e.exam_date)
      if (!key) return
      if (!groups[key]) groups[key] = []
      groups[key].push(e)
    })
    const out = []
    const startY = now.getFullYear()
    const startM = now.getMonth()
    for (let i = 0; i < 12; i++) {
      const idx = startM + i
      const y = startY + Math.floor(idx / 12)
      const mm = (idx % 12) + 1
      const key = `${y}-${String(mm).padStart(2, '0')}`
      const list = (groups[key] || []).slice().sort((a, b) => String(a.exam_date).localeCompare(String(b.exam_date)))
      out.push({ key, label: monthLabelFromKey(key), exams: list })
    }
    return out
  }, [exams, now])

  // Default: expand current month + month of the nearest upcoming exam.
  useEffect(() => {
    if (defaultsSet.current || exams.length === 0) return
    defaultsSet.current = true
    const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const act = sortExams(filterExams(exams, { query: '', filter: 'upcoming' }, now), 'nearest')[0]
    const near = act ? monthKeyOf(act.exam_date) : null
    setOpenMonths({ [cur]: true, ...(near ? { [near]: true } : {}) })
  }, [exams, now])

  const toggleMonth = (key) => setOpenMonths((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="right-panel-card">
      <h3 className="right-panel-title">
        <span>Exam Schedule</span>
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

      <div className="exam-schedule-toggle">
        <button
          type="button"
          className={cn('exam-schedule-btn', view === 'calendar' && 'active')}
          onClick={() => setView('calendar')}
        >
          <CalendarDays size={14} /> Calendar View
        </button>
        <button
          type="button"
          className={cn('exam-schedule-btn', view === 'list' && 'active')}
          onClick={() => setView('list')}
        >
          <List size={14} /> List View
        </button>
      </div>

      {view === 'calendar' ? (
        <div className="exam-sched-cal">
          <div className="exam-sched-nav">
            <button className="exam-icon-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <ChevronLeft size={15} />
            </button>
            <span className="exam-sched-month">{monthLabel}</span>
            <button className="exam-icon-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="exam-mini-grid">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="exam-mini-weekday">{d}</span>
            ))}
            {cells.map((date, i) => {
              if (!date) return <span key={i} className="exam-mini-cell exam-mini-empty" />
              const key = localDateStr(date)
              const dayExams = byDay[key] || []
              const doneCount = dayExams.filter((e) => e.completed).length
              const activeCount = dayExams.length - doneCount
              return (
                <button
                  key={i}
                  type="button"
                  className={cn(
                    'exam-mini-cell',
                    key === todayKey && 'exam-mini-today',
                    key === selected && 'exam-mini-selected',
                    dayExams.length > 0 && 'exam-mini-has'
                  )}
                  onClick={() => setSelected(key)}
                  title={dayExams.map((e) => e.exam_name).join(', ')}
                >
                  <span className="exam-mini-num">{date.getDate()}</span>
                  {dayExams.length > 0 && (
                    <span className="exam-mini-dots">
                      {activeCount > 0 && <span className="exam-mini-dot" />}
                      {doneCount > 0 && <span className="exam-mini-dot exam-mini-dot-done" />}
                      {dayExams.length > 1 && <span className="exam-mini-count">{dayExams.length}</span>}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="exam-sched-legend">
            <span><i className="exam-legend-dot exam-legend-exam" /> Exam Date</span>
            <span><i className="exam-legend-dot exam-legend-today" /> Today</span>
            <span><i className="exam-legend-dot exam-legend-done" /> Completed</span>
          </div>
          {selectedExams.length > 0 && (
            <div className="exam-sched-daylist">
              <div className="exam-sched-daytitle">{shortDate(selected)}</div>
              {selectedExams.map((e) => {
                const st = deriveStatus(e, now)
                return (
                  <button key={e.id} type="button" className="exam-sched-dayitem" onClick={() => setDetailExam(e)}>
                    <span className={cn('exam-sched-dot', st === 'completed' && 'done')} />
                    <span className="exam-sched-dayname">{e.exam_name}</span>
                    {e.exam_time && <span className="exam-sched-daytime">{formatExamTime(e.exam_time)}</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="exam-schedule-list">
          {monthGroups.map((g) => {
            const open = !!openMonths[g.key]
            return (
              <div className="exam-month" key={g.key}>
                <button type="button" className="exam-month-row" onClick={() => toggleMonth(g.key)}>
                  <ChevronDown size={15} className={cn('exam-month-chevron', open && 'open')} />
                  <span className="exam-month-label">{g.label}</span>
                  <span className="exam-month-count">
                    {g.exams.length} {g.exams.length === 1 ? 'Exam' : 'Exams'}
                  </span>
                </button>
                <div className={cn('exam-month-body', open && 'open')}>
                  <div className="exam-month-items">
                    {g.exams.map((e) => (
                      <ScheduleExamItem key={e.id} exam={e} now={now} onOpen={() => setDetailExam(e)} />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {expandable && (
        <Dialog isOpen={showFull} onClose={() => setShowFull(false)} title="Exam Schedule" size="lg" className="exam-schedule-dialog">
          <ExamSchedule expandable={false} />
        </Dialog>
      )}
    </div>
  )
}

function ScheduleExamItem({ exam, now, onOpen }) {
  const status = deriveStatus(exam, now)
  const done = status === 'completed' || status === 'passed'
  const d = daysLeft(exam, now)

  if (done) {
    return (
      <button type="button" className="exam-list-item exam-list-item-done" onClick={onOpen}>
        <span className="exam-list-name">✓ {exam.exam_name}</span>
        <span className="exam-list-sub">
          {shortDate(exam.exam_date)}{exam.exam_time ? ` • ${formatExamTime(exam.exam_time)}` : ''}
        </span>
        <span className="exam-list-status exam-list-status-done">● Completed</span>
      </button>
    )
  }

  return (
    <button type="button" className="exam-list-item" onClick={onOpen}>
      <span className="exam-list-date">📅 {shortDate(exam.exam_date)}{exam.exam_time ? ` • ${formatExamTime(exam.exam_time)}` : ''}</span>
      <span className="exam-list-name">{exam.exam_name}</span>
      {exam.category && <span className="exam-list-sub">{exam.category}</span>}
      <span className="exam-list-days">
        {d === 0 ? 'TODAY' : d === 1 ? '1 DAY LEFT' : `${d} DAYS LEFT`}
      </span>
      <span className={cn('exam-list-status', `exam-list-status-${status}`)}>● {STATUS_META[status].label}</span>
    </button>
  )
}

export function ExamsRail() {
  const exams = useExamStore((s) => s.exams)
  const activity = useExamStore((s) => s.activity)
  const setDetailExam = useExamStore((s) => s.setDetailExam)
  const bumpExamScroll = useExamStore((s) => s.bumpExamScroll)
  const now = useExamNow()
  const navigate = useNavigate()
  const [showAll, setShowAll] = useState(false)

  const stats = useMemo(() => computeExamStats(exams, now), [exams, now])

  const counts = useMemo(() => {
    let today = 0
    let tomorrow = 0
    exams.forEach((e) => {
      const s = deriveStatus(e, now)
      if (s === 'today') today += 1
      if (s === 'tomorrow') tomorrow += 1
    })
    return { today, tomorrow }
  }, [exams, now])

  const next30 = useMemo(() => exams.filter((e) => {
    const s = deriveStatus(e, now)
    if (!['upcoming', 'tomorrow', 'today'].includes(s)) return false
    const d = daysLeft(e, now)
    return d !== null && d >= 0 && d <= 30
  }).length, [exams, now])

  const soonList = useMemo(() => {
    const act = sortExams(filterExams(exams, { query: '', filter: 'upcoming' }, now), 'nearest')
    return act.slice(0, 3)
  }, [exams, now])

  const studyTip = useMemo(() => {
    const start = new Date(now.getFullYear(), 0, 0)
    const dayOfYear = Math.floor((now - start) / 86400000)
    return STUDY_TIPS[dayOfYear % STUDY_TIPS.length]
  }, [now])

  const viewAll = () => {
    navigate('/exams')
    bumpExamScroll()
  }

  return (
    <div className="exams-rail">
      {/* Exam Schedule: Calendar / List */}
      <ExamSchedule />

      {/* Quick Stats */}
      <div className="right-panel-card">
        <h3 className="right-panel-title">Quick Stats</h3>
        <div className="exam-quick-list">
          <QuickRow icon={CalendarDays} bg="#E6F1FE" color="#2563EB" label="Today" value={counts.today} sub={counts.today === 0 ? 'No exams' : 'Scheduled'} />
          <QuickRow icon={Clock3} bg="#DCFCE7" color="#16A34A" label="Tomorrow" value={counts.tomorrow} sub="Upcoming" />
          <QuickRow icon={BarChart3} bg="#EFEAFC" color="#7C3AED" label="This Month" value={stats.thisMonth} sub="Scheduled" />
          <QuickRow icon={Timer} bg="#FEF3C7" color="#B45309" label="Next 30 Days" value={next30} sub="Upcoming" />
        </div>
      </div>

      {/* Upcoming Soon */}
      <div className="right-panel-card">
        <h3 className="right-panel-title">
          <span>Upcoming Soon</span>
          <button className="exam-link-btn" onClick={viewAll}>View All</button>
        </h3>
        {soonList.length === 0 ? (
          <p className="empty-state-desc">No upcoming exams.</p>
        ) : (
          <div className="exam-soon-list">
            {soonList.map((exam, i) => {
              const d = daysLeft(exam, now)
              const c = SOON_COLORS[i % SOON_COLORS.length]
              return (
                <button key={exam.id} type="button" className="exam-soon-item" onClick={() => setDetailExam(exam)}>
                  <span className="exam-soon-icon" style={{ backgroundColor: c.bg, color: c.color }}>
                    <FileText size={16} />
                  </span>
                  <span className="exam-soon-text">
                    <span className="exam-soon-name">{exam.exam_name}</span>
                    <span className="exam-soon-days">
                      {d === 0 ? 'Today' : d === 1 ? '1 day left' : `${d} days left`}
                    </span>
                    <span className="exam-soon-date">
                      {formatExamDate(exam.exam_date)}{exam.exam_time ? ` • ${formatExamTime(exam.exam_time)}` : ''}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Study Tip */}
      <div className="right-panel-card exam-tip">
        <h3 className="right-panel-title exam-tip-title"><Lightbulb size={16} /> Study Tip</h3>
        <p className="exam-tip-text">{studyTip}</p>
      </div>

      {/* Recent Activity */}
      <div className="right-panel-card">
        <h3 className="right-panel-title">
          <span className="exam-side-title-icon"><Activity size={16} /> Recent Activity</span>
          <button className="exam-link-btn" onClick={() => setShowAll(true)}>View All</button>
        </h3>
        {activity.length === 0 ? (
          <p className="empty-state-desc">No activity yet.</p>
        ) : (
          <div className="exam-activity-list">
            {activity.slice(0, 4).map((a) => <ActivityRow key={a.id} entry={a} />)}
          </div>
        )}
      </div>

      <Dialog isOpen={showAll} onClose={() => setShowAll(false)} title="Recent Activity" size="md">
        {activity.length === 0 ? (
          <p className="empty-state-desc">No activity yet.</p>
        ) : (
          <div className="exam-activity-list">
            {activity.map((a) => <ActivityRow key={a.id} entry={a} />)}
          </div>
        )}
      </Dialog>
    </div>
  )
}

function QuickRow({ icon: Icon, bg, color, label, value, sub }) {
  return (
    <div className="exam-quick-row">
      <span className="exam-quick-icon" style={{ backgroundColor: bg, color }}>
        <Icon size={17} />
      </span>
      <span className="exam-quick-text">
        <span className="exam-quick-label">{label}</span>
        <span className="exam-quick-sub">{sub}</span>
      </span>
      <span className="exam-quick-value">{value}</span>
    </div>
  )
}

function ActivityRow({ entry }) {
  const meta = ACT_META[entry.type] || ACT_META.added
  const Icon = meta.icon
  return (
    <div className="exam-activity-item">
      <span className="exam-activity-icon" style={{ backgroundColor: meta.bg, color: meta.color }}>
        <Icon size={15} />
      </span>
      <span className="exam-activity-text">
        <span className="exam-activity-name">{activityText(entry)}</span>
        <span className="exam-activity-time">{formatExamActivityTime(entry.at)}</span>
      </span>
    </div>
  )
}

export default ExamsRail
