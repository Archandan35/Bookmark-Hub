import databaseProvider from '../providers/DatabaseProvider'
import { isSupabaseConfigured } from '../providers/supabase/client'
import { generateId } from '../utils/helpers'

const TABLE = 'exams'

function storageKey(userId) {
  return `bookmarkhub_exams_${userId || 'guest'}`
}

function readLocal(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocal(userId, rows) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(rows))
  } catch {
    // storage full / unavailable — ignore
  }
}

async function supabaseAvailable() {
  if (!isSupabaseConfigured()) return false
  try {
    databaseProvider._checkConfigured()
    return true
  } catch {
    return false
  }
}

export const ExamRepository = {
  async getAll(userId) {
    if (!userId) return readLocal(null)
    if (await supabaseAvailable()) {
      try {
        const { data, error } = await databaseProvider
          .from(TABLE)
          .select('*')
          .eq('user_id', userId)
          .order('exam_date', { ascending: true })
        if (error) throw error
        // mirror to local cache so refresh/offline still works
        writeLocal(userId, data || [])
        return data || []
      } catch {
        return readLocal(userId)
      }
    }
    return readLocal(userId)
  },

  async create(exam) {
    const record = {
      id: exam.id || generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...exam,
    }
    if (await supabaseAvailable()) {
      try {
        const { data, error } = await databaseProvider.from(TABLE).insert(record).select().single()
        if (error) throw error
        const rows = readLocal(record.user_id)
        writeLocal(record.user_id, [data, ...rows])
        return data
      } catch {
        const rows = readLocal(record.user_id)
        writeLocal(record.user_id, [record, ...rows])
        return record
      }
    }
    const rows = readLocal(record.user_id)
    writeLocal(record.user_id, [record, ...rows])
    return record
  },

  async update(id, userId, updates) {
    const payload = { ...updates, updated_at: new Date().toISOString() }
    if (await supabaseAvailable()) {
      try {
        const { data, error } = await databaseProvider
          .from(TABLE)
          .update(payload)
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        const rows = readLocal(userId).map((r) => (r.id === id ? { ...r, ...data } : r))
        writeLocal(userId, rows)
        return data
      } catch {
        // fall through to local
      }
    }
    const rows = readLocal(userId).map((r) => (r.id === id ? { ...r, ...payload } : r))
    writeLocal(userId, rows)
    return rows.find((r) => r.id === id) || null
  },

  async remove(id, userId) {
    if (await supabaseAvailable()) {
      try {
        const { error } = await databaseProvider.from(TABLE).delete().eq('id', id)
        if (error) throw error
      } catch {
        // still remove locally
      }
    }
    writeLocal(userId, readLocal(userId).filter((r) => r.id !== id))
    return true
  },
}

export default ExamRepository
