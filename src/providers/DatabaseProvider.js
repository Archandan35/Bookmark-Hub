import { supabase, isSupabaseConfigured } from './supabase/client'
import { getCSRFToken } from '../utils/security'

class DatabaseProvider {
  constructor() {
    this.client = supabase
    this.isConfigured = isSupabaseConfigured()
  }

  async signUp(email, password, metadata = {}) {
    const { data, error } = await this.client.auth.signUp({ email, password, options: { data: metadata } })
    if (error) throw error
    return data
  }

  async signIn(identifier, password) {
    const { data, error } = await this.client.auth.signInWithPassword({ email: identifier, password })
    if (error) throw error
    return data
  }

  async signOut() {
    const { error } = await this.client.auth.signOut()
    if (error) throw error
  }

  async getSession() {
    const { data, error } = await this.client.auth.getSession()
    if (error) throw error
    return data
  }

  async getUser() {
    const { data, error } = await this.client.auth.getUser()
    if (error) throw error
    return data.user
  }

  from(table) {
    return this.client.from(table)
  }

  rpc(fn, params) {
    return this.client.rpc(fn, params, {
      headers: { 'x-csrf-token': getCSRFToken() },
    })
  }
}

export const databaseProvider = new DatabaseProvider()
export default databaseProvider
