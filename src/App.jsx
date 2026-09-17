import { useEffect, useState, Suspense } from 'react'
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

const AUTO_REFRESH_KEY = 'bookmarkhub_last_auto_refresh'
const AUTO_REFRESH_DAYS = 6

/** Reloads the page automatically every 6 days at 00:00 AM. */
function scheduleAutoRefresh() {
  const now = new Date()
  let last = null
  try {
    const raw = localStorage.getItem(AUTO_REFRESH_KEY)
    if (raw) last = new Date(raw)
  } catch {
    last = null
  }
  if (!last || Number.isNaN(last.getTime())) last = now

  const next = new Date(last)
  next.setDate(next.getDate() + AUTO_REFRESH_DAYS)
  next.setHours(0, 0, 0, 0)

  let ms = next.getTime() - now.getTime()
  if (ms <= 0) {
    // Missed window (e.g. device was off) — restart the cycle from now.
    last = now
    next.setTime(last.getTime())
    next.setDate(next.getDate() + AUTO_REFRESH_DAYS)
    next.setHours(0, 0, 0, 0)
    ms = next.getTime() - now.getTime()
  }

  try {
    localStorage.setItem(AUTO_REFRESH_KEY, last.toISOString())
  } catch {
    // ignore storage errors
  }

  return setTimeout(() => {
    try {
      localStorage.setItem(AUTO_REFRESH_KEY, new Date().toISOString())
    } catch {
      // ignore storage errors
    }
    window.location.reload()
  }, ms)
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
          const result = await AuthService.getSession()
          const session = result?.session ?? result?.data?.session
          if (session) {
            setSession(session)
            setUser(session.user)
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
    const timer = scheduleAutoRefresh()
    return () => clearTimeout(timer)
  }, [])

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
