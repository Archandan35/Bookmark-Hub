import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { keepAliveService } from './services/keepAliveService'
import './styles/index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        registration.update()
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          if (!installing) return
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              installing.postMessage('skipWaiting')
            }
          })
        })
      })
      .catch(() => {})

    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })
  })
}

keepAliveService.start();

if (import.meta.env.PROD) {
  window.addEventListener('error', (event) => {
    if (event.message?.includes('password') || event.message?.includes('token') || event.message?.includes('secret')) {
      event.preventDefault()
    }
  })

  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('password') || event.reason?.message?.includes('token')) {
      event.preventDefault()
    }
  })
}
