import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import authService from '../services/authService'
import { AUTH_LOGOUT_CHANNEL } from '../util/authBroadcast'

const AuthContext = createContext(null)

const IDLE_MS = (parseInt(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES) || 5) * 60 * 1000
const WARN_MS = 60 * 1000

function decodeTokenUser(token) {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
  )
  const payload = JSON.parse(jsonPayload)
  const roles = payload.realm_access?.roles || payload.roles || []
  const username = payload.preferred_username || payload.sub
  const name = [payload.given_name, payload.family_name].filter(Boolean).join(' ') || username
  return {
    id: payload.sub,
    username,
    name,
    email: payload.email,
    role: roles[0] || '',
    roles,
    avatar: (payload.given_name?.[0] || username[0] || '').toUpperCase() + (payload.family_name?.[0] || '').toUpperCase(),
    access_token: token,
    loginTime: new Date().toISOString(),
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [idleWarning, setIdleWarning] = useState(false)
  const idleTimer = useRef(null)
  const warnTimer = useRef(null)
  const bc = useRef(null)

  const clearSession = useCallback(() => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('refreshToken')
    sessionStorage.removeItem('loggedUser')
    setUser(null)
    setIdleWarning(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const auth = await authService.authenticate()
        const token = sessionStorage.getItem('token')
        if (!cancelled && token) setUser(decodeTokenUser(token))
        if (!cancelled && auth?.preferred_username) {
          sessionStorage.setItem('loggedUser', auth.preferred_username)
        }
      } catch {
        if (!cancelled) clearSession()
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [clearSession])

  useEffect(() => {
    try {
      bc.current = new BroadcastChannel(AUTH_LOGOUT_CHANNEL)
      bc.current.onmessage = () => clearSession()
    } catch {}
    return () => { try { bc.current?.close() } catch {} }
  }, [clearSession])

  const resetIdleTimer = useCallback(() => {
    clearTimeout(idleTimer.current)
    clearTimeout(warnTimer.current)
    setIdleWarning(false)
    if (!sessionStorage.getItem('token')) return
    warnTimer.current = setTimeout(() => setIdleWarning(true), IDLE_MS - WARN_MS)
    idleTimer.current = setTimeout(async () => {
      sessionStorage.setItem('auth_logout_reason', 'idle')
      await authService.logout({ logoutReason: 'idle' }).catch(() => {})
      clearSession()
      try { bc.current?.postMessage('logout') } catch {}
    }, IDLE_MS)
  }, [clearSession])

  useEffect(() => {
    if (!user) return
    const evts = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'click']
    evts.forEach(e => window.addEventListener(e, resetIdleTimer, { passive: true }))
    resetIdleTimer()
    return () => {
      evts.forEach(e => window.removeEventListener(e, resetIdleTimer))
      clearTimeout(idleTimer.current)
      clearTimeout(warnTimer.current)
    }
  }, [user, resetIdleTimer])

  const login = useCallback(async (username, password) => {
    const data = await authService.login(username, password)
    const userData = decodeTokenUser(data.access_token)
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(async (broadcast = true, reason = 'user') => {
    sessionStorage.setItem('auth_logout_reason', reason)
    await authService.logout({ logoutReason: reason }).catch(() => {})
    clearSession()
    if (broadcast) { try { bc.current?.postMessage('logout') } catch {} }
  }, [clearSession])

  const extendSession = useCallback(() => { resetIdleTimer(); setIdleWarning(false) }, [resetIdleTimer])

  const hasRole = useCallback((required) => {
    if (!user?.roles?.length) return false
    const req = Array.isArray(required) ? required : [required]
    return req.some(r => user.roles.includes(r))
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, idleWarning, extendSession, hasRole, authenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
