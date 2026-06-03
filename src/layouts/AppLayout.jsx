import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import Breadcrumbs from '../components/Breadcrumbs'
import GlobalLoadingBar from '../components/GlobalLoadingBar'
import {
  LayoutDashboard, Search, Bell, ChevronDown, LogOut, Menu, X,
  FileText, Users, CheckSquare, Plus, Shield, Settings, Star,
  Layers, ChevronRight, CheckCircle, XCircle, ClipboardList,
  BarChart3, ShieldAlert, User,
} from 'lucide-react'

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
  { id:'dashboard',        path:'/dashboard',        icon:LayoutDashboard, label:'Dashboard' },
  { id:'policy',           path:'/policy-search',    icon:Search,          label:'Policy Search',    roles:['Pre Assessor'] },
  { id:'claims',           path:'/claim-search',     icon:FileText,        label:'Claim Search',     roles:['Assessor','Verifier','Admin'] },
  { id:'pool',             path:'/pool-selection',   icon:Layers,          label:'Pool Selection',   roles:['Assessor','Verifier'] },
  { id:'tasks',            path:'/my-task',          icon:CheckSquare,     label:'My Tasks', badge:3, roles:['Assessor','Verifier'] },
  { id:'add',              path:'/add-screen',       icon:Plus,            label:'Add Screen',       roles:['Assessor','Verifier'] },
  { id:'fraud-prevention', path:'/fraud-prevention', icon:ShieldAlert,     label:'Fraud Prevention', roles:['Assessor','Verifier','Admin'] },
  { id:'users',            path:'/user-management',  icon:Users,           label:'User Management',  roles:['Admin'] },
  { id:'audit-log',        path:'/audit-log',        icon:ClipboardList,   label:'Audit Log',        roles:['Admin'] },
  { id:'admin-reports',    path:'/admin-reports',    icon:BarChart3,       label:'Reports',          roles:['Admin'] },
]

const ACT_STYLE = {
  approved:   { bg:'#ECFDF5', color:'#059669', Icon: CheckCircle  },
  new:        { bg:'#EFF6FF', color:'#1D4ED8', Icon: Plus         },
  rejected:   { bg:'#FEF2F2', color:'#DC2626', Icon: XCircle      },
  assessment: { bg:'#FFFBEB', color:'#D97706', Icon: ClipboardList },
  document:   { bg:'#F0F9FF', color:'#0891B2', Icon: FileText     },
}

const MOCK_NOTIFICATIONS = [
  { id:1, action:'Claim Approved',       claim:'CLM-2025-0040', time:'2h ago',  type:'approved'   },
  { id:2, action:'New Claim Registered', claim:'CLM-2025-0041', time:'4h ago',  type:'new'        },
  { id:3, action:'Claim Rejected',       claim:'CLM-2025-0039', time:'6h ago',  type:'rejected'   },
  { id:4, action:'Assessment Completed', claim:'CLM-2025-0038', time:'8h ago',  type:'assessment' },
]

const GUEST_USER = { name:'Guest User', role:'Admin', email:'guest@dhdigital.co.in', avatar:'GU', username:'guest' }

export default function AppLayout({ children, pageTitle, pageSubtitle }) {
  const { user: authUser, logout } = useAuth()
  const user = authUser || GUEST_USER   // fallback when auth is disabled
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const dropRef = useRef(null)

  // When auth is disabled, show all nav items
  const visibleNav = NAV_ITEMS.filter(n => !n.roles || !user || n.roles.includes(user?.role))

  const currentNav = visibleNav.find(n => {
    if (n.path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(n.path)
  }) || visibleNav[0]

  useEffect(() => {
    const fn = e => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setProfileOpen(false)
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const handleNavClick = (item) => {
    navigate(item.path)
  }

  const handleSignOut = () => {
    logout()
    navigate('/login')
    toast('info', 'Signed out', 'See you next time!')
  }

  const breadcrumb = pageTitle || currentNav?.label || 'Dashboard'

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:'Inter,sans-serif' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarOpen ? '240px' : '60px', flexShrink: 0,
        background: T.sidebar, display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease', overflow: 'hidden',
        borderRight: `1px solid ${T.sidebarBorder}`,
      }}>
        {/* Logo */}
        <div style={{
          height: '60px', display: 'flex', alignItems: 'center', gap: '12px',
          padding: sidebarOpen ? '0 20px' : '0 14px', flexShrink: 0,
          borderBottom: `1px solid ${T.sidebarBorder}`,
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
            background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(29,78,216,0.4)',
          }}>
            <Shield size={15} color="#fff" />
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '14px', letterSpacing: '-0.02em' }}>DH Digital</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Life Claims</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflow: 'hidden' }}>
          {sidebarOpen && (
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 10px', marginBottom: '8px' }}>
              Navigation
            </div>
          )}
          {visibleNav.map(item => {
            const active = currentNav?.id === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                title={!sidebarOpen ? item.label : undefined}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: sidebarOpen ? '9px 10px' : '9px',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  borderRadius: '8px', border: 'none', cursor: 'pointer', marginBottom: '2px',
                  background: active ? T.sidebarActive : 'transparent',
                  color: active ? T.sidebarActiveText : 'rgba(255,255,255,0.45)',
                  transition: 'all 0.15s ease', textAlign: 'left', fontFamily: 'Inter,sans-serif',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = T.sidebarHover
                    e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.45)'
                  }
                }}
              >
                <item.icon size={15} style={{ flexShrink: 0, color: active ? T.sidebarActiveText : undefined }} />
                {sidebarOpen && (
                  <>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: active ? 600 : 500 }}>{item.label}</span>
                    {item.badge && (
                      <span style={{ background: T.primary, color: '#fff', fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '99px', lineHeight: 1.6 }}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        {/* User info */}
        {sidebarOpen && (
          <div style={{ padding: '10px 8px 14px', borderTop: `1px solid ${T.sidebarBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0, background: T.primary, color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {user?.avatar}
              </div>
              <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: '12px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', fontWeight: 500 }}>{user?.role}</div>
              </div>
            </div>
          </div>
        )}
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
              onClick={() => setSidebarOpen(p => !p)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, padding: '6px', display: 'flex', alignItems: 'center', borderRadius: '8px', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = T.textPrimary }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = T.textMuted }}
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
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
                    <span style={{ fontSize: '11px', fontWeight: 700, color: T.primary }}>3 unread</span>
                  </div>
                  {MOCK_NOTIFICATIONS.map(a => {
                    const s = ACT_STYLE[a.type] || ACT_STYLE.new
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
                          <div style={{ fontSize: '11px', color: T.textSubtle, marginTop: '2px' }}>{a.claim} · {a.time}</div>
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
    </div>
  )
}
