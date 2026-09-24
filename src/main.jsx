import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// Register service worker with auto-update
// Shows a subtle toast when new content is available
const updateSW = registerSW({
  onNeedRefresh() {
    // New version available — auto-update in background
    updateSW(true)
  },
  onOfflineReady() {
    console.log('✅ Surplus-to-Shelter is ready to work offline!')
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
