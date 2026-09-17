import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus, Search, CalendarDays, Clock3, Pencil, MoreVertical, Check,
  RotateCcw, Trash2, Eye, Bell, BellOff, ChevronLeft, ChevronRight,
  Timer, ExternalLink, ArrowUpDown, Filter, X, Copy, Flame, Target,
  FileText, CheckCircle2, BarChart3, ArrowRight,
} from 'lucide-react'
import { useAuthStore } from '../hooks/useStore'
import { useExamStore, useExamNow } from '../hooks/useExamStore'
import { useToast } from '../components/Toast'
import { Dialog } from '../components/Dialog'
import { ConfirmationDialog } from '../components/ConfirmationDialog'
import { EmptyState } from '../components/EmptyState'
import { Button } from '../components/Button'
import { Input, Textarea } from '../components/Input'
import {
  ExamService, REMINDER_OPTIONS, EXAM_FILTERS, EXAM_SORTS,
  daysLeft, countdownLabel, deriveStatus, STATUS_META,
  filterExams, sortExams, computeExamStats,
  findDuplicate, formatExamDate, formatExamTime,
} from '../services/ExamService'
import { parseLocalDate, cn } from '../utils/helpers'

const EMPTY_FORM = {
  exam_name: '',
  exam_date: '',
  exam_time: '',
  category: '',
  subject: '',
  description: '',
  exam_link: '',
  notes: '',
  reminder_settings: [],
  reminders_enabled: true,
}

function reminderSummary(exam) {
  if (!exam?.reminders_enabled) return 'Reminders off'
  const list = exam?.reminder_settings || []
  if (list.length === 0) return 'No reminders'
  return list
    .map((v) => REMINDER_OPTIONS.find((o) => o.value === v)?.label || v)
    .join(', ')
}

