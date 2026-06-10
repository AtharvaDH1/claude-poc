import { useState, useEffect } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useToast } from '../components/Toast'
import { getAuditLogs } from '../services/userService'
import adminService from '../services/adminService'
import { Search, Download, X } from 'lucide-react'

const T = { primary:'#1D4ED8', card:'#fff', border:'#E2E8F0', borderSubtle:'#F1F5F9', textPrimary:'#0F172A', textSecondary:'#334155', textMuted:'#64748B', textSubtle:'#94A3B8' }

const ACTION_COLORS = {
  'Login':          { bg:'#EFF6FF', color:T.primary,   border:'#BFDBFE' },
  'Logout':         { bg:'#F8FAFC', color:T.textSubtle, border:T.border  },
  'Claim Registered':{ bg:'#ECFDF5', color:'#059669',   border:'#A7F3D0' },
  'Claim Approved': { bg:'#ECFDF5', color:'#059669',   border:'#A7F3D0' },
  'Claim Rejected': { bg:'#FEF2F2', color:'#DC2626',   border:'#FECACA' },
  'Claim Viewed':   { bg:'#FFFBEB', color:'#D97706',   border:'#FDE68A' },
  'User Created':   { bg:'#F5F3FF', color:'#7C3AED',   border:'#DDD6FE' },
}

const ROLE_COLORS = {
  'Pre Assessor': { bg:'#EFF6FF', color:T.primary },
  'Assessor':     { bg:'#F5F3FF', color:'#7C3AED' },
  'Verifier':     { bg:'#ECFDF5', color:'#059669'  },
  'Admin':        { bg:'#FEF2F2', color:'#DC2626'  },
  'System':       { bg:'#F8FAFC', color:T.textSubtle },
}

const PAGE_SIZE = 10

function dateRangeForPeriod(period) {
  const to = new Date().toISOString().slice(0, 10)
  if (period === 'today') return { from: to, to }
  if (period === 'week') {
    const d = new Date()
    d.setDate(d.getDate() - 6)
    return { from: d.toISOString().slice(0, 10), to }
  }
  return {}
}

