/* @refresh reset */
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const AuthContext = createContext(null)

// Mock users — fallback when backend is offline
const MOCK_USERS = {
  'preassessor': { id:1, name:'Priya Sharma',  role:'Pre Assessor', email:'priya@dhdigital.co.in',  avatar:'PS', roles:['Pre Assessor'] },
  'assessor':    { id:2, name:'Rahul Mehta',   role:'Assessor',     email:'rahul@dhdigital.co.in',  avatar:'RM', roles:['Assessor'] },
  'verifier':    { id:3, name:'Anita Desai',   role:'Verifier',     email:'anita@dhdigital.co.in',  avatar:'AD', roles:['Verifier'] },
  'admin':       { id:4, name:'Suresh Kumar',  role:'Admin',        email:'suresh@dhdigital.co.in', avatar:'SK', roles:['Admin'] },
}

const IDLE_MS = (parseInt(import.meta.env?.VITE_IDLE_TIMEOUT_MINUTES) || 5) * 60 * 1000
const WARN_MS = 60 * 1000
const BC_KEY  = 'poc_auth'

const mockLogin = async (username, password) => {
  await new Promise(r => setTimeout(r, 600))
  const u = MOCK_USERS[username?.toLowerCase()]
  if (!u || password !== 'password123') throw new Error('Invalid credentials.')
  return { ...u, access_token: 'mock-token', loginTime: new Date().toISOString() }
}

const realLogin = async (username, password) => {
  const base = import.meta.env?.VITE_API_URL || 'http://localhost:3009'
  const res = await fetch(`${base}/api/auth/keycloak/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    signal: AbortSignal.timeout(5000),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Login failed')
  return { ...data.user, access_token: data.access_token, loginTime: new Date().toISOString() }
}

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(() => { try { const s = sessionStorage.getItem('poc_user'); return s ? JSON.parse(s) : null } catch { return null } })
  const [idleWarning, setIdleWarning] = useState(false)
  const idleTimer = useRef(null)
  const warnTimer = useRef(null)
  const bc        = useRef(null)

  useEffect(() => {
    try {
      bc.current = new BroadcastChannel(BC_KEY)
      bc.current.onmessage = e => { if (e.data === 'logout') { sessionStorage.removeItem('poc_user'); setUser(null) } }
    } catch {}
    return () => { try { bc.current?.close() } catch {} }
  }, [])

  const resetIdleTimer = useCallback(() => {
    clearTimeout(idleTimer.current); clearTimeout(warnTimer.current); setIdleWarning(false)
    if (!sessionStorage.getItem('poc_user')) return
    warnTimer.current = setTimeout(() => setIdleWarning(true), IDLE_MS - WARN_MS)
    idleTimer.current = setTimeout(() => {
      sessionStorage.removeItem('poc_user'); setUser(null); setIdleWarning(false)
      try { bc.current?.postMessage('logout') } catch {}
    }, IDLE_MS)
  }, [])

  useEffect(() => {
    if (!user) return
    const evts = ['mousemove','keydown','mousedown','touchstart','scroll']
    evts.forEach(e => window.addEventListener(e, resetIdleTimer, { passive: true }))
    resetIdleTimer()
    return () => { evts.forEach(e => window.removeEventListener(e, resetIdleTimer)); clearTimeout(idleTimer.current); clearTimeout(warnTimer.current) }
  }, [user, resetIdleTimer])

  const login = useCallback(async (username, password) => {
    let userData
    try {
      // Try real backend first
      userData = await realLogin(username, password)
    } catch {
      // Fall back to mock auth (works offline)
      userData = await mockLogin(username, password)
    }
    sessionStorage.setItem('poc_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback((broadcast = true) => {
    try {
      const base = import.meta.env?.VITE_API_URL || 'http://localhost:3009'
      const stored = sessionStorage.getItem('poc_user')
      const token = stored ? JSON.parse(stored).access_token : null
      if (token && token !== 'mock-token') {
        fetch(`${base}/api/auth/logout-audit`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } }).catch(() => {})
      }
    } catch {}
    sessionStorage.removeItem('poc_user'); setUser(null); setIdleWarning(false)
    clearTimeout(idleTimer.current); clearTimeout(warnTimer.current)
    if (broadcast) { try { bc.current?.postMessage('logout') } catch {} }
  }, [])

  const extendSession = useCallback(() => { resetIdleTimer(); setIdleWarning(false) }, [resetIdleTimer])

  return (
    <AuthContext.Provider value={{ user, login, logout, idleWarning, extendSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
