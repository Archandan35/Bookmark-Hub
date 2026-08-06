import databaseProvider from '../providers/DatabaseProvider'

export const AuthService = {
  async signUp(email, password, name, username, mobile) {
    const result = await databaseProvider.signUp(email, password, {
      name,
      username,
      mobile,
    })
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
