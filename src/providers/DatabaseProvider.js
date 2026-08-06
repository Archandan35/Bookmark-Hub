import { supabase, isSupabaseConfigured } from './supabase/client'
import { getCSRFToken } from '../utils/security'

class DatabaseProvider {
  constructor() {
    this.client = supabase
    this.isConfigured = isSupabaseConfigured()
  }

  _checkConfigured() {
    if (!this.isConfigured || !this.client) {
      throw new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
    }
  }

  async signUp(email, password, metadata = {}) {
    this._checkConfigured()
    const { data, error } = await this.client.auth.signUp({ email, password, options: { data: metadata } })
    if (error) throw error
    return data
  }

  async signIn(identifier, password) {
    this._checkConfigured()
    const { data, error } = await this.client.auth.signInWithPassword({ email: identifier, password })
    if (error) throw error
    return data
  }

  async signOut() {
    this._checkConfigured()
    const { error } = await this.client.auth.signOut()
    if (error) throw error
  }

  async getSession() {
    if (!this.isConfigured || !this.client) {
      return { data: { session: null }, error: null }
    }
    const { data, error } = await this.client.auth.getSession()
    if (error) throw error
    return data
  }

  async getUser() {
    this._checkConfigured()
    const { data, error } = await this.client.auth.getUser()
    if (error) throw error
    return data.user
  }

  from(table) {
    this._checkConfigured()
    return this.client.from(table)
  }

  rpc(fn, params) {
    this._checkConfigured()
    return this.client.rpc(fn, params, {
      headers: { 'x-csrf-token': getCSRFToken() },
    })
  }
}

export const databaseProvider = new DatabaseProvider()
export default databaseProvider
