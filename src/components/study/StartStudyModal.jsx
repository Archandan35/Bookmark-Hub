import { useState, useEffect, useMemo, useCallback } from 'react'
import { Play, Plus, Link2, ExternalLink } from 'lucide-react'
import { Modal } from '../Modal'
import { Button } from '../Button'
import { cn } from '../../utils/helpers'
import { StudyEntityService } from '../../services/StudyEntityService'
import { studySessionController } from '../../services/studySessionController'
import { useAuthStore } from '../../hooks/useStore'
import { useSessionStore, formatHMS } from '../../hooks/useSessionStore'

function extractDomain(url) {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function Option({ children, ...props }) {
  return <option {...props}>{children}</option>
}

const NEW_SOURCE = '__new_source__'
const NEW_COURSE = '__new_course__'
const NEW_EDUCATOR = '__new_educator__'
const NEW_TOPIC = '__new_topic__'
const NO_LESSON = '__no_lesson__'

export function StartStudyModal({ open, onClose, onStarted, prefill = {} }) {
  const { user } = useAuthStore()
  const [sources, setSources] = useState([])
  const [courses, setCourses] = useState([])
  const [educators, setEducators] = useState([])
  const [topics, setTopics] = useState([])
  const [lessons, setLessons] = useState([])
  const [loadingRefs, setLoadingRefs] = useState(false)
  const [starting, setStarting] = useState(false)

  const [sourceChoice, setSourceChoice] = useState('')
  const [newSourceName, setNewSourceName] = useState('')
  const [newSourceUrl, setNewSourceUrl] = useState('')
  const [newSourceType, setNewSourceType] = useState('website')
  const [courseId, setCourseId] = useState('')
  const [newCourseName, setNewCourseName] = useState('')
  const [educatorChoice, setEducatorChoice] = useState('')
  const [newEducatorName, setNewEducatorName] = useState('')
  const [topicChoice, setTopicChoice] = useState('')
  const [newTopicName, setNewTopicName] = useState('')
  const [lessonNumber, setLessonNumber] = useState('')
  const [lessonTitle, setLessonTitle] = useState('')
  const [contentType, setContentType] = useState('video')
  const [progressStart, setProgressStart] = useState(0)
  const [error, setError] = useState('')
  const [pendingStart, setPendingStart] = useState(null) // null | { save: true }

  const selectedSource = useMemo(
    () => sources.find((s) => s.id === sourceChoice) || null,
    [sources, sourceChoice]
  )

  const loadRefs = useCallback(async () => {
    if (!user) return
    setLoadingRefs(true)
    try {
      const [allSources, allEducators] = await Promise.all([
        StudyEntityService.getSources(user.id),
        StudyEntityService.getEducators(user.id),
      ])
      setSources(allSources)
      setEducators(allEducators)
    } finally {
      setLoadingRefs(false)
    }
  }, [user])

  useEffect(() => {
    if (open) {
      loadRefs()
      setError('')
    }
  }, [open, loadRefs])

  useEffect(() => {
    if (!open) return
    const domain = prefill.domain || extractDomain(prefill.url || '')
    if (domain) {
      const known = sources.find((s) => s.domain && domain.includes(s.domain))
      if (known) {
        setSourceChoice(known.id)
        return
      }
    }
    if (prefill.url) {
      const urlHost = extractDomain(prefill.url)
      const matching = sources.find((s) => s.domain && s.domain === urlHost)
      if (matching) setSourceChoice(matching.id)
    }
  }, [open, prefill, sources])

  const selectedSourceId = selectedSource?.id || null

  useEffect(() => {
    if (!user || !selectedSourceId) {
      setCourses([])
      setTopics([])
      setLessons([])
      return
    }
    let cancelled = false
    StudyEntityService.getCourses(user.id, selectedSourceId).then((data) => {
      if (!cancelled) setCourses(data)
    })
    return () => { cancelled = true }
  }, [user, selectedSourceId])

  useEffect(() => {
    if (!user || !courseId) {
      setTopics([])
      setLessons([])
      return
    }
    let cancelled = false
    Promise.all([
      StudyEntityService.getTopics(user.id, courseId, null),
      StudyEntityService.getLessons(user.id, { courseId }),
    ]).then(([topicsData, lessonsData]) => {
      if (cancelled) return
      setTopics(topicsData)
      setLessons(lessonsData)
    })
    return () => { cancelled = true }
  }, [user, courseId])

  const handleSourceChange = (value) => {
    setSourceChoice(value)
    setCourseId('')
    setEducatorChoice('')
    setTopicChoice('')
    setLessonNumber('')
    setLessonTitle('')
  }

   const buildMeta = async () => {
    if (!user) throw new Error('Signing in is required')
    let source = null
    if (sourceChoice === NEW_SOURCE) {
      if (!newSourceName.trim()) throw new Error('Enter a name for the application/website')
      source = await StudyEntityService.getOrCreateSource(user.id, {
        name: newSourceName.trim(),
        sourceType: newSourceType,
        url: newSourceUrl.trim(),
      })
    } else if (selectedSource) {
      source = selectedSource
    } else {
      throw new Error('Select an application/website')
    }

    let educator = null
    if (educatorChoice === NEW_EDUCATOR) {
      if (!newEducatorName.trim()) throw new Error('Enter educator name')
      educator = await StudyEntityService.getOrCreateEducator(user.id, { name: newEducatorName.trim(), sourceId: source.id })
    } else if (educatorChoice) {
      educator = educators.find((e) => e.id === educatorChoice) || null
    }

    let course = null
    if (courseId === NEW_COURSE) {
      if (!newCourseName.trim()) throw new Error('Enter course name')
      course = await StudyEntityService.getOrCreateCourse(user.id, { sourceId: source.id, educatorId: educator?.id || null, name: newCourseName.trim() })
    } else if (courseId) {
      course = courses.find((c) => c.id === courseId) || null
    }

    let topic = null
    if (topicChoice === NEW_TOPIC) {
      if (!newTopicName.trim()) throw new Error('Enter topic name')
      topic = await StudyEntityService.getOrCreateTopic(user.id, { courseId: course?.id || null, parentId: null, name: newTopicName.trim() })
    } else if (topicChoice) {
      topic = topics.find((t) => t.id === topicChoice) || null
    }

    let lesson = null
    if (lessonTitle.trim() || lessonNumber) {
      lesson = await StudyEntityService.getOrCreateLesson(user.id, {
        courseId: course?.id || null,
        topicId: topic?.id || null,
        sourceId: source.id,
        educatorId: educator?.id || null,
        lessonNumber,
        title: lessonTitle.trim() || `Lesson ${lessonNumber || ''}`.trim(),
        contentType,
        sourceUrl: sourceChoice === NEW_SOURCE ? newSourceUrl.trim() : selectedSource?.url || prefill.url || '',
      })
    }

    return {
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: sourceChoice === NEW_SOURCE ? newSourceUrl.trim() : selectedSource?.url || prefill.url || '',
      domain: source.domain || extractDomain(sourceChoice === NEW_SOURCE ? newSourceUrl : selectedSource?.url || prefill.url || ''),
      courseId: course?.id || null,
      courseName: course?.name || '',
      educatorId: educator?.id || null,
      educatorName: educator?.name || '',
      topicId: topic?.id || null,
      topicName: topic?.name || '',
      lessonId: lesson?.id || null,
      lessonNumber: lesson?.lesson_number || (lessonNumber ? Math.max(1, Math.floor(Number(lessonNumber))) : null),
      lessonTitle: lesson?.title || lessonTitle.trim() || '',
      contentType,
      progressStart: Math.max(0, Math.min(100, Math.round(progressStart))),
      progressEnd: Math.max(0, Math.min(100, Math.round(progressStart))),
    }
  }

   // An in-progress session is ACTIVE or PAUSED (not completed/idle) and should
   // be saved/confirmed before being removed by a new start.
   function hasInProgressSession() {
     try {
       const s = useSessionStore.getState()
       const phase = s.sessionPhase
       const active = s.activeSession
       return !!active && phase !== 'completed' && phase !== 'discarded' && phase !== 'idle'
     } catch (e) { return false }
   }

  const commitStart = async (willSave) => {
    setPendingStart(null)
    setError('')
    setStarting(true)
    try {
      if (willSave) {
        // Persist the in-progress session, then start the next one.
        await studySessionController.stopStudy()
      } else {
        // Discard the in-progress session (time not recorded), then start.
        await studySessionController.resetSession()
      }
      const meta = await buildMeta()
      const session = await studySessionController.startNew(meta)
      onStarted?.(session, meta)
      onClose?.()
    } catch (err) {
      setError(err?.message || 'Could not start the session')
    } finally {
      setStarting(false)
    }
  }

  const handleStart = async () => {
    if (hasInProgressSession()) {
      // Capture the start intent and ask the user how to handle the live session.
      setPendingStart({ save: null })
      return
    }
    setStarting(true)
    setError('')
    try {
      const meta = await buildMeta()
      const session = await studySessionController.startNew(meta)
      onStarted?.(session, meta)
      onClose?.()
    } catch (err) {
      setError(err?.message || 'Could not start the session')
    } finally {
      setStarting(false)
    }
  }

  const sourceOptions = sources.map((s) => (
    <Option key={s.id} value={s.id}>{s.name}{s.domain ? ` (${s.domain})` : ''}</Option>
  ))
  const courseOptions = courses.map((c) => (
    <Option key={c.id} value={c.id}>{c.name}</Option>
  ))
  const educatorOptions = educators
    .filter((e) => !selectedSource || !e.source_id || e.source_id === selectedSource.id)
    .map((e) => <Option key={e.id} value={e.id}>{e.name}</Option>)
  const topicOptions = topics.map((t) => <Option key={t.id} value={t.id}>{t.name}</Option>)
  const lessonOptions = lessons.map((l) => (
    <Option key={l.id} value={l.id}>Lesson {l.lesson_number || '—'}{l.title ? ` · ${l.title}` : ''}{l.progress ? ` (${l.progress}%)` : ''}</Option>
  ))

  return (
    <Modal open={open} onClose={onClose} title="Start Study Session" maxWidth={560} className="start-study-modal">
      <div className="start-study-form">
        {prefill.url && (
          <div className="start-study-prefill">
            <Link2 size={14} />
            <span>{prefill.title || prefill.url}</span>
          </div>
        )}

        <label className="start-study-field">
          <span className="start-study-label">Application / Website</span>
          <select value={sourceChoice} onChange={(e) => handleSourceChange(e.target.value)}>
            <option value="" disabled>Select application/website…</option>
            {sourceOptions}
            <option value={NEW_SOURCE}>＋ Create new source…</option>
          </select>
        </label>

        {sourceChoice === NEW_SOURCE && (
          <div className="start-study-new">
            <label className="start-study-field">
              <span className="start-study-label">Source name</span>
              <input
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                placeholder="e.g. Khan Academy, LeetCode, YouTube…"
                autoFocus
              />
            </label>
            <div className="start-study-row">
              <label className="start-study-field">
                <span className="start-study-label">Type</span>
                <select value={newSourceType} onChange={(e) => setNewSourceType(e.target.value)}>
                  <option value="website">Website</option>
                  <option value="app">Mobile App</option>
                  <option value="local">Local Content</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="start-study-field">
                <span className="start-study-label">URL (optional)</span>
                <input
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder="https://…"
                />
              </label>
            </div>
          </div>
        )}

        <div className="start-study-row">
          <label className="start-study-field">
            <span className="start-study-label">Course</span>
            <select value={courseId} onChange={(e) => { setCourseId(e.target.value); setTopicChoice('') }}>
              <option value="">— None —</option>
              {courseOptions}
              <option value={NEW_COURSE}>＋ Create new course…</option>
            </select>
          </label>
          <label className="start-study-field">
            <span className="start-study-label">Educator / Instructor</span>
            <select value={educatorChoice} onChange={(e) => setEducatorChoice(e.target.value)}>
              <option value="">— None —</option>
              {educatorOptions}
              <option value={NEW_EDUCATOR}>＋ Create new educator…</option>
            </select>
          </label>
        </div>

        {courseId === NEW_COURSE && (
          <label className="start-study-field">
            <span className="start-study-label">New course name</span>
            <input value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} placeholder="e.g. React JS Complete Course" />
          </label>
        )}
        {educatorChoice === NEW_EDUCATOR && (
          <label className="start-study-field">
            <span className="start-study-label">New educator name</span>
            <input value={newEducatorName} onChange={(e) => setNewEducatorName(e.target.value)} placeholder="e.g. Code With Harry" />
          </label>
        )}

        <label className="start-study-field">
          <span className="start-study-label">Topic (optional)</span>
          <select value={topicChoice} onChange={(e) => setTopicChoice(e.target.value)}>
            <option value="">— None —</option>
            {topicOptions}
            <option value={NEW_TOPIC}>＋ Create new topic…</option>
          </select>
        </label>
        {topicChoice === NEW_TOPIC && (
          <label className="start-study-field">
            <span className="start-study-label">New topic name</span>
            <input value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} placeholder="e.g. React Hooks" />
          </label>
        )}

        <div className="start-study-row">
          <label className="start-study-field">
            <span className="start-study-label">Lesson number</span>
            <input type="number" min="1" value={lessonNumber} onChange={(e) => setLessonNumber(e.target.value)} placeholder="e.g. 6" />
          </label>
          <label className="start-study-field">
            <span className="start-study-label">Lesson title</span>
            <input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="e.g. useEffect" />
          </label>
        </div>

        {lessonOptions.length > 0 && (
          <label className="start-study-field">
            <span className="start-study-label">Or pick existing lesson</span>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value === NO_LESSON) return
                const lesson = lessons.find((l) => l.id === e.target.value)
                if (!lesson) return
                setLessonNumber(lesson.lesson_number || '')
                setLessonTitle(lesson.title || '')
                setContentType(lesson.content_type || contentType)
              }}
            >
              <option value={NO_LESSON}>— Choose —</option>
              {lessonOptions}
            </select>
          </label>
        )}

        <div className="start-study-row">
          <label className="start-study-field">
            <span className="start-study-label">Content type</span>
            <select value={contentType} onChange={(e) => setContentType(e.target.value)}>
              {StudyEntityService.CONTENT_TYPES.map((c) => (
                <Option key={c.value} value={c.value}>{c.label}</Option>
              ))}
            </select>
          </label>
          <label className="start-study-field">
            <span className="start-study-label">Current progress: {progressStart}%</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progressStart}
              onChange={(e) => setProgressStart(Number(e.target.value))}
            />
          </label>
        </div>

        {error && <div className="start-study-error">{error}</div>}

        {pendingStart && (
          <div className="start-study-confirm">
            <p>A study session is already running.</p>
            <p className="start-study-confirm-time">
              Current time: <strong>{formatHMS((useSessionStore.getState().getElapsedSeconds ? useSessionStore.getState().getElapsedSeconds() : 0))}</strong>
            </p>
            <p className="start-study-confirm-note">What should happen to it?</p>
            <div className="start-study-actions">
              <Button variant="outline" onClick={() => commitStart(true)} disabled={starting}>
                Save &amp; Start New
              </Button>
              <Button variant="ghost" onClick={() => commitStart(false)} disabled={starting}>
                Discard &amp; Start New
              </Button>
            </div>
          </div>
        )}

        <div className="start-study-actions" style={{ display: pendingStart ? 'none' : 'flex' }}>
          <Button variant="ghost" onClick={onClose} disabled={starting}>Cancel</Button>
          <Button onClick={handleStart} disabled={starting}>
            <Play size={15} /> Start Study Session
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default StartStudyModal
