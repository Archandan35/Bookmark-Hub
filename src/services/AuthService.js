import databaseProvider from '../providers/DatabaseProvider'

export const AuthService = {
  async signUp(email, password, name, username, mobile) {
    const result = await databaseProvider.signUp(email, password, {
      name,
      username,
      mobile,
    })

    if (databaseProvider.isConfigured && result?.data?.user) {
      try {
        await databaseProvider.from('users').upsert({
          id: result.data.user.id,
          email,
          username: username || email.split('@')[0],
          name: name || '',
        }, { onConflict: 'id' })
      } catch (err) {
        // Non-critical: trigger may have already created the record
      }
    }

    return result
  },

  async signIn(identifier, password) {
    const result = await databaseProvider.signIn(identifier, password)
    return result
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
