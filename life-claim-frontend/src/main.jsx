import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

try {
  const saved = localStorage.getItem('life-claims-theme')
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
} catch {
  /* ignore */
}

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