export function ExamCounter() {
  const { user } = useAuthStore()
  const { addToast } = useToast()
  const now = useExamNow()

  const exams = useExamStore((s) => s.exams)
  const loading = useExamStore((s) => s.examsLoading)
  const loadExams = useExamStore((s) => s.loadExams)
  const logExamActivity = useExamStore((s) => s.logExamActivity)
  const setExams = useExamStore((s) => s.setExams)
  const detailExam = useExamStore((s) => s.detailExam)
  const setDetailExam = useExamStore((s) => s.setDetailExam)
  const examScrollSignal = useExamStore((s) => s.examScrollSignal)

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('nearest')
  const [category, setCategory] = useState('all')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [duplicateWarn, setDuplicateWarn] = useState(null)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [openMenu, setOpenMenu] = useState(null)
  const menuRef = useRef(null)

  const upcomingTrackRef = useRef(null)
  const completedTrackRef = useRef(null)
  const upcomingSectionRef = useRef(null)
  const dragMoved = useRef(false)

  useEffect(() => {
    loadExams(user?.id)
  }, [user?.id, loadExams])

  // Scroll to the Upcoming slider when requested from the right panel.
  useEffect(() => {
    if (examScrollSignal > 0) {
      upcomingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [examScrollSignal])

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  // Desktop drag-to-scroll for both carousels (native swipe works on touch).
  useEffect(() => {
    const cleanups = [upcomingTrackRef, completedTrackRef].map((ref) => {
      const el = ref.current
      if (!el) return null
      let down = false
      let startX = 0
      let startL = 0
      const onDown = (e) => { down = true; startX = e.clientX; startL = el.scrollLeft; dragMoved.current = false; el.classList.add('exam-slider-dragging') }
      const onMove = (e) => {
        if (!down) return
        const dx = e.clientX - startX
        if (Math.abs(dx) > 6) dragMoved.current = true
        el.scrollLeft = startL - dx
      }
      const onUp = () => { down = false; el.classList.remove('exam-slider-dragging') }
      el.addEventListener('mousedown', onDown)
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      return () => {
        el.removeEventListener('mousedown', onDown)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
    })
    return () => cleanups.forEach((fn) => fn && fn())
  }, [loading])

  const categories = useMemo(
    () => [...new Set(exams.map((e) => e.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [exams]
  )

  const visible = useMemo(() => {
    let list = filterExams(exams, { query, filter }, now)
    if (category !== 'all') list = list.filter((e) => e.category === category)
    return sortExams(list, sort)
  }, [exams, query, filter, category, sort, now])

  const upcoming = useMemo(
    () => visible.filter((e) => ['upcoming', 'tomorrow', 'today'].includes(e._status)),
    [visible]
  )
  const doneList = useMemo(
    () => visible.filter((e) => ['completed', 'passed'].includes(e._status)),
    [visible]
  )

  // Featured card: nearest upcoming exam across ALL exams (ignores search/filter).
  const nextExam = useMemo(() => {
    const act = sortExams(filterExams(exams, { query: '', filter: 'upcoming' }, now), 'nearest')
    return act[0] || null
  }, [exams, now])

  const stats = useMemo(() => computeExamStats(exams, now), [exams, now])

  const pillCounts = useMemo(() => {
    const c = { all: exams.length, upcoming: 0, today: 0, tomorrow: 0, completed: 0, passed: 0 }
    exams.forEach((e) => {
      const s = deriveStatus(e, now)
      if (['upcoming', 'tomorrow', 'today'].includes(s)) c.upcoming += 1
      if (s === 'today') c.today += 1
      if (s === 'tomorrow') c.tomorrow += 1
      if (s === 'completed') c.completed += 1
      if (s === 'passed') c.passed += 1
    })
    return c
  }, [exams, now])

  const slide = (ref, dir) => {
    const el = ref.current
    if (!el) return
    // Step exactly one card per click for a smooth paged feel.
    const card = el.querySelector('.exam-card')
    const step = card ? card.offsetWidth + 14 : Math.max(240, el.clientWidth * 0.8)
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  const resetFilters = () => {
    setQuery('')
    setCategory('all')
    setFilter('all')
  }

  const viewAllUpcoming = () => {
    resetFilters()
    upcomingTrackRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
    upcomingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openDetails = (exam) => {
    // Suppress card click after a drag-scroll gesture.
    if (dragMoved.current) return
    setDetailExam(exam)
    setOpenMenu(null)
  }

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setDuplicateWarn(null)
    setShowForm(true)
  }

  const openEdit = (exam) => {
    setEditing(exam)
    setForm({
      exam_name: exam.exam_name || '',
      exam_date: exam.exam_date || '',
      exam_time: exam.exam_time || '',
      category: exam.category || '',
      subject: exam.subject || '',
      description: exam.description || '',
      exam_link: exam.exam_link || '',
      notes: exam.notes || '',
      reminder_settings: exam.reminder_settings || [],
      reminders_enabled: exam.reminders_enabled ?? true,
    })
    setFormError('')
    setDuplicateWarn(null)
    setShowForm(true)
    setOpenMenu(null)
  }

  const toggleReminderOption = (value) => {
    setForm((f) => ({
      ...f,
      reminder_settings: f.reminder_settings.includes(value)
        ? f.reminder_settings.filter((v) => v !== value)
        : [...f.reminder_settings, value],
    }))
  }

  const handleSave = async (forceDuplicate = false) => {
    if (!form.exam_name.trim()) { setFormError('Exam name is required.'); return }
    if (!form.exam_date) { setFormError('Exam date is required.'); return }
    const dup = findDuplicate(exams, { exam_name: form.exam_name, exam_date: form.exam_date }, editing?.id)
    if (dup && !forceDuplicate) { setDuplicateWarn(dup); return }

    setSaving(true)
    try {
      if (editing) {
        const updated = await ExamService.update(editing.id, user?.id, {
          exam_name: form.exam_name.trim(),
          exam_date: form.exam_date,
          exam_time: form.exam_time,
          category: form.category,
          subject: form.subject,
          description: form.description,
          exam_link: form.exam_link,
          notes: form.notes,
          reminder_settings: form.reminder_settings,
          reminders_enabled: form.reminders_enabled,
        })
        setExams(exams.map((e) => (e.id === editing.id ? { ...e, ...updated } : e)))
        logExamActivity(user?.id, 'updated', form.exam_name.trim())
        addToast('Exam updated — countdown recalculated', 'success')
      } else {
        const created = await ExamService.create(user?.id, form)
        setExams([created, ...exams])
        logExamActivity(user?.id, 'added', created.exam_name)
        addToast('Exam added to Upcoming Exams', 'success')
      }
      setShowForm(false)
      setEditing(null)
      setDuplicateWarn(null)
      setFormError('')
    } catch {
      addToast('Failed to save exam', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleComplete = async (exam) => {
    const updated = await ExamService.toggleComplete(exam, user?.id, !exam.completed)
    setExams(exams.map((e) => (e.id === exam.id ? { ...e, ...updated } : e)))
    logExamActivity(user?.id, exam.completed ? 'restored' : 'completed', exam.exam_name)
    addToast(!exam.completed ? 'Marked as completed' : 'Restored to upcoming', 'success')
    setOpenMenu(null)
  }

  const handleRestore = async (exam) => {
    const updated = await ExamService.restore(exam, user?.id)
    setExams(exams.map((e) => (e.id === exam.id ? { ...e, ...updated } : e)))
    logExamActivity(user?.id, 'restored', exam.exam_name)
    addToast('Exam restored — countdown restarted', 'success')
  }

  const handleDuplicate = async (exam) => {
    try {
      const copy = await ExamService.create(user?.id, {
        exam_name: `${exam.exam_name} (Copy)`,
        exam_date: exam.exam_date,
        exam_time: exam.exam_time || '',
        category: exam.category || '',
        subject: exam.subject || '',
        description: exam.description || '',
        exam_link: exam.exam_link || '',
        notes: exam.notes || '',
        reminder_settings: exam.reminder_settings || [],
        reminders_enabled: exam.reminders_enabled ?? true,
      })
      setExams([copy, ...exams])
      logExamActivity(user?.id, 'added', copy.exam_name)
      addToast('Exam duplicated', 'success')
    } catch {
      addToast('Failed to duplicate exam', 'error')
    }
    setOpenMenu(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await ExamService.remove(deleteTarget.id, user?.id)
    setExams(exams.filter((e) => e.id !== deleteTarget.id))
    logExamActivity(user?.id, 'deleted', deleteTarget.exam_name)
    addToast('Exam deleted', 'success')
    setDeleteTarget(null)
    setOpenMenu(null)
  }

  const statCards = [
    { label: 'Total Exams', value: stats.total, caption: 'All exams', icon: FileText, bg: '#E6F1FE', color: '#2563EB' },
    { label: 'Upcoming', value: stats.upcoming, caption: 'To be conducted', icon: CalendarDays, bg: '#FEF3C7', color: '#B45309' },
    { label: 'Completed', value: stats.completed, caption: 'Successfully done', icon: CheckCircle2, bg: '#DCFCE7', color: '#16A34A' },
    { label: 'This Month', value: stats.thisMonth, caption: 'Exams scheduled', icon: BarChart3, bg: '#EFEAFC', color: '#7C3AED' },
  ]

  return (
    <div className="exam-page">
      <div className="exam-main">
        {/* Compact header */}
        <div className="exam-top">
          <div className="exam-header-icon"><Timer size={24} /></div>
          <div>
            <h1 className="exam-page-title">Exam Counter</h1>
            <p className="exam-page-subtitle">Track your exams, stay prepared, achieve your goals.</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="exam-stats">
          {statCards.map((s) => (
            <div key={s.label} className="exam-stat-card">
              <div className="exam-stat-head">
                <span className="exam-stat-icon" style={{ backgroundColor: s.bg, color: s.color }}>
                  <s.icon size={20} />
                </span>
                <span className="exam-stat-label">{s.label}</span>
              </div>
              <span className="exam-stat-value">{s.value}</span>
              <span className="exam-stat-caption">{s.caption}</span>
            </div>
          ))}
        </div>

        {/* Search & filter toolbar */}
        <div className="exam-toolbar">
          <div className="exam-search">
            <Search size={16} className="exam-search-icon" />
            <input
              className="exam-search-input"
              placeholder="Search exams by name, subject, category..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className="exam-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="exam-select-wrap">
            <Filter size={14} />
            <select className="exam-select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="exam-select-wrap">
            <ArrowUpDown size={14} />
            <select className="exam-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort exams">
              {EXAM_SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Status pills with counts */}
        <div className="exam-filter-chips">
          {EXAM_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={cn('exam-chip', filter === f.value && 'exam-chip-active')}
              onClick={() => setFilter(f.value)}
            >
              {f.label} <span className="exam-chip-count">({pillCounts[f.value] ?? 0})</span>
            </button>
          ))}
        </div>

        {/* Featured next exam */}
        {nextExam && <FeaturedNextExam exam={nextExam} now={now} onOpen={() => setDetailExam(nextExam)} />}

        {/* Upcoming slider */}
        <section className="exam-section" ref={upcomingSectionRef}>
          <div className="exam-slider-head">
            <h2 className="exam-section-title">Upcoming Exams ({upcoming.length})</h2>
            <div className="exam-slider-controls">
              <button className="exam-link-btn" onClick={viewAllUpcoming}>View All</button>
              <button className="exam-icon-btn" onClick={() => slide(upcomingTrackRef, -1)} aria-label="Scroll left"><ChevronLeft size={16} /></button>
              <button className="exam-icon-btn" onClick={() => slide(upcomingTrackRef, 1)} aria-label="Scroll right"><ChevronRight size={16} /></button>
            </div>
          </div>
          {loading ? (
            <div className="exam-slider">{[0, 1, 2, 3].map((i) => <div key={i} className="exam-card exam-skeleton" />)}</div>
          ) : upcoming.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No upcoming exams" description="Add an exam to start the automatic countdown." action={openAdd} actionLabel="+ Add Exam" />
          ) : (
            <div className="exam-slider" ref={upcomingTrackRef}>
              {upcoming.map((exam) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  now={now}
                  menuOpen={openMenu === exam.id}
                  onMenu={() => setOpenMenu(openMenu === exam.id ? null : exam.id)}
                  onToggle={() => handleToggleComplete(exam)}
                  onEdit={() => openEdit(exam)}
                  onDetails={() => openDetails(exam)}
                  onDelete={() => { setDeleteTarget(exam); setOpenMenu(null) }}
                  onRestore={() => handleRestore(exam)}
                  onDuplicate={() => handleDuplicate(exam)}
                  menuRef={menuRef}
                />
              ))}
            </div>
          )}
        </section>

        {/* Completed slider */}
        <section className="exam-section">
          <div className="exam-slider-head">
            <h2 className="exam-section-title exam-section-title-green">
              <CheckCircle2 size={18} /> Completed Exams ({doneList.length})
            </h2>
            <div className="exam-slider-controls">
              <button className="exam-link-btn" onClick={() => { resetFilters(); completedTrackRef.current?.scrollTo({ left: 0, behavior: 'smooth' }) }}>View All</button>
              <button className="exam-icon-btn" onClick={() => slide(completedTrackRef, -1)} aria-label="Scroll left"><ChevronLeft size={16} /></button>
              <button className="exam-icon-btn" onClick={() => slide(completedTrackRef, 1)} aria-label="Scroll right"><ChevronRight size={16} /></button>
            </div>
          </div>
          {doneList.length === 0 ? (
            <p className="exam-muted">No completed or passed exams yet.</p>
          ) : (
            <div className="exam-slider" ref={completedTrackRef}>
              {doneList.map((exam) => (
                <CompletedCard
                  key={exam.id}
                  exam={exam}
                  now={now}
                  menuOpen={openMenu === exam.id}
                  onMenu={() => setOpenMenu(openMenu === exam.id ? null : exam.id)}
                  onToggle={() => handleToggleComplete(exam)}
                  onEdit={() => openEdit(exam)}
                  onDetails={() => openDetails(exam)}
                  onDelete={() => { setDeleteTarget(exam); setOpenMenu(null) }}
                  onRestore={() => handleRestore(exam)}
                  onDuplicate={() => handleDuplicate(exam)}
                  menuRef={menuRef}
                />
              ))}
            </div>
          )}
        </section>

        {/* Motivational banner */}
        <div className="exam-banner">
          <div className="exam-banner-icon"><Target size={26} /></div>
          <div className="exam-banner-text">
            <h3>Stay Focused. Stay Prepared.</h3>
            <p>Every exam is a step towards a better future.</p>
          </div>
          <button className="exam-banner-btn" onClick={openAdd}><Plus size={16} /> Add Exam</button>
        </div>
      </div>

      {/* Add / Edit dialog */}
      <Dialog
        isOpen={showForm}
        onClose={() => { setShowForm(false); setDuplicateWarn(null) }}
        title={editing ? 'Edit Exam' : '+ Add Exam'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowForm(false); setDuplicateWarn(null) }}>Cancel</Button>
            <Button variant="primary" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Exam'}
            </Button>
          </>
        }
      >
        <div className="exam-form">
          {formError && <p className="exam-form-error">{formError}</p>}
          {duplicateWarn && (
            <div className="exam-dup-warn">
              <p>⚠️ “{duplicateWarn.exam_name}” already exists on {formatExamDate(duplicateWarn.exam_date)}. Add anyway?</p>
              <div className="exam-dup-actions">
                <Button variant="ghost" size="sm" onClick={() => setDuplicateWarn(null)}>Review</Button>
                <Button variant="primary" size="sm" onClick={() => { setDuplicateWarn(null); handleSave(true) }}>Add Anyway</Button>
              </div>
            </div>
          )}
          <Input label="Exam Name *" placeholder="e.g. UGC NET Odia" value={form.exam_name} onChange={(e) => setForm((f) => ({ ...f, exam_name: e.target.value }))} />
          <div className="exam-form-row">
            <Input label="Exam Date *" type="date" value={form.exam_date} onChange={(e) => setForm((f) => ({ ...f, exam_date: e.target.value }))} />
            <Input label="Exam Time" type="time" value={form.exam_time} onChange={(e) => setForm((f) => ({ ...f, exam_time: e.target.value }))} />
          </div>
          <div className="exam-form-row">
            <Input label="Category" placeholder="e.g. Banking" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            <Input label="Subject" placeholder="e.g. Odia" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          </div>
          <Textarea label="Description" placeholder="Syllabus, venue, admit card info…" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Input label="Exam / Official Website Link" placeholder="https://…" value={form.exam_link} onChange={(e) => setForm((f) => ({ ...f, exam_link: e.target.value }))} />
          <Textarea label="Optional Notes" placeholder="Personal notes…" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="exam-reminders">
            <div className="exam-reminders-head">
              <label className="exam-check">
                <input type="checkbox" checked={form.reminders_enabled} onChange={(e) => setForm((f) => ({ ...f, reminders_enabled: e.target.checked }))} />
                Enable reminders
              </label>
            </div>
            {form.reminders_enabled && (
              <div className="exam-reminder-options">
                {REMINDER_OPTIONS.map((o) => (
                  <label key={o.value} className="exam-check">
                    <input
                      type="checkbox"
                      checked={form.reminder_settings.includes(o.value)}
                      onChange={() => toggleReminderOption(o.value)}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </Dialog>

      {/* Details modal (also opened from the right panel) */}
      <Dialog isOpen={!!detailExam} onClose={() => setDetailExam(null)} title={detailExam?.exam_name || 'Exam Details'} size="md">
        {detailExam && <ExamDetails exam={detailExam} now={now} onEdit={() => { setDetailExam(null); openEdit(detailExam) }} />}
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Exam?"
        message={`Are you sure you want to delete "${deleteTarget?.exam_name}"?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}

function FeaturedNextExam({ exam, now, onOpen }) {
  const days = daysLeft(exam, now) ?? 0
  const status = deriveStatus(exam, now)
  const meta = STATUS_META[status]
  const d = parseLocalDate(exam.exam_date) || new Date(exam.exam_date)
  const weekday = !Number.isNaN(d?.getTime())
    ? d.toLocaleDateString('en-US', { weekday: 'long' })
    : ''
  const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local'
  let tzShort = ''
  try {
    tzShort = new Intl.DateTimeFormat('en', { timeZoneName: 'short' }).formatToParts(now).find((p) => p.type === 'timeZoneName')?.value || ''
  } catch {
    tzShort = ''
  }

  return (
    <div className="exam-featured">
      <CalendarDays className="exam-featured-deco" size={220} />
      <span className="exam-featured-badge"><Flame size={14} /> Next Exam</span>
      <div className="exam-featured-body">
        <div className="exam-featured-info">
          <h2 className="exam-featured-name">{exam.exam_name}</h2>
          <div className="exam-featured-pills">
            {exam.category && <span className="exam-pill">{exam.category}</span>}
            <span className="exam-pill">{meta.label}</span>
          </div>
          <div className="exam-featured-meta">
            <span>📅 {formatExamDate(exam.exam_date)}</span>
            {exam.exam_time && <span>🕐 {formatExamTime(exam.exam_time)}</span>}
          </div>
          <div className="exam-featured-sub">
            {weekday && <span>{weekday}</span>}
            {tzShort && <span>{tzShort} ({tzName})</span>}
          </div>
        </div>
        <div className="exam-featured-right">
          <div className="exam-featured-count">
            <span className="exam-featured-num">{days}</span>
            <span className="exam-featured-unit">{days <= 1 ? (days === 0 ? 'TODAY' : 'DAY LEFT') : 'DAYS LEFT'}</span>
          </div>
          <p className="exam-featured-quote">Every day brings you closer to your goal. Keep pushing forward!</p>
        </div>
        <button className="exam-featured-arrow" onClick={onOpen} aria-label="Open exam details">
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  )
}

function ExamMenu({ exam, menuOpen, onMenu, onToggle, onEdit, onDetails, onDelete, onRestore, onDuplicate, menuRef }) {
  return (
    <div className="exam-menu-wrap" ref={menuOpen ? menuRef : null}>
      <button className="exam-icon-btn" onClick={onMenu} aria-label="More options"><MoreVertical size={16} /></button>
      {menuOpen && (
        <div className="exam-menu">
          <button onClick={onDetails}><Eye size={14} /> View details</button>
          <button onClick={onEdit}><Pencil size={14} /> Edit</button>
          <button onClick={onDuplicate}><Copy size={14} /> Duplicate</button>
          {exam.completed
            ? <button onClick={onRestore}><RotateCcw size={14} /> Restore</button>
            : <button onClick={onToggle}><Check size={14} /> Mark complete</button>}
          <button className="exam-menu-danger" onClick={onDelete}><Trash2 size={14} /> Delete</button>
        </div>
      )}
    </div>
  )
}

function ExamCard({ exam, now, menuOpen, onMenu, onToggle, onEdit, onDetails, onDelete, onRestore, onDuplicate, menuRef }) {
  const status = exam._status || deriveStatus(exam, now)
  const meta = STATUS_META[status]
  const label = countdownLabel(exam, now)
  const days = daysLeft(exam, now)

  return (
    <div className="exam-card" onClick={onDetails} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onDetails() }}>
      <div className="exam-card-top" onClick={(e) => e.stopPropagation()}>
        <button
          className={cn('exam-circle', exam.completed && 'exam-circle-done')}
          onClick={onToggle}
          aria-label={exam.completed ? 'Restore exam' : 'Mark exam complete'}
          title={exam.completed ? 'Mark as upcoming (restore)' : 'Mark as complete'}
        >
          {exam.completed && <Check size={14} />}
        </button>
        <span className="exam-card-name" title={exam.exam_name}>{exam.exam_name}</span>
        <ExamMenu exam={exam} menuOpen={menuOpen} onMenu={onMenu} onToggle={onToggle} onEdit={onEdit}
          onDetails={onDetails} onDelete={onDelete} onRestore={onRestore} onDuplicate={onDuplicate} menuRef={menuRef} />
      </div>

      <div className="exam-count">
        <span className="exam-count-num">{days === 0 ? '0' : days === 1 ? '1' : days}</span>
        <span className="exam-count-unit">{label}</span>
      </div>

      <div className="exam-card-datetime">
        <span>📅 {formatExamDate(exam.exam_date)}</span>
        {exam.exam_time && <span>🕐 {formatExamTime(exam.exam_time)}</span>}
      </div>

      <div className="exam-card-foot" onClick={(e) => e.stopPropagation()}>
        <span className="exam-foot-pills">
          <span className={cn('exam-status', meta.className)}>{meta.label}</span>
          {exam.category && <span className="exam-tag exam-tag-cat">{exam.category}</span>}
        </span>
        <span className="exam-foot-actions">
          <button className="exam-icon-btn" onClick={onEdit} aria-label="Edit exam" title="Edit exam"><Pencil size={14} /></button>
          <button className="exam-icon-btn exam-icon-danger" onClick={onDelete} aria-label="Delete exam" title="Delete exam"><Trash2 size={14} /></button>
        </span>
      </div>
    </div>
  )
}

function CompletedCard({ exam, now, menuOpen, onMenu, onToggle, onEdit, onDetails, onDelete, onRestore, onDuplicate, menuRef }) {
  return (
    <div className="exam-card exam-card-completed" onClick={onDetails} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onDetails() }}>
      <div className="exam-card-top" onClick={(e) => e.stopPropagation()}>
        <button
          className="exam-circle exam-circle-done"
          onClick={onToggle}
          aria-label="Restore exam"
          title="Mark as upcoming (restore)"
        >
          <Check size={14} />
        </button>
        <span className="exam-card-name" title={exam.exam_name}>{exam.exam_name}</span>
        <ExamMenu exam={exam} menuOpen={menuOpen} onMenu={onMenu} onToggle={onToggle} onEdit={onEdit}
          onDetails={onDetails} onDelete={onDelete} onRestore={onRestore} onDuplicate={onDuplicate} menuRef={menuRef} />
      </div>

      {exam.category && <span className="exam-card-cat">{exam.category}</span>}

      <div className="exam-card-datetime">
        <span>📅 {formatExamDate(exam.exam_date)}</span>
        {exam.exam_time && <span>🕐 {formatExamTime(exam.exam_time)}</span>}
      </div>

      <div className="exam-card-foot exam-card-foot-green" onClick={(e) => e.stopPropagation()}>
        <span className="exam-status exam-status-completed">🟢 Completed</span>
        <span className="exam-foot-actions">
          <button className="exam-link-btn" onClick={onDetails}>View</button>
          <button className="exam-link-btn" onClick={onRestore}><RotateCcw size={13} /> Restore</button>
        </span>
      </div>
    </div>
  )
}

function ExamDetails({ exam, now, onEdit }) {
  const status = deriveStatus(exam, now)
  const meta = STATUS_META[status]
  return (
    <div className="exam-details">
      <div className="exam-details-count">
        <span className="exam-count-num">{exam.completed ? '✓' : (daysLeft(exam, now) ?? '—')}</span>
        <span className="exam-count-unit">{countdownLabel(exam, now)}</span>
      </div>
      <dl className="exam-details-list">
        <div><dt>Date</dt><dd>📅 {formatExamDate(exam.exam_date)}</dd></div>
        <div><dt>Time</dt><dd>🕐 {formatExamTime(exam.exam_time)}</dd></div>
        <div><dt>Status</dt><dd><span className={cn('exam-status', meta.className)}>{meta.label}</span></dd></div>
        {exam.category && <div><dt>Category</dt><dd>{exam.category}</dd></div>}
        {exam.subject && <div><dt>Subject</dt><dd>{exam.subject}</dd></div>}
        {exam.description && <div><dt>Description</dt><dd>{exam.description}</dd></div>}
        {exam.exam_link && (
          <div><dt>Exam link</dt><dd>
            <a href={exam.exam_link} target="_blank" rel="noreferrer" className="exam-ext-link">
              Open official page <ExternalLink size={13} />
            </a>
          </dd></div>
        )}
        {exam.notes && <div><dt>Notes</dt><dd>{exam.notes}</dd></div>}
        <div><dt>Reminders</dt><dd>{exam.reminders_enabled ? <Bell size={13} /> : <BellOff size={13} />} {reminderSummary(exam)}</dd></div>
        {exam.completed_at && <div><dt>Completed on</dt><dd>{new Date(exam.completed_at).toLocaleDateString()}</dd></div>}
        {exam.exam_date && parseLocalDate(exam.exam_date) < new Date(new Date().setHours(0, 0, 0, 0)) && !exam.completed && (
          <div><dt>Note</dt><dd className="exam-passed-note"><Clock3 size={13} /> Exam date passed — moved to Completed/Past automatically.</dd></div>
        )}
      </dl>
      <div className="exam-details-foot">
        <Button variant="primary" onClick={onEdit}><Pencil size={14} /> Edit Exam</Button>
      </div>
    </div>
  )
}

export default ExamCounter
