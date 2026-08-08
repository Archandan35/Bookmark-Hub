import databaseProvider from '../providers/DatabaseProvider'

const SOURCES = 'study_sources'
const EDUCATORS = 'study_educators'
const COURSES = 'study_courses'
const TOPICS = 'study_topics'
const LESSONS = 'study_lessons'

async function list(table, userId, filters = {}, order = { column: 'name', ascending: true }) {
  let query = databaseProvider.from(table).select('*').eq('user_id', userId)
  Object.entries(filters).forEach(([key, value]) => {
    if (value == null) return
    query = query.eq(key, value)
  })
  query = query.order(order.column, { ascending: order.ascending })
  const { data, error } = await query
  if (error) throw error
  return data || []
}

async function getOrCreate(table, userId, match, insert) {
  const existing = await list(table, userId, match)
  if (existing.length > 0) return existing[0]
  const { data, error } = await databaseProvider
    .from(table)
    .insert({ user_id: userId, ...insert })
    .select()
    .single()
  if (error) {
    const { data: retry } = await databaseProvider
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .match(match)
      .limit(1)
      .maybeSingle()
    if (!error && retry) return retry
    throw error
  }
  return data
}

export const StudyEntityRepository = {
  async getSources(userId) {
    return list(SOURCES, userId)
  },

  async getOrCreateSource(userId, { name, sourceType = 'website', domain = '', icon = '', url = '' }) {
    return getOrCreate(SOURCES, userId, { name }, { name, source_type: sourceType, domain, icon, url, is_custom: true })
  },

  async getEducators(userId) {
    return list(EDUCATORS, userId)
  },

  async getEducatorsBySource(userId, sourceId) {
    return list(EDUCATORS, userId, sourceId ? { source_id: sourceId } : {}, { column: 'name', ascending: true })
  },

  async getOrCreateEducator(userId, { name, sourceId = null }) {
    return getOrCreate(EDUCATORS, userId, { name }, { name, source_id: sourceId })
  },

  async getCourses(userId, sourceId = null) {
    return list(COURSES, userId, sourceId ? { source_id: sourceId } : {})
  },

  async getCoursesByEducator(userId, educatorId) {
    return list(COURSES, userId, educatorId ? { educator_id: educatorId } : {})
  },

  async getOrCreateCourse(userId, { sourceId = null, educatorId = null, name, description = '' }) {
    return getOrCreate(COURSES, userId, { source_id: sourceId, name }, { source_id: sourceId, educator_id: educatorId, name, description })
  },

  async getTopics(userId, courseId = null, parentId = null) {
    const filters = {}
    if (courseId) filters.course_id = courseId
    if (parentId !== undefined) filters.parent_id = parentId
    return list(TOPICS, userId, filters)
  },

  async getOrCreateTopic(userId, { courseId = null, parentId = null, name }) {
    return getOrCreate(TOPICS, userId, { course_id: courseId, parent_id: parentId, name }, { course_id: courseId, parent_id: parentId, name })
  },

  async getLessons(userId, { courseId = null, topicId = null } = {}) {
    const filters = {}
    if (courseId) filters.course_id = courseId
    if (topicId) filters.topic_id = topicId
    return list(LESSONS, userId, filters, { column: 'lesson_number', ascending: true })
  },

  async getLessonById(userId, lessonId) {
    const { data, error } = await databaseProvider
      .from(LESSONS)
      .select('*')
      .eq('user_id', userId)
      .eq('id', lessonId)
      .maybeSingle()
    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  async getOrCreateLesson(userId, { courseId = null, topicId = null, sourceId = null, educatorId = null, lessonNumber = null, title, contentType = 'video', sourceUrl = '' }) {
    return getOrCreate(
      LESSONS,
      userId,
      { course_id: courseId, lesson_number: lessonNumber },
      { course_id: courseId, topic_id: topicId, source_id: sourceId, educator_id: educatorId, lesson_number: lessonNumber, title, content_type: contentType, source_url: sourceUrl }
    )
  },

  async updateLesson(userId, lessonId, updates) {
    const { data, error } = await databaseProvider
      .from(LESSONS)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('id', lessonId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateLessonProgress(userId, lessonId, progress) {
    const lesson = await this.getLessonById(userId, lessonId)
    if (!lesson) return null
    const clamped = Math.max(0, Math.min(100, Math.round(progress)))
    return this.updateLesson(userId, lessonId, {
      progress: clamped,
      status: clamped >= 100 ? 'completed' : clamped > 0 ? 'in_progress' : 'pending',
      completed_at: clamped >= 100 ? new Date().toISOString() : null,
    })
  },
}

export default StudyEntityRepository
