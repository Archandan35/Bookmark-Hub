import { useEffect, lazy, Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './routes'
import { useAuthStore } from './hooks/useStore'
import { AuthService } from './services/AuthService'
import { useAppStore } from './hooks/useStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import { Skeleton } from './components/Skeleton'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

function AppLoader() {
  return (
    <div className="app-loader">
      <div className="app-loader-logo">📚</div>
      <Skeleton className="app-loader-bar" />
    </div>
  )
}

export default function App() {
  const { setInitialized, setUser, setSession } = useAuthStore()
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
        <ToastProvider>
          <Suspense fallback={<AppLoader />}>
            <RouterProvider router={router} />
          </Suspense>
        </ToastProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
