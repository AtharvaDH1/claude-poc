import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import dashboardService from '../services/dashboardService'
import Breadcrumbs from '../components/Breadcrumbs'
import GlobalLoadingBar from '../components/GlobalLoadingBar'
import {
  LayoutDashboard, Search, Bell, ChevronDown, LogOut, Menu, X,
  FileText, Users, CheckSquare, Shield, Settings, Star,
  Layers, ChevronRight, ClipboardList, ScanSearch,
  BarChart3, User,
} from 'lucide-react'
import AskMeChat from '../components/AskMeChat'
import { isAdminOnlyUser, hasAdminRole } from '../util/loginHelpers'
import { mapDashboardActivities } from '../util/mapDashboardActivity'
import { getActivityStyle } from '../util/activityStyles'

const T = {
  sidebar: '#0F172A', sidebarBorder: 'rgba(255,255,255,0.06)',
  sidebarHover: 'rgba(255,255,255,0.05)', sidebarActive: 'rgba(29,78,216,0.28)',
  sidebarActiveText: '#93C5FD',
  primary: '#1D4ED8', primaryHover: '#1E40AF',
  pageBg: '#F1F5F9', card: '#FFFFFF',
  border: '#E2E8F0', borderSubtle: '#F1F5F9',
  textPrimary: '#0F172A', textSecondary: '#334155',
  textMuted: '#64748B', textSubtle: '#94A3B8',
}

const NAV_ITEMS = [
  { id:'dashboard',        path:'/dashboard',        icon:LayoutDashboard, label:'Dashboard',        operational: true },
  { id:'admin-overview',   path:'/admin',            icon:BarChart3,       label:'Admin Overview',   roles:['admin'], adminNav: true },
  { id:'admin-claims',     path:'/admin/claim-search', icon:FileText,      label:'Claim Assignment', roles:['admin'], adminNav: true },
  { id:'policy',           path:'/policy-search',    icon:Search,          label:'Policy Search',    roles:['Pre Assessor'], operational: true },
  { id:'claims',           path:'/claim-search',     icon:FileText,        label:'Claim Search',     operational: true },
  { id:'pool',             path:'/pool-selection',   icon:Layers,          label:'Pool Selection',   roles:['Assessor','Verifier'], operational: true },
  { id:'tasks',            path:'/my-task',          icon:CheckSquare,     label:'My Tasks',         roles:['Assessor','Verifier'], operational: true },
  { id:'add',              path:'/add-screen',       icon:ScanSearch,      label:'Advance Investigation', roles:['Assessor','Verifier'], operational: true },
  { id:'users',            path:'/user-management',  icon:Users,           label:'User Management',  roles:['admin'], adminNav: true },
  { id:'audit-log',        path:'/audit-log',        icon:ClipboardList,   label:'Login Sessions',   roles:['admin'], adminNav: true },
]

const GUEST_USER = { name:'Guest User', role:'Admin', email:'guest@dhdigital.co.in', avatar:'GU', username:'guest' }

const SIDEBAR_EXPANDED = 252
const SIDEBAR_RAIL = 72

