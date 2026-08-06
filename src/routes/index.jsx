import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import { Dashboard } from '../pages/Dashboard'
import { Bookmarks } from '../pages/Bookmarks'
import { Collections } from '../pages/Collections'
import { Study } from '../pages/Study'
import { Settings } from '../pages/Settings'
import { Trash } from '../pages/Trash'
import { Auth } from '../pages/Auth'
import { useAuthStore } from '../hooks/useStore'

function ProtectedRoute({ children }) {
  const { user } = useAuthStore()
  if (!user) return <Auth />
  return children
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'bookmarks', element: <Bookmarks /> },
      { path: 'favorites', element: <Bookmarks /> },
      { path: 'pinned', element: <Bookmarks /> },
      { path: 'recent', element: <Bookmarks /> },
      { path: 'collections', element: <Collections /> },
      { path: 'study', element: <Study /> },
      { path: 'settings', element: <Settings /> },
      { path: 'trash', element: <Trash /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
