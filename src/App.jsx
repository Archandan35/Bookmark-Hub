import { useEffect, useState, lazy, Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './routes'
import { useAuthStore } from './hooks/useStore'
import { AuthService } from './services/AuthService'
import { useAppStore } from './hooks/useStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import { SetupWizard } from './components/SetupWizard'
import { Skeleton } from './components/Skeleton'
import { isSupabaseConfigured } from './providers/supabase/client'

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
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        if (!isSupabaseConfigured()) {
          const setupComplete = localStorage.getItem('bookmarkhub_setup_complete')
          if (!setupComplete) {
            setShowSetup(true)
          }
        } else {
          const session = await AuthService.getSession()
          if (session?.data?.session) {
            setSession(session.data.session)
            setUser(session.data.session.user)
          }
        }
      } catch (err) {
        // No session found
      } finally {
        setInitialized(true)
      }
    }
    init()

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = AuthService.onAuthStateChange((event, session) => {
        if (session) {
          setSession(session)
          setUser(session.user)
        } else {
          setSession(null)
          setUser(null)
        }
      })
      return () => subscription?.unsubscribe()
    }
  }, [setInitialized, setUser, setSession])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [theme])

  const handleSetupComplete = (config) => {
    localStorage.setItem('bookmarkhub_setup_complete', 'true')
    localStorage.setItem('bookmarkhub_config', JSON.stringify(config))
    setShowSetup(false)
    window.location.reload()
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ToastProvider>
          <Suspense fallback={<AppLoader />}>
            <RouterProvider router={router} />
          </Suspense>
          <SetupWizard
            isOpen={showSetup}
            onClose={() => setShowSetup(false)}
            onComplete={handleSetupComplete}
          />
        </ToastProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
