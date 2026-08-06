import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './routes'
import { useAuthStore } from './hooks/useStore'
import { AuthService } from './services/AuthService'
import { useAppStore } from './hooks/useStore'
import { ErrorBoundary } from './components/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

export default function App() {
  const { setInitialized, setUser, setSession, user } = useAuthStore()
  const { theme } = useAppStore()

  useEffect(() => {
    async function init() {
      try {
        const session = await AuthService.getSession()
        if (session?.data?.session) {
          setSession(session.data.session)
          setUser(session.data.session.user)
        }
      } catch (err) {
        // No session found
      } finally {
        setInitialized(true)
      }
    }
    init()
  }, [setInitialized, setUser, setSession])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [theme])

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
