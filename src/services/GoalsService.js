const SUPABASE_URL = 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key'

async function request(endpoint, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Request failed')
  }

  return response.json()
}

export const GoalsService = {
  async getAll(userId) {
    return request(`/goals?user_id=eq.${userId}&order=created_at.desc`)
  },

  async getById(id) {
    return request(`/goals?id=eq.${id}&single=true`)
  },

  async create(userId, data) {
    return request('/goals', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, ...data }),
      headers: { Prefer: 'return=representation' },
    })
  },

  async update(id, data) {
    return request(`/goals?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { Prefer: 'return=representation' },
    })
  },

  async delete(id) {
    return request(`/goals?id=eq.${id}`, { method: 'DELETE' })
  },

  async toggleComplete(id, completed) {
    return this.update(id, { completed, updated_at: new Date().toISOString() })
  },

  async updateProgress(id, progress) {
    return this.update(id, { progress, updated_at: new Date().toISOString() })
  },

  async getStats(userId) {
    const goals = await this.getAll(userId)
    const total = goals.length
    const completed = goals.filter(g => g.completed).length
    const inProgress = goals.filter(g => !g.completed && g.progress > 0).length
    const notStarted = goals.filter(g => !g.completed && g.progress === 0).length
    const totalProgress = total > 0 ? Math.round((goals.reduce((sum, g) => sum + (g.progress || 0), 0) / total)) : 0

    return {
      total,
      completed,
      inProgress,
      notStarted,
      totalProgress,
      byCategory: goals.reduce((acc, g) => {
        const cat = g.category || 'other'
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      }, {}),
    }
  },
}