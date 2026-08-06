import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import { Auth } from '../pages/Auth'
import { Skeleton } from '../components/Skeleton'

const Dashboard = lazy(() => import('../pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Bookmarks = lazy(() => import('../pages/Bookmarks').then((m) => ({ default: m.Bookmarks })))
const Collections = lazy(() => import('../pages/Collections').then((m) => ({ default: m.Collections })))
const StudySessions = lazy(() => import('../pages/StudySessions').then((m) => ({ default: m.StudySessions })))
const Settings = lazy(() => import('../pages/Settings').then((m) => ({ default: m.Settings })))
const Trash = lazy(() => import('../pages/Trash').then((m) => ({ default: m.Trash })))

function PageLoader() {
  return (
    <div className="page-loader">
      <div className="bookmarks-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card skeleton-card">
            <Skeleton className="skeleton-thumbnail" />
            <div className="card-body">
              <Skeleton className="skeleton-title" />
              <Skeleton className="skeleton-text" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PageWrapper({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

function ProtectedRoute({ children }) {
  const { user, initialized } = useAuthStore()
  if (!initialized) {
    return (
      <div className="app-loader">
        <div className="app-loader-logo">📚</div>
        <Skeleton className="app-loader-bar" />
      </div>
    )
  }
  if (!user) return <Auth />
  return children
}

import { useAuthStore } from '../hooks/useStore'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <PageWrapper><Dashboard /></PageWrapper> },
      { path: 'bookmarks', element: <PageWrapper><Bookmarks /></PageWrapper> },
      { path: 'favorites', element: <PageWrapper><Bookmarks /></PageWrapper> },
      { path: 'pinned', element: <PageWrapper><Bookmarks /></PageWrapper> },
      { path: 'recent', element: <PageWrapper><Bookmarks /></PageWrapper> },
      { path: 'collections', element: <PageWrapper><Collections /></PageWrapper> },
      { path: 'study', element: <PageWrapper><Study /></PageWrapper> },
      { path: 'settings', element: <PageWrapper><Settings /></PageWrapper> },
      { path: 'trash', element: <PageWrapper><Trash /></PageWrapper> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
