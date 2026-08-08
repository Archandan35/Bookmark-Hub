import { StudyEntityRepository } from '../repositories/StudyEntityRepository'

function extractDomain(url) {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/**
 * Normalized study-dimension entities (source / educator / course / topic / lesson).
 * Every method is offline-tolerant: a failed remote call falls back to an in-memory
 * identity object so the Study Session flow never blocks on the network.
 */
export const StudyEntityService = {
  async getSources(userId) {
    if (!userId) return []
    try {
      return await StudyEntityRepository.getSources(userId)
    } catch {
      return []
    }
  },

  async getOrCreateSource(userId, { name, sourceType = 'website', url = '', icon = '' }) {
    const cleanName = (name || '').trim()
    if (!cleanName) throw new Error('Source name is required')
    try {
      return await StudyEntityRepository.getOrCreateSource(userId, {
        name: cleanName,
        sourceType,
        url,
        domain: extractDomain(url),
        icon,
      })
    } catch {
      return {
        id: cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        user_id: userId,
        name: cleanName,
        source_type: sourceType,
        domain: extractDomain(url),
        icon,
        url,
        is_custom: true,
        _offline: true,
      }
    }
  },

  async getEducators(userId) {
    if (!userId) return []
    try {
      return await StudyEntityRepository.getEducators(userId)
    } catch {
      return []
    }
  },

  async getEducatorsBySource(userId, sourceId) {
    if (!userId) return []
    try {
      return await StudyEntityRepository.getEducatorsBySource(userId, sourceId)
    } catch {
      return []
    }
  },

  async getOrCreateEducator(userId, { name, sourceId = null }) {
    const cleanName = (name || '').trim()
    if (!cleanName) throw new Error('Educator name is required')
    try {
      return await StudyEntityRepository.getOrCreateEducator(userId, { name: cleanName, sourceId })
    } catch {
      return { id: `educator-${cleanName}`, user_id: userId, name: cleanName, source_id: sourceId, _offline: true }
    }
  },

  async getCourses(userId, sourceId = null) {
    if (!userId) return []
    try {
      return await StudyEntityRepository.getCourses(userId, sourceId)
    } catch {
      return []
    }
  },

  async getCoursesByEducator(userId, educatorId) {
    if (!userId) return []
    try {
      return await StudyEntityRepository.getCoursesByEducator(userId, educatorId)
    } catch {
      return []
    }
  },

  async getOrCreateCourse(userId, { sourceId = null, educatorId = null, name }) {
    const cleanName = (name || '').trim()
    if (!cleanName) throw new Error('Course name is required')
    try {
      return await StudyEntityRepository.getOrCreateCourse(userId, { sourceId, educatorId, name: cleanName })
    } catch {
      return { id: `course-${cleanName}`, user_id: userId, source_id: sourceId, educator_id: educatorId, name: cleanName, _offline: true }
    }
  },

  async getTopics(userId, courseId = null, parentId = null) {
    if (!userId) return []
    try {
      return await StudyEntityRepository.getTopics(userId, courseId, parentId)
    } catch {
      return []
    }
  },

  async getOrCreateTopic(userId, { courseId = null, parentId = null, name }) {
    const cleanName = (name || '').trim()
    if (!cleanName) return null
    try {
      return await StudyEntityRepository.getOrCreateTopic(userId, { courseId, parentId, name: cleanName })
    } catch {
      return { id: `topic-${cleanName}`, user_id: userId, course_id: courseId, parent_id: parentId, name: cleanName, _offline: true }
    }
  },

  async getLessons(userId, { courseId = null, topicId = null } = {}) {
    if (!userId) return []
    try {
      return await StudyEntityRepository.getLessons(userId, { courseId, topicId })
    } catch {
      return []
    }
  },

  async getOrCreateLesson(userId, {
    courseId = null,
    topicId = null,
    sourceId = null,
    educatorId = null,
    lessonNumber = null,
    title,
    contentType = 'video',
    sourceUrl = '',
  }) {
    const cleanTitle = (title || '').trim()
    if (!cleanTitle) throw new Error('Lesson title is required')
    try {
      return await StudyEntityRepository.getOrCreateLesson(userId, {
        courseId,
        topicId,
        sourceId,
        educatorId,
        lessonNumber: lessonNumber == null || lessonNumber === '' ? null : Math.max(1, Math.floor(Number(lessonNumber) || 1)),
        title: cleanTitle,
        contentType,
        sourceUrl,
      })
    } catch {
      return {
        id: `lesson-${cleanTitle}-${lessonNumber || 'x'}`,
        user_id: userId,
        course_id: courseId,
        topic_id: topicId,
        source_id: sourceId,
        educator_id: educatorId,
        lesson_number: lessonNumber,
        title: cleanTitle,
        content_type: contentType,
        source_url: sourceUrl,
        _offline: true,
      }
    }
  },

  async updateLessonProgress(userId, lessonId, progress) {
    if (!lessonId) return null
    try {
      return await StudyEntityRepository.updateLessonProgress(userId, lessonId, progress)
    } catch {
      return null
    }
  },

  CONTENT_TYPES: [
    { value: 'video', label: 'Video' },
    { value: 'audio', label: 'Audio' },
    { value: 'pdf', label: 'PDF' },
    { value: 'website', label: 'Website' },
    { value: 'ebook', label: 'Ebook' },
    { value: 'notes', label: 'Notes' },
    { value: 'practice', label: 'Practice' },
    { value: 'other', label: 'Other' },
  ],
}

export default StudyEntityService
