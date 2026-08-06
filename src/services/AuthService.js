import databaseProvider from '../providers/DatabaseProvider'

function normalizeAuthResult(result) {
  if (result?.data) {
    return { user: result.data.user, session: result.data.session ?? null }
  }
  if (result?.user) {
    return { user: result.user, session: result.session ?? null }
  }
  return { user: null, session: null }
}

export const AuthService = {
  async signUp(email, password, name, username, mobile) {
    const result = await databaseProvider.signUp(email, password, {
      name,
      username,
      mobile,
    })

    const { user } = normalizeAuthResult(result)

    if (databaseProvider.isConfigured && user) {
      try {
        await databaseProvider.from('users').upsert({
          id: user.id,
          email,
          username: username || email.split('@')[0],
          name: name || '',
        }, { onConflict: 'id' })
      } catch (err) {
        // Non-critical: trigger may have already created the record
      }
    }

    return { user, session: null }
  },

  async signIn(identifier, password) {
    const result = await databaseProvider.signIn(identifier, password)
    return normalizeAuthResult(result)
  },

  async signOut() {
    return databaseProvider.signOut()
  },

  async getSession() {
    return databaseProvider.getSession()
  },

  async getUser() {
    return databaseProvider.getUser()
  },

  onAuthStateChange(callback) {
    if (!databaseProvider.isConfigured) {
      return { data: { subscription: { unsubscribe: () => {} } } }
    }
    return databaseProvider.client.auth.onAuthStateChange(callback)
  },
}
