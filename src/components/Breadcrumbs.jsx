import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const ROUTE_LABELS = {
  'dashboard':       'Dashboard',
  'policy-search':   'Policy Search',
  'claim-search':    'Claim Search',
  'registration':    'Register Claim',
  'claim-view':      'Claim View',
  'pool-selection':  'Pool Selection',
  'my-task':         'My Tasks',
  'add-screen':      'Add Screen',
  'user-management': 'User Management',
  'audit-log':       'Audit Log',
  'admin-reports':   'Reports',
  'fraud-prevention':'Fraud Prevention',
  'profile':         'My Profile',
}

export default function Breadcrumbs() {
  const location = useLocation()
  const navigate  = useNavigate()

  const segments = location.pathname.split('/').filter(Boolean)
  if (!segments.length) return null

  const crumbs = [
    { label: 'Home', path: '/dashboard' },
    ...segments.map((seg, i) => ({
      label: ROUTE_LABELS[seg] || (seg.startsWith('CLM') ? seg : seg.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase())),
      path:  '/' + segments.slice(0, i+1).join('/'),
      last:  i === segments.length - 1,
    })),
  ]

  // Don't show on login
  if (location.pathname === '/login') return null

  return (
    <nav style={{ display:'flex', alignItems:'center', gap:'4px', padding:'10px 24px', background:'#fff', borderBottom:'1px solid #F1F5F9', fontFamily:'Inter,sans-serif' }}>
      {crumbs.map((c, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
          {i > 0 && <ChevronRight size={13} style={{ color:'#CBD5E1', flexShrink:0 }}/>}
          {c.last ? (
            <span style={{ fontSize:'12px', fontWeight:700, color:'#0F172A' }}>
              {i === 0 ? <Home size={13} style={{ verticalAlign:'middle', marginRight:'3px' }}/> : null}
              {c.label}
            </span>
          ) : (
            <button onClick={() => navigate(c.path)}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:500, color:'#64748B', fontFamily:'Inter,sans-serif', padding:'2px 4px', borderRadius:'4px', display:'flex', alignItems:'center', gap:'3px', transition:'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color='#1D4ED8'}
              onMouseLeave={e => e.currentTarget.style.color='#64748B'}>
              {i === 0 && <Home size={12}/>}
              {c.label}
            </button>
          )}
        </div>
      ))}
    </nav>
  )
}