export default function AdminAuditLog() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [actionFilter, setActionFilter] = useState('All')
  const [period, setPeriod] = useState('week')
  const [page, setPage] = useState(0)
  const [hovRow, setHovRow] = useState(null)
  const [logs, setLogs] = useState([])
  const [tracked, setTracked] = useState([])

  const mapAuditRow = (l, i) => ({
    id: l.id ?? i + 1,
    user: l.username || l.USERNAME || l.user || 'Unknown',
    role: l.userRole || (Array.isArray(l.roles) ? l.roles[0] : l.roles) || 'User',
    action: l.logoutAt || l.LOGOUT_AT ? 'Logout' : 'Login',
    ip: l.ipAddress || l.IP_ADDRESS || l.ip || '—',
    timestamp: (l.loginAt || l.LOGIN_AT)
      ? new Date(l.loginAt || l.LOGIN_AT).toLocaleString('en-IN')
      : '—',
    session: l.id != null ? String(l.id) : (l.session_id || l.SESSION_ID || '—'),
  })

  const loadLogs = () => {
    const range = dateRangeForPeriod(period)
    getAuditLogs({ limit: 200, ...range })
      .then((data) => {
        const rows = Array.isArray(data?.logs) ? data.logs : []
        setLogs(rows.map(mapAuditRow))
      })
      .catch(() => setLogs([]))
  }

  const exportCsv = () => {
    if (!filtered.length) {
      toast('warning', 'No data', 'Nothing to export for current filters.')
      return
    }
    const header = ['Timestamp', 'User', 'Role', 'Action', 'IP', 'Session ID']
    const lines = filtered.map((l) =>
      [l.timestamp, l.user, l.role, l.action, l.ip, l.session]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `login-audit-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast('success', 'Exported', `${filtered.length} row(s) downloaded.`)
  }

  useEffect(() => {
    adminService.getTrackedUsersStatus().then(setTracked).catch(() => setTracked([]))
  }, [])

  useEffect(() => {
    setPage(0)
    loadLogs()
  }, [period])

  const roles = ['All', ...new Set(logs.map(l => l.role))]
  const actions = ['All', ...new Set(logs.map(l => l.action))]

  const filtered = logs.filter(l => {
    const q = search.toLowerCase()
    const mQ = !q || l.user.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.session.includes(q)
    const mR = roleFilter === 'All' || l.role === roleFilter
    const mA = actionFilter === 'All' || l.action === actionFilter
    return mQ && mR && mA
  })

  const stats = {
    totalSessions: new Set(logs.map(l => l.session)).size,
    logins: logs.filter(l => l.action === 'Login').length,
    claimActions: logs.filter(l => l.action.startsWith('Claim')).length,
  }

  return (
    <AppLayout>
      <div style={{ padding:'24px', fontFamily:'Inter,sans-serif' }}>
        <div style={{ marginBottom:'24px' }}>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:T.textPrimary, letterSpacing:'-0.02em', margin:'0 0 4px' }}>Login session audit</h1>
          <p style={{ fontSize:'13px', color:T.textMuted, fontWeight:500 }}>
            Session events from <code>user_login_audit</code> (J6). User CRUD is at <strong>/user-management</strong>, not here.
          </p>
        </div>

        {/* Summary */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'20px' }}>
          {[
            { label:'Total Events', value:logs.length, color:T.primary, bg:'#EFF6FF' },
            { label:'Active Sessions', value:stats.totalSessions, color:'#059669', bg:'#ECFDF5' },
            { label:'Logins Today', value:stats.logins, color:'#7C3AED', bg:'#F5F3FF' },
            { label:'Claim Actions', value:stats.claimActions, color:'#D97706', bg:'#FFFBEB' },
          ].map(s => (
            <div key={s.label} style={{ background:T.card, borderRadius:'10px', padding:'16px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:'28px', fontWeight:900, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'4px', fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', padding:'14px 18px', marginBottom:'16px', display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ flex:1, minWidth:'200px', display:'flex', alignItems:'center', gap:'8px', padding:'0 12px', height:'38px', borderRadius:'8px', background:'#F8FAFC', border:`1.5px solid ${T.border}` }}>
            <Search size={14} style={{ color:T.textSubtle, flexShrink:0 }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, action, session..."
              style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'13px', color:T.textPrimary, fontWeight:500, fontFamily:'Inter,sans-serif' }}/>
            {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:T.textSubtle, display:'flex' }}><X size={13}/></button>}
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            style={{ padding:'0 12px', height:'38px', borderRadius:'8px', border:`1.5px solid ${T.border}`, background:'#F8FAFC', fontSize:'13px', fontWeight:500, color:T.textSecondary, fontFamily:'Inter,sans-serif', outline:'none', cursor:'pointer' }}>
            {roles.map(r => <option key={r}>{r}</option>)}
          </select>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            style={{ padding:'0 12px', height:'38px', borderRadius:'8px', border:`1.5px solid ${T.border}`, background:'#F8FAFC', fontSize:'13px', fontWeight:500, color:T.textSecondary, fontFamily:'Inter,sans-serif', outline:'none', cursor:'pointer' }}>
            {actions.map(a => <option key={a}>{a}</option>)}
          </select>
          {['today', 'week', 'all'].map((p) => (
            <button key={p} type="button" onClick={() => setPeriod(p)} style={{ padding:'0 14px', height:'38px', borderRadius:'8px', border:`1px solid ${period === p ? T.primary : T.border}`, background: period === p ? '#EFF6FF' : '#F8FAFC', fontWeight:700, fontSize:'12px', cursor:'pointer', fontFamily:'Inter,sans-serif', color: period === p ? T.primary : T.textMuted }}>
              {p === 'today' ? 'Today' : p === 'week' ? 'This week' : 'All'}
            </button>
          ))}
          <button type="button" onClick={exportCsv} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'0 16px', height:'38px', borderRadius:'8px', border:`1px solid ${T.border}`, background:'#F8FAFC', fontSize:'13px', fontWeight:700, cursor:'pointer', color:T.textSecondary, fontFamily:'Inter,sans-serif', transition:'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background='#EFF6FF'} onMouseLeave={e => e.currentTarget.style.background='#F8FAFC'}>
            <Download size={14}/> Export CSV
          </button>
        </div>

        {/* Table */}
        <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:`1px solid ${T.borderSubtle}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary }}>Audit Trail</div>
            <div style={{ fontSize:'12px', color:T.textMuted, fontWeight:500 }}>{filtered.length} records · page {page + 1}/{Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}</div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
                  {['#','Timestamp','User','Role','Action','IP Address','Session ID'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).map((log, i) => {
                  const ac = ACTION_COLORS[log.action] || { bg:'#F8FAFC', color:T.textSubtle, border:T.border }
                  const rc = ROLE_COLORS[log.role] || { bg:'#F8FAFC', color:T.textSubtle }
                  return (
                    <tr key={log.id} style={{ borderBottom:`1px solid ${T.borderSubtle}`, background:hovRow===i?'#F8FAFC':'', transition:'background 0.1s' }}
                      onMouseEnter={() => setHovRow(i)} onMouseLeave={() => setHovRow(null)}>
                      <td style={{ padding:'11px 14px', fontSize:'12px', color:T.textSubtle, fontWeight:600 }}>{log.id}</td>
                      <td style={{ padding:'11px 14px', fontSize:'12px', color:T.textMuted, fontWeight:500, whiteSpace:'nowrap', fontFamily:'monospace' }}>{log.timestamp}</td>
                      <td style={{ padding:'11px 14px', fontSize:'13px', fontWeight:700, color:T.textSecondary }}>{log.user}</td>
                      <td style={{ padding:'11px 14px' }}><span style={{ fontSize:'11px', fontWeight:700, padding:'2px 9px', borderRadius:'99px', background:rc.bg, color:rc.color }}>{log.role}</span></td>
                      <td style={{ padding:'11px 14px' }}><span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'99px', background:ac.bg, border:`1px solid ${ac.border}`, color:ac.color }}>{log.action}</span></td>
                      <td style={{ padding:'11px 14px', fontSize:'12px', color:T.textMuted, fontFamily:'monospace' }}>{log.ip}</td>
                      <td style={{ padding:'11px 14px', fontSize:'12px', color:T.textMuted, fontFamily:'monospace' }}>{log.session}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding:'12px 18px', display:'flex', justifyContent:'flex-end', gap:'8px', borderTop:`1px solid ${T.borderSubtle}` }}>
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} style={{ padding:'6px 14px', borderRadius:'6px', border:`1px solid ${T.border}`, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Prev</button>
            <button type="button" disabled={(page + 1) * PAGE_SIZE >= filtered.length} onClick={() => setPage((p) => p + 1)} style={{ padding:'6px 14px', borderRadius:'6px', border:`1px solid ${T.border}`, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Next</button>
          </div>
        </div>

        <div style={{ marginTop: '24px', background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.borderSubtle}`, fontWeight: 700, fontSize: '14px', color: T.textPrimary }}>Live sessions (tracked users)</div>
          <div style={{ padding: '16px 18px' }}>
            {tracked.length === 0 ? (
              <div style={{ fontSize: '13px', color: T.textMuted }}>No active tracked sessions.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {tracked.map((u, i) => (
                  <div key={i} style={{ padding: '14px', borderRadius: '10px', border: `1px solid ${T.border}`, background: '#F8FAFC' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: T.textPrimary }}>{u.username || u.USERNAME || 'User'}</div>
                    <div style={{ fontSize: '11px', color: T.textMuted, marginTop: '4px' }}>{u.status || u.sessionStatus || 'Online'}</div>
                    <button type="button" onClick={async () => {
                      try {
                        await adminService.forceLogoutTrackedUser(u.username || u.USERNAME)
                        toast('success', 'Logged out', 'User session ended.')
                        setTracked((p) => p.filter((_, j) => j !== i))
                      } catch (e) {
                        toast('error', 'Force logout', e.message)
                      }
                    }} style={{ marginTop: '10px', padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#DC2626', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                      Force logout
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