function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export default function AppLayout({ children, pageTitle, pageSubtitle }) {
  const { user: authUser, logout, hasRole } = useAuth()
  const user = authUser
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [, setTimeTick] = useState(0)
  const dropRef = useRef(null)
  const sidebarRef = useRef(null)

  const showWideSidebar = isDesktop ? sidebarExpanded : true
  const sidebarWidth = isDesktop ? (sidebarExpanded ? SIDEBAR_EXPANDED : SIDEBAR_RAIL) : SIDEBAR_EXPANDED

  useEffect(() => {
    if (!user?.username) return
    dashboardService.getRecentActivities().then(items => {
      setNotifications(mapDashboardActivities(items).slice(0, 6))
    }).catch(() => setNotifications([]))
  }, [user?.username])

  useEffect(() => {
    const id = setInterval(() => setTimeTick((n) => n + 1), 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const fn = e => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setProfileOpen(false)
        setNotifOpen(false)
      }
      if (!isDesktop && mobileNavOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        const headerBtn = e.target?.closest?.('[data-sidebar-toggle]')
        if (!headerBtn) setMobileNavOpen(false)
      }
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [isDesktop, mobileNavOpen])

  if (!user) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', fontFamily:'Inter,sans-serif', color:'#64748B' }}>
        Loading…
      </div>
    )
  }

  const adminOnly = isAdminOnlyUser(user?.roles)

  const visibleNav = NAV_ITEMS.filter((n) => {
    if (adminOnly) {
      return ['admin-overview', 'admin-claims', 'users', 'audit-log'].includes(n.id)
    }
    if (n.id === 'admin-overview' || n.id === 'admin-claims') {
      return hasAdminRole(user?.roles)
    }
    if (n.operational && n.roles && !n.roles.some((r) => hasRole(r))) return false
    if (n.roles && !n.roles.some((r) => hasRole(r))) return false
    return true
  })

  const currentNav = visibleNav.find(n => {
    if (n.path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(n.path)
  }) || visibleNav[0]

  const handleNavClick = (item) => {
    navigate(item.path)
    if (!isDesktop) setMobileNavOpen(false)
  }

  const toggleSidebar = () => {
    if (isDesktop) setSidebarExpanded((p) => !p)
    else setMobileNavOpen((p) => !p)
  }

  const primaryRole = user?.roles?.[0] || user?.role || 'User'

  const handleSignOut = async () => {
    await logout()
    navigate('/login')
    toast('info', 'Signed out', 'See you next time!')
  }

  const breadcrumb = pageTitle || currentNav?.label || 'Dashboard'

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:'Inter,sans-serif', background: T.pageBg }}>

      {!isDesktop && mobileNavOpen && (
        <div
          aria-hidden
          onClick={() => setMobileNavOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:40, backdropFilter:'blur(2px)' }}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside ref={sidebarRef} style={{
        position: isDesktop ? 'relative' : 'fixed',
        left: 0,
        top: 0,
        zIndex: 41,
        height: '100vh',
        width: isDesktop ? sidebarWidth : SIDEBAR_EXPANDED,
        flexShrink: 0,
        transform: isDesktop ? 'none' : (mobileNavOpen ? 'translateX(0)' : 'translateX(-100%)'),
        background: `linear-gradient(180deg, #0F172A 0%, #111827 55%, #0F172A 100%)`,
        display: 'flex',
        flexDirection: 'column',
        transition: isDesktop ? 'width 0.22s ease' : 'transform 0.22s ease',
        overflow: 'hidden',
        borderRight: `1px solid ${T.sidebarBorder}`,
        boxShadow: isDesktop ? '4px 0 24px rgba(15,23,42,0.08)' : '8px 0 32px rgba(0,0,0,0.2)',
      }}>
        {/* Logo */}
        <div style={{
          height: '60px', display: 'flex', alignItems: 'center', gap: '12px',
          padding: showWideSidebar ? '0 18px' : '0 16px', flexShrink: 0,
          borderBottom: `1px solid ${T.sidebarBorder}`,
        }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
            background: `linear-gradient(135deg, ${T.primary} 0%, #2563EB 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(29,78,216,0.35)',
          }}>
            <Shield size={16} color="#fff" />
          </div>
          {showWideSidebar && (
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '14px', letterSpacing: '-0.02em' }}>DH Digital</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Life Claims</div>
            </div>
          )}
        </div>

        {/* Nav — compact; footer pinned with marginTop auto */}
        <nav style={{ padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {showWideSidebar && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Menu
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#93C5FD', background: 'rgba(29,78,216,0.2)', border: '1px solid rgba(147,197,253,0.25)', borderRadius: '99px', padding: '2px 8px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {primaryRole}
              </div>
            </div>
          )}
          {visibleNav.map(item => {
            const active = currentNav?.id === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                title={!showWideSidebar ? item.label : undefined}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '11px',
                  padding: showWideSidebar ? '10px 12px' : '10px 0',
                  justifyContent: showWideSidebar ? 'flex-start' : 'center',
                  borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: active ? T.sidebarActive : 'transparent',
                  color: active ? T.sidebarActiveText : 'rgba(255,255,255,0.55)',
                  boxShadow: active ? 'inset 3px 0 0 #60A5FA' : 'none',
                  transition: 'all 0.15s ease', textAlign: 'left', fontFamily: 'Inter,sans-serif',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = T.sidebarHover
                    e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
                  }
                }}
              >
                <item.icon size={16} style={{ flexShrink: 0, color: active ? T.sidebarActiveText : undefined }} />
                {showWideSidebar && (
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: active ? 700 : 500, letterSpacing: '-0.01em' }}>{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User — always pinned to bottom */}
        <div style={{ marginTop: 'auto', padding: '12px 10px 16px', borderTop: `1px solid ${T.sidebarBorder}`, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => { navigate('/profile'); if (!isDesktop) setMobileNavOpen(false) }}
            title={!showWideSidebar ? user?.name : undefined}
            style={{
              width:'100%', display:'flex', alignItems:'center', gap:'10px',
              padding: showWideSidebar ? '10px 12px' : '8px 0',
              justifyContent: showWideSidebar ? 'flex-start' : 'center',
              borderRadius:'10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.06)',
              cursor:'pointer', textAlign:'left', fontFamily:'Inter,sans-serif',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0, background: T.primary, color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user?.avatar}
            </div>
            {showWideSidebar && (
              <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: '12px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 500 }}>Profile & settings</div>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* TOPBAR */}
        <header style={{
          height: '60px', background: T.card, borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              data-sidebar-toggle
              onClick={toggleSidebar}
              aria-label={isDesktop ? (sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar') : (mobileNavOpen ? 'Close menu' : 'Open menu')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, padding: '6px', display: 'flex', alignItems: 'center', borderRadius: '8px', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = T.textPrimary }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = T.textMuted }}
            >
              {isDesktop ? (sidebarExpanded ? <X size={18} /> : <Menu size={18} />) : (mobileNavOpen ? <X size={18} /> : <Menu size={18} />)}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <span style={{ color: T.textMuted, fontWeight: 500 }}>Home</span>
              <ChevronRight size={13} style={{ color: T.textSubtle }} />
              <span style={{ color: T.textSecondary, fontWeight: 700 }}>{breadcrumb}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} ref={dropRef}>
            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setNotifOpen(p => !p); setProfileOpen(false) }}
                style={{ width: '36px', height: '36px', borderRadius: '8px', position: 'relative', background: '#F8FAFC', border: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.textMuted, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted }}
              >
                <Bell size={15} />
                <div style={{ position: 'absolute', top: '7px', right: '7px', width: '7px', height: '7px', borderRadius: '50%', background: '#EF4444', border: '2px solid #fff' }} />
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', right: 0, top: '44px', width: '300px', zIndex: 50, background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', boxShadow: '0 20px 48px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.borderSubtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: T.textPrimary }}>Notifications</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: T.primary }}>{notifications.length} recent</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding:'20px 16px', fontSize:'12px', color:T.textMuted, textAlign:'center' }}>No recent activity</div>
                  ) : notifications.map(a => {
                    const s = getActivityStyle(a.type)
                    return (
                      <div
                        key={a.id}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', borderBottom: `1px solid ${T.borderSubtle}`, cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <s.Icon size={13} style={{ color: s.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: T.textSecondary }}>{a.action}</div>
                          <div style={{ fontSize: '11px', color: T.textSubtle, marginTop: '2px' }}>{a.detail || a.claim}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Profile */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setProfileOpen(p => !p); setNotifOpen(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', height: '36px', borderRadius: '8px', background: '#F8FAFC', border: `1.5px solid ${T.border}`, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Inter,sans-serif' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.primary}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: T.primary, color: '#fff', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {user?.avatar}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: T.textSecondary }}>{user?.name?.split(' ')[0]}</span>
                <ChevronDown size={13} style={{ color: T.textSubtle, transform: profileOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
              </button>
              {profileOpen && (
                <div style={{ position: 'absolute', right: 0, top: '44px', width: '220px', zIndex: 50, background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', boxShadow: '0 20px 48px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.borderSubtle}` }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: T.textPrimary }}>{user?.name}</div>
                    <div style={{ fontSize: '12px', color: T.textMuted, marginTop: '2px' }}>{user?.email}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '8px', background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '99px', padding: '2px 10px', fontSize: '11px', fontWeight: 700, color: T.primary }}>
                      <Star size={9} /> {user?.role}
                    </div>
                  </div>
                  <div style={{ padding: '6px' }}>
                    <button
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: T.textSecondary, fontFamily: 'Inter,sans-serif' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Settings size={14} /> Settings
                    </button>
                    <button
                      onClick={() => { navigate('/profile'); setProfileOpen(false) }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: T.textSecondary, fontFamily: 'Inter,sans-serif' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <User size={14} /> My Profile
                    </button>
                    <button
                      onClick={handleSignOut}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#DC2626', fontFamily: 'Inter,sans-serif' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main style={{ flex: 1, overflowY: 'auto', background: T.pageBg }}>
          <GlobalLoadingBar/>
          <Breadcrumbs/>
          {children}
        </main>
      </div>
      <AskMeChat />
    </div>
  )
}
