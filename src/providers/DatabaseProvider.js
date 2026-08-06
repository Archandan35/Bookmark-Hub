import { supabase, isSupabaseConfigured } from './supabase/client'

class DatabaseProvider {
  constructor() {
    this.client = supabase
    this.isConfigured = isSupabaseConfigured()
  }

  async signUp(email, password, metadata = {}) {
    if (!this.isConfigured) return this._mockSignUp(email, password, metadata)
    const { data, error } = await this.client.auth.signUp({ email, password, options: { data: metadata } })
    if (error) throw error
    return data
  }

  async signIn(email, password) {
    if (!this.isConfigured) return this._mockSignIn(email, password)
    const { data, error } = await this.client.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async signOut() {
    if (!this.isConfigured) return this._mockSignOut()
    const { error } = await this.client.auth.signOut()
    if (error) throw error
  }

  async getSession() {
    if (!this.isConfigured) return this._mockGetSession()
    const { data, error } = await this.client.auth.getSession()
    if (error) throw error
    return data
  }

  async getUser() {
    if (!this.isConfigured) return this._mockGetUser()
    const { data, error } = await this.client.auth.getUser()
    if (error) throw error
    return data.user
  }

  from(table) {
    if (!this.isConfigured) return this._mockFrom(table)
    return this.client.from(table)
  }

  rpc(fn, params) {
    if (!this.isConfigured) return this._mockRpc(fn, params)
    return this.client.rpc(fn, params)
  }

  _mockSignUp(email, password, metadata) {
    const user = { id: crypto.randomUUID(), email, user_metadata: metadata }
    return { data: { user, session: { user, access_token: 'mock-token' } }, error: null }
  }

  _mockSignIn(email, password) {
    const user = { id: crypto.randomUUID(), email, user_metadata: { name: email.split('@')[0] } }
    return { data: { user, session: { user, access_token: 'mock-token' } }, error: null }
  }

  _mockSignOut() {
    return { error: null }
  }

  _mockGetSession() {
    return { data: { session: null }, error: null }
  }

  _mockGetUser() {
    return { data: { user: null }, error: null }
  }

  _mockFrom(table) {
    return {
      select: () => ({
        eq: () => ({ single: async () => ({ data: null, error: null }), then: async () => ({ data: [], error: null }) }),
        in: () => ({ then: async () => ({ data: [], error: null }) }),
        order: () => ({ limit: async () => ({ data: [], error: null }), then: async () => ({ data: [], error: null }) }),
        or: () => ({ then: async () => ({ data: [], error: null }) }),
        ilike: () => ({ then: async () => ({ data: [], error: null }) }),
      }),
      insert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
    }
  }

  _mockRpc(fn, params) {
    return Promise.resolve({ data: null, error: null })
  }
}

export const databaseProvider = new DatabaseProvider()
export default databaseProvider
