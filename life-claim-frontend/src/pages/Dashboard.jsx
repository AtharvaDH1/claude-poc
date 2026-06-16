import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { isSuperUserOnlyUser, hasSuperUserRole, postLoginPath } from '../util/loginHelpers'
import { openClaimWorkspace } from '../util/navigation'
import { useToast } from '../components/Toast'
import AppLayout from '../layouts/AppLayout'
import dashboardService from '../services/dashboardService'
import { classifyClaimBucket } from '../util/dashboardMetrics'
import { buildClaimTimelineSteps, matchesDateFilter } from '../util/claimDaysOpen'
import { coalesceRoles, resolveWorkflowRole } from '../util/workflowRole'
import { mapDashboardActivities } from '../util/mapDashboardActivity'
import { getActivityStyle } from '../util/activityStyles'
import { changeClaimStatus } from '../services/claimsService'
import {
  Clock, CheckCircle, XCircle, Layers,
  Eye, Edit3,
  AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, IndianRupee,
  Plus, FileText, X, Search, Star, CheckSquare
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

/* ── Tokens ── */
const T = {
  sidebar: '#0F172A', sidebarBorder: 'rgba(255,255,255,0.06)',
  sidebarHover: 'rgba(255,255,255,0.05)', sidebarActive: 'rgba(29,78,216,0.28)',
  sidebarActiveText: '#93C5FD',
  primary: '#1D4ED8', primaryHover: '#1E40AF',
  pageBg: '#F1F5F9', card: '#FFFFFF',
  border: '#E2E8F0', borderSubtle: '#F1F5F9',
  textPrimary: '#0F172A', textSecondary: '#334155',
  textMuted: '#64748B', textSubtle: '#94A3B8',
  pending:  { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
  approved: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
  rejected: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' },
}

const METRICS = [
  { key: 'total',      label: 'Total Claims',     icon: Layers,       accent: '#1D4ED8', light: '#EFF6FF' },
  { key: 'pending',    label: 'Pending Review',   icon: Clock,        accent: '#D97706', light: '#FFFBEB' },
  { key: 'approved',   label: 'Approved',         icon: CheckCircle,  accent: '#059669', light: '#ECFDF5' },
  { key: 'rejected',   label: 'Rejected',         icon: XCircle,      accent: '#DC2626', light: '#FEF2F2' },
]

const DATE_FILTERS = ['All', 'Today', 'This Week', 'This Month']

/* ── Hooks ── */
function useCountUp(target, ms = 1200) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf
    const t0 = performance.now()
    const tick = now => {
      const p = Math.min((now - t0) / ms, 1)
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

/* ── Helpers ── */
const fmt = (n) => new Intl.NumberFormat('en-IN').format(n)
const fmtRs = (n) => `₹${n >= 1e7 ? (n/1e7).toFixed(1)+'Cr' : n >= 1e5 ? (n/1e5).toFixed(1)+'L' : fmt(n)}`

function highlight(text, query) {
  if (!query) return <span>{text}</span>
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i === -1) return <span>{text}</span>
  return (
    <span>
      {text.slice(0, i)}
      <mark style={{ background: '#FEF08A', color: '#713F12', borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(i, i + query.length)}
      </mark>
      {text.slice(i + query.length)}
    </span>
  )
}

/* ── MetricCard ── */
function MetricCard({ config, value }) {
  const count = useCountUp(value)
  const Icon = config.icon
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: T.card, borderRadius: '12px', padding: '20px',
        border: `1px solid ${hov ? config.accent + '50' : T.border}`,
        boxShadow: hov ? `0 12px 28px ${config.accent}18, 0 2px 6px rgba(0,0,0,0.04)` : '0 1px 3px rgba(0,0,0,0.06)',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.2s ease', cursor: 'default',
      }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'16px' }}>
        <div style={{
          width:'40px', height:'40px', borderRadius:'10px',
          background: config.light, display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: hov ? `0 4px 12px ${config.accent}30` : 'none', transition:'all 0.2s',
        }}>
          <Icon size={18} style={{ color: config.accent }} />
        </div>
      </div>
      <div style={{ fontSize:'32px', fontWeight:800, color:T.textPrimary, letterSpacing:'-0.03em', lineHeight:1 }}>
        {count.toLocaleString()}
      </div>
      <div style={{ fontSize:'13px', color:T.textMuted, marginTop:'6px', fontWeight:500 }}>{config.label}</div>
    </div>
  )
}

/* ── Value Metric Card (₹) ── */
function formatPipelineValue(value) {
  const n = Number(value) || 0
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr+`
  if (n >= 1e5) return `₹${Math.round(n / 1e5)}L+`
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`
  return n > 0 ? `₹${n.toLocaleString('en-IN')}` : '₹0'
}

function ValueCard({ value, sla, overdue, avgDays }) {
  const display = formatPipelineValue(value)
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)',
      borderRadius: '12px', padding: '20px',
      boxShadow: '0 4px 16px rgba(29,78,216,0.3)', gridColumn: 'span 1',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'16px' }}>
        <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <IndianRupee size={18} style={{ color:'#93C5FD' }} />
        </div>
        <div style={{ fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.6)', background:'rgba(255,255,255,0.1)', padding:'3px 8px', borderRadius:'99px' }}>
          Total Value
        </div>
      </div>
      <div style={{ fontSize:'28px', fontWeight:800, color:'#fff', letterSpacing:'-0.03em', lineHeight:1 }}>
        {display}
      </div>
      <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.55)', marginTop:'6px', fontWeight:500 }}>Claims in pipeline</div>
      <div style={{ marginTop:'14px', paddingTop:'12px', borderTop:'1px solid rgba(255,255,255,0.12)', display:'flex', justifyContent:'space-between' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'16px', fontWeight:800, color:'#4ADE80' }}>{sla}%</div>
          <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.45)', fontWeight:600, marginTop:'2px' }}>SLA Met</div>
        </div>
        <div style={{ width:'1px', background:'rgba(255,255,255,0.12)' }} />
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'16px', fontWeight:800, color: overdue > 0 ? '#FCA5A5' : '#4ADE80' }}>{overdue}</div>
          <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.45)', fontWeight:600, marginTop:'2px' }}>Overdue</div>
        </div>
        <div style={{ width:'1px', background:'rgba(255,255,255,0.12)' }} />
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'16px', fontWeight:800, color:'#fff' }}>{avgDays}d</div>
          <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.45)', fontWeight:600, marginTop:'2px' }}>Avg. Days</div>
        </div>
      </div>
    </div>
  )
}

function claimStatusStyle(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('approv') || s.includes('payout completed')) return T.approved
  if (s.includes('reject') || s.includes('repudi')) return T.rejected
  if (s.includes('pending')) return T.pending
  return T.pending
}

/* ── StatusBadge ── */
function StatusBadge({ status }) {
  const s = claimStatusStyle(status)
  const sl = String(status || '').toLowerCase()
  const Icon = sl.includes('approv') ? CheckCircle : sl.includes('reject') ? XCircle : Clock
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:'5px',
      background:s.bg, border:`1px solid ${s.border}`, color:s.text,
      fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'99px',
    }}>
      <Icon size={10} />{status}
    </span>
  )
}

/* ── Chart Tooltip ── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#1E293B', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'12px 16px', fontSize:'12px', boxShadow:'0 8px 24px rgba(0,0,0,0.2)' }}>
      <p style={{ color:'#94A3B8', fontWeight:600, marginBottom:'8px' }}>{label}</p>
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'4px' }}>
          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:p.fill, flexShrink:0 }} />
          <span style={{ color:'#94A3B8' }}>{p.name}:</span>
          <span style={{ color:'#fff', fontWeight:700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Hover Preview ── */
function HoverPreview({ claim, x, y }) {
  if (!claim) return null
  const steps = buildClaimTimelineSteps(claim)
  // Keep preview within viewport
  const left = x + 280 > window.innerWidth ? x - 296 : x + 18
  const top  = Math.max(8, Math.min(y - 80, window.innerHeight - 320))

  return (
    <div style={{
      position:'fixed', left, top, width:'278px', zIndex:9999,
      background:'#fff', borderRadius:'14px', padding:'18px',
      border:`1px solid ${T.border}`,
      boxShadow:'0 20px 48px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.06)',
      pointerEvents:'none', animation:'previewPop 0.18s ease',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px', paddingBottom:'12px', borderBottom:`1px solid ${T.borderSubtle}` }}>
        <div>
          <div style={{ fontWeight:800, fontSize:'13px', color:T.textPrimary, fontFamily:'monospace' }}>{claim.id}</div>
          <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'2px', fontWeight:500 }}>{claim.claimant}</div>
        </div>
        <StatusBadge status={claim.status} />
      </div>
      <div style={{ fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'10px' }}>Claim Timeline</div>
      <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
        {steps.map((s,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', position:'relative' }}>
            {i < steps.length-1 && <div style={{ position:'absolute', left:'6px', top:'18px', width:'1px', height:'14px', background: s.done ? '#059669':'#E2E8F0' }} />}
            <div style={{
              width:'13px', height:'13px', borderRadius:'50%', flexShrink:0,
              background: s.done ? '#059669' : s.active ? T.primary : '#E2E8F0',
              boxShadow: s.done ? '0 0 0 3px rgba(5,150,105,0.15)' : s.active ? '0 0 0 3px rgba(29,78,216,0.15)' : 'none',
            }} />
            <div style={{ flex:1 }}>
              <span style={{ fontSize:'12px', fontWeight:600, color: s.done||s.active ? T.textSecondary : T.textSubtle }}>{s.label}</span>
            </div>
            <span style={{ fontSize:'11px', color:T.textSubtle }}>{s.date}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop:'14px', paddingTop:'10px', borderTop:`1px solid ${T.borderSubtle}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:'12px', color:T.textMuted, fontWeight:600 }}>
          {fmtRs(claim.amount)}
        </span>
        <span style={{ fontSize:'11px', color: claim.daysOpen > 10 ? '#DC2626' : T.textSubtle, fontWeight:600,
          ...(claim.daysOpen > 10 ? { background:'#FEF2F2', padding:'2px 8px', borderRadius:'99px' } : {})
        }}>
          Open {claim.daysOpen}d {claim.daysOpen > 10 ? '⚠️' : ''}
        </span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════ */
export default function Dashboard() {
  const { user, hasRole } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('All')
  const [sortCol, setSortCol] = useState('created')
  const [sortDir, setSortDir] = useState('desc')
  const [hoverClaim, setHoverClaim] = useState(null)
  const [mouse, setMouse] = useState({ x:0, y:0 })
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [allClaims, setAllClaims] = useState([])
  const [metrics, setMetrics] = useState({
    total: 0, pending: 0, approved: 0, rejected: 0,
    totalPipelineValue: 0, slaCompliance: 0, overdueCount: 0, avgDaysOpen: 0,
    approvalRate: 0, fraudFlags: 0,
  })
  const [chartData, setChartData] = useState([])
  const [chartTrendSum, setChartTrendSum] = useState(0)
  const [pieData, setPieData] = useState([])
  const [typeData, setTypeData] = useState([])
  const [activity, setActivity] = useState([])
  const [, setTimeTick] = useState(0)
  const [apiLoading, setApiLoading] = useState(false)

  const workflowRole = resolveWorkflowRole(coalesceRoles(user?.roles, user?.role))
  const dashboardGreeting = workflowRole ? 'Hello' : `Good morning, ${user?.name?.split(' ')[0]} 👋`

  useEffect(() => {
    if (!user?.username) return
    setApiLoading(true)
    Promise.all([
      dashboardService.getDashboardStats(user.username, user.roles || []),
      dashboardService.getRecentActivities(),
    ])
      .then(([stats, activities]) => {
        setMetrics({
          total: stats.totalClaims || 0,
          pending: stats.pendingClaims || 0,
          approved: stats.approvedClaims || 0,
          rejected: stats.rejectedClaims || 0,
          totalPipelineValue: stats.totalPipelineValue || 0,
          slaCompliance: stats.slaCompliance || 0,
          overdueCount: stats.overdueCount || 0,
          avgDaysOpen: stats.avgDaysOpen || 0,
          approvalRate: stats.approvalRate || 0,
          fraudFlags: stats.fraudFlags || 0,
        })
        setChartData(stats.monthlyTrend || [])
        setChartTrendSum(stats.monthlyTrendSum || 0)
        setPieData(stats.pieData || [])
        setTypeData(stats.typeBreakdown || [])
        setAllClaims(stats.allClaims || [])
        setActivity(mapDashboardActivities(activities))
      })
      .catch(() => toast('error', 'Load Failed', 'Could not load dashboard data.'))
      .finally(() => setApiLoading(false))
  }, [user?.username, user?.roles, toast])

  useEffect(() => {
    const id = setInterval(() => setTimeTick((n) => n + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const highPriorityClaims = useMemo(
    () => allClaims.filter(c => c.priority === 'High' && c.bucket === 'pending'),
    [allClaims]
  )

  const derivedMetrics = useMemo(() => {
    const pending = metrics.pending || 0
    const approved = metrics.approved || 0
    const rejected = metrics.rejected || 0
    return {
      total: metrics.total || 0,
      statusTotal: pending + approved + rejected,
      totalValue: metrics.totalPipelineValue || 0,
      slaCompliance: metrics.slaCompliance || 0,
      overdueCount: metrics.overdueCount || 0,
      avgDaysOpen: metrics.avgDaysOpen || 0,
    }
  }, [metrics])

  const typeTotal = useMemo(
    () => typeData.reduce((sum, d) => sum + (d.value || 0), 0),
    [typeData]
  )

  const statusFilterMatch = useCallback((status, filter, roles) => {
    const bucket = classifyClaimBucket({ status, STATUS: status }, roles)
    if (filter === 'All') return true
    if (filter === 'Pending') return bucket === 'pending'
    if (filter === 'Approved') return bucket === 'approved'
    if (filter === 'Rejected') return bucket === 'rejected'
    return true
  }, [])

  const userRoles = user?.roles || []
  const showWorkClaimAction = hasRole(['Assessor', 'Verifier'])

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const filtered = allClaims
    .filter(c => {
      const q = search.toLowerCase()
      const matchQ = !q || c.id.toLowerCase().includes(q) || c.claimant.toLowerCase().includes(q) || c.policy.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)
      const matchS = statusFilterMatch(c.status, statusFilter, userRoles)
      const matchD = matchesDateFilter(c.createdRaw || c.created, dateFilter)
      return matchQ && matchS && matchD
    })
    .sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol]
      if (sortCol === 'amount') { av = a.amount; bv = b.amount }
      if (typeof av === 'string') av = av.toLowerCase(), bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const hasTableFilters = Boolean(search) || statusFilter !== 'All' || dateFilter !== 'All'
  const tableRows = hasTableFilters ? filtered : filtered.slice(0, 20)

  /* ── SortIcon ── */
  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ArrowUpDown size={11} style={{ color:T.textSubtle, marginLeft:'4px', opacity:0.5 }} />
    return sortDir === 'asc'
      ? <ArrowUp size={11} style={{ color:T.primary, marginLeft:'4px' }} />
      : <ArrowDown size={11} style={{ color:T.primary, marginLeft:'4px' }} />
  }

  /* ── Card shell ── */
  const card = (children, style={}) => (
    <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', ...style }}>
      {children}
    </div>
  )
  const cardHeader = (title, subtitle, right) => (
    <div style={{ padding:'16px 20px', borderBottom:`1px solid ${T.borderSubtle}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
      <div style={{ minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary }}>{title}</div>
        {subtitle && <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'2px', fontWeight:500 }}>{subtitle}</div>}
      </div>
      {right && <div style={{ flexShrink:0 }}>{right}</div>}
    </div>
  )

  if (isSuperUserOnlyUser(user?.roles, user?.username)) {
    return <Navigate to={postLoginPath(user?.roles, user?.username)} replace />
  }

  return (
    <AppLayout pageTitle="Dashboard">
      <div style={{ padding:'24px' }}>

          {/* Quick actions */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', marginBottom:'20px' }}>
            <button type="button" onClick={() => navigate('/claim-search')}
              style={{ padding:'9px 16px', borderRadius:'8px', border:`1px solid ${T.border}`, background:'#fff', fontSize:'12px', fontWeight:700, color:T.textSecondary, cursor:'pointer', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', gap:'6px' }}>
              <Search size={14} /> Search Claims
            </button>
            {hasRole('Pre Assessor') && (
              <button type="button" onClick={() => navigate('/policy-search')}
                style={{ padding:'9px 16px', borderRadius:'8px', border:`1px solid ${T.border}`, background:'#fff', fontSize:'12px', fontWeight:700, color:T.textSecondary, cursor:'pointer', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', gap:'6px' }}>
                <Plus size={14} /> Register New Claim
              </button>
            )}
            {hasRole(['Assessor', 'Verifier']) && (
              <>
                <button type="button" onClick={() => navigate('/pool-selection')}
                  style={{ padding:'9px 16px', borderRadius:'8px', border:`1px solid ${T.border}`, background:'#fff', fontSize:'12px', fontWeight:700, color:T.textSecondary, cursor:'pointer', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', gap:'6px' }}>
                  <Layers size={14} /> Pool Selection
                </button>
                <button type="button" onClick={() => navigate('/my-task')}
                  style={{ padding:'9px 16px', borderRadius:'8px', border:`1px solid ${T.border}`, background:'#fff', fontSize:'12px', fontWeight:700, color:T.textSecondary, cursor:'pointer', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', gap:'6px' }}>
                  <CheckSquare size={14} /> My Tasks
                </button>
              </>
            )}
            {hasSuperUserRole(user?.roles) && (
              <button type="button" onClick={() => navigate('/superuser')}
                style={{ padding:'9px 16px', borderRadius:'8px', border:'none', background:T.primary, fontSize:'12px', fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 4px 12px rgba(29,78,216,0.25)' }}>
                Super User Overview
              </button>
            )}
          </div>

          {/* Page heading */}
          <div style={{ marginBottom:'20px' }}>
            <h1 style={{ fontSize:'22px', fontWeight:800, color:T.textPrimary, letterSpacing:'-0.02em' }}>
              {dashboardGreeting}
            </h1>
            <p style={{ fontSize:'13px', color:T.textMuted, marginTop:'4px', fontWeight:500 }}>
              Here's an overview of all claims activity.
            </p>
          </div>

          {/* ── PRIORITY ALERT BANNER ── */}
          {!alertDismissed && highPriorityClaims.length > 0 && (
            <div style={{
              display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', borderRadius:'10px', marginBottom:'20px',
              background:'#FFFBEB', border:'1px solid #FDE68A',
              animation:'fadeUp 0.3s ease',
            }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#FEF3C7', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <AlertTriangle size={16} style={{ color:'#D97706' }}/>
              </div>
              <div style={{ flex:1 }}>
                <span style={{ fontSize:'13px', fontWeight:700, color:'#92400E' }}>
                  {highPriorityClaims.length} high-priority claim{highPriorityClaims.length>1?'s':''} need{highPriorityClaims.length===1?'s':''} immediate attention —&nbsp;
                </span>
                <span style={{ fontSize:'13px', color:'#B45309' }}>
                  {highPriorityClaims.map(c=>c.claimant).join(', ')}
                </span>
              </div>
              <button onClick={() => setAlertDismissed(true)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#D97706', padding:'4px', borderRadius:'6px', display:'flex', alignItems:'center' }}>
                <X size={15}/>
              </button>
            </div>
          )}

          {/* ── METRICS ROW ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'16px', marginBottom:'20px' }}>
            {METRICS.map(m => <MetricCard key={m.key} config={m} value={metrics[m.key] || 0}/>)}
            <ValueCard value={derivedMetrics.totalValue} sla={derivedMetrics.slaCompliance} overdue={derivedMetrics.overdueCount} avgDays={derivedMetrics.avgDaysOpen}/>
          </div>

          {/* ── CHARTS ROW ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 300px 200px', gap:'16px', marginBottom:'20px' }}>

            {/* Bar chart */}
            {card(<>
              {cardHeader('Claims Trend', `Last 6 months · ${chartTrendSum} of ${derivedMetrics.total} claims registered`,
                <div style={{ display:'flex', gap:'14px' }}>
                  {[['#059669','Approved'],['#D97706','Pending'],['#DC2626','Rejected']].map(([c,l])=>(
                    <div key={l} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', fontWeight:600, color:T.textMuted }}>
                      <div style={{ width:'8px', height:'8px', borderRadius:'2px', background:c }}/>{l}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ padding:'16px 20px' }}>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={chartData.length ? chartData : [{ name:'—', approved:0, rejected:0, pending:0 }]} barSize={10} barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false}/>
                    <XAxis dataKey="name" tick={{ fill:'#94A3B8', fontSize:11, fontWeight:500 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill:'#94A3B8', fontSize:11, fontWeight:500 }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<ChartTip/>} cursor={{ fill:'rgba(0,0,0,0.02)', radius:4 }}/>
                    <Bar dataKey="approved" fill="#059669" radius={[4,4,0,0]}/>
                    <Bar dataKey="pending"  fill="#D97706" radius={[4,4,0,0]}/>
                    <Bar dataKey="rejected" fill="#DC2626" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>)}

            {/* Donut */}
            {card(<>
              {cardHeader('Status Split', `${derivedMetrics.statusTotal} claims`)}
              <div style={{ padding:'12px 20px 16px' }}>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={pieData.length ? pieData : [{ name:'No data', value:1, color:'#E2E8F0' }]} cx="50%" cy="50%" innerRadius={44} outerRadius={62} paddingAngle={3} dataKey="value">
                      {(pieData.length ? pieData : [{ name:'No data', value:1, color:'#E2E8F0' }]).map((d,i)=><Cell key={i} fill={d.color} stroke="transparent"/>)}
                    </Pie>
                    <Tooltip content={<ChartTip/>}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ marginTop:'10px', display:'flex', flexDirection:'column', gap:'8px' }}>
                  {(pieData.length ? pieData : [{ name:'No data', value:1, color:'#E2E8F0' }]).map(d=>(
                    <div key={d.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ width:'9px', height:'9px', borderRadius:'3px', background:d.color, flexShrink:0 }}/>
                        <span style={{ fontSize:'12px', color:T.textSecondary, fontWeight:500 }}>{d.name}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                        <span style={{ fontSize:'12px', fontWeight:800, color:T.textPrimary }}>{d.value}</span>
                        <span style={{ fontSize:'10px', color:T.textSubtle }}>{d.pct ?? 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>)}

            {/* Claim type breakdown */}
            {card(<>
              {cardHeader('By Type', `${typeTotal || derivedMetrics.total} claims`)}
              <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:'12px' }}>
                {(typeData.length ? typeData : [{ name:'No claims', value:1, color:'#E2E8F0' }]).map(d => (
                  <div key={d.name}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                      <span style={{ fontSize:'12px', fontWeight:600, color:T.textSecondary }}>{d.name}</span>
                      <span style={{ fontSize:'12px', fontWeight:800, color:T.textPrimary }}>{d.value}</span>
                    </div>
                      <div style={{ height:'5px', borderRadius:'99px', background:'#F1F5F9', overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:'99px', background:d.color, width:`${d.pct ?? 0}%`, transition:'width 1s ease' }}/>
                    </div>
                    <div style={{ fontSize:'10px', color:T.textSubtle, marginTop:'3px', fontWeight:500 }}>{d.pct ?? 0}% of claims</div>
                  </div>
                ))}
              </div>
            </>)}
          </div>

          {/* ── BOTTOM ROW ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'16px' }}>

            {/* Claims table */}
            {card(<>
              {/* Table toolbar */}
              <div style={{ padding:'14px 20px', borderBottom:`1px solid ${T.borderSubtle}` }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary }}>
                      Recent Claims
                      {search && <span style={{ fontSize:'12px', fontWeight:600, color:T.primary, marginLeft:'8px' }}>{filtered.length} results for "{search}"</span>}
                    </div>
                    <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'2px', fontWeight:500 }}>
                      {hasTableFilters
                        ? `${tableRows.length} matching · ${derivedMetrics.total} total claims`
                        : `${tableRows.length} of ${allClaims.length} recent · ${derivedMetrics.total} total claims`}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    {/* Date filter */}
                    <div style={{ display:'flex', gap:'4px', background:'#F8FAFC', border:`1px solid ${T.border}`, borderRadius:'8px', padding:'3px' }}>
                      {DATE_FILTERS.map(d=>(
                        <button key={d} onClick={() => setDateFilter(d)}
                          style={{ padding:'4px 10px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'11px', fontWeight:700, transition:'all 0.15s', fontFamily:'Inter,sans-serif', background: dateFilter===d ? '#fff' : 'transparent', color: dateFilter===d ? T.textPrimary : T.textSubtle, boxShadow: dateFilter===d ? '0 1px 3px rgba(0,0,0,0.08)':'none' }}>
                          {d}
                        </button>
                      ))}

                    </div>
                    {/* Status filter */}
                    <div style={{ display:'flex', gap:'4px', background:'#F8FAFC', border:`1px solid ${T.border}`, borderRadius:'8px', padding:'3px' }}>
                      {['All','Pending','Approved','Rejected'].map(s=>(
                        <button key={s} onClick={() => setStatusFilter(s)}
                          style={{ padding:'4px 10px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'11px', fontWeight:700, transition:'all 0.15s', fontFamily:'Inter,sans-serif', background: statusFilter===s ? T.primary:'transparent', color: statusFilter===s ? '#fff':T.textSubtle, boxShadow: statusFilter===s ? '0 2px 6px rgba(29,78,216,0.25)':'none' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
                      {[
                        { label:'Claim ID',  col:'id'       },
                        { label:'Claimant',  col:'claimant' },
                        { label:'Type',      col:'type'     },
                        { label:'Amount',    col:'amount'   },
                        { label:'Status',    col:'status'   },
                        { label:'Priority',  col:'priority' },
                        { label:'Days Open', col:'daysOpen' },
                        { label:'Actions',   col:null       },
                      ].map(({ label, col }) => (
                        <th key={label}
                          onClick={() => col && handleSort(col)}
                          style={{ padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:700, color: sortCol===col ? T.primary : T.textSubtle, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap', cursor: col ? 'pointer':'default', userSelect:'none', background: sortCol===col ? '#F0F6FF':'transparent', transition:'all 0.15s' }}>
                          <div style={{ display:'flex', alignItems:'center' }}>
                            {label}
                            {col && <SortIcon col={col}/>}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding:'48px 20px', textAlign:'center' }}>
                          <div style={{ color:T.textSubtle, fontSize:'32px', marginBottom:'12px' }}>🔍</div>
                          <div style={{ fontWeight:700, fontSize:'14px', color:T.textMuted }}>No claims found</div>
                          <div style={{ fontSize:'13px', color:T.textSubtle, marginTop:'4px' }}>
                            Try adjusting your search or filter
                          </div>
                          <button onClick={() => { setSearch(''); setStatusFilter('All'); setDateFilter('All') }}
                            style={{ marginTop:'16px', padding:'8px 20px', borderRadius:'8px', border:`1px solid ${T.border}`, background:T.card, fontSize:'13px', fontWeight:600, color:T.textSecondary, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                            Clear filters
                          </button>
                        </td>
                      </tr>
                    ) : tableRows.map(claim => {
                      const pr = { High:{ c:'#DC2626', bg:'#FEF2F2' }, Normal:{ c:'#64748B', bg:'#F8FAFC' }, Low:{ c:'#059669', bg:'#ECFDF5' } }[claim.priority] || {}
                      const overdue = claim.daysOpen > 10
                      return (
                        <tr key={claim.id}
                          style={{ borderBottom:`1px solid ${T.borderSubtle}`, transition:'background 0.1s', cursor:'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.background='#F8FAFC'; setHoverClaim(claim); setMouse({x:e.clientX,y:e.clientY}) }}
                          onMouseLeave={e => { e.currentTarget.style.background=''; setHoverClaim(null) }}
                          onMouseMove={e => setMouse({x:e.clientX,y:e.clientY})}
                        >
                          <td style={{ padding:'12px 16px' }}>
                            <div style={{ fontSize:'12px', fontWeight:700, color:T.primary, fontFamily:'monospace' }}>{highlight(claim.id, search)}</div>
                            <div style={{ fontSize:'11px', color:T.textSubtle, marginTop:'2px' }}>{claim.policy}</div>
                          </td>
                          <td style={{ padding:'12px 16px' }}>
                            <div style={{ fontSize:'13px', fontWeight:600, color:T.textSecondary }}>{highlight(claim.claimant, search)}</div>
                            <div style={{ fontSize:'11px', color:T.textSubtle, marginTop:'2px' }}>{claim.created}</div>
                          </td>
                          <td style={{ padding:'12px 16px', fontSize:'12px', color:T.textMuted, fontWeight:500, whiteSpace:'nowrap' }}>{highlight(claim.type, search)}</td>
                          <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:700, color:T.textSecondary, whiteSpace:'nowrap' }}>{fmtRs(claim.amount)}</td>
                          <td style={{ padding:'12px 16px' }}><StatusBadge status={claim.status}/></td>
                          <td style={{ padding:'12px 16px' }}>
                            <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'6px', background:pr.bg, color:pr.c }}>{claim.priority}</span>
                          </td>
                          <td style={{ padding:'12px 16px' }}>
                            <span style={{ fontSize:'12px', fontWeight:700, color: overdue?'#DC2626':T.textMuted, background: overdue?'#FEF2F2':'transparent', padding: overdue?'2px 8px':'0', borderRadius:'99px' }}>
                              {claim.daysOpen}d {overdue && '⚠️'}
                            </span>
                          </td>
                          <td style={{ padding:'12px 16px' }}>
                            <div style={{ display:'flex', gap:'4px' }}>
                              {[
                                { I:Eye, title:'View (read-only)', hc:'#1D4ED8', hb:'#EFF6FF', fn: () => openClaimWorkspace(navigate, claim.id, { from: 'claimSearch' }) },
                                ...(showWorkClaimAction ? [{ I:Edit3, title:'Work claim', hc:'#059669', hb:'#ECFDF5', fn: () => openClaimWorkspace(navigate, claim.id, { from: 'dashboard' }) }] : []),
                              ].map(({I,title,hc,hb,fn},i)=>(
                                <button key={i} title={title} onClick={e => { e.stopPropagation(); fn() }}
                                  style={{ width:'28px', height:'28px', borderRadius:'6px', border:`1px solid ${T.border}`, background:'#F8FAFC', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:T.textMuted, transition:'all 0.15s' }}
                                  onMouseEnter={e => { e.currentTarget.style.background=hb; e.currentTarget.style.color=hc; e.currentTarget.style.borderColor=hc+'60' }}
                                  onMouseLeave={e => { e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.color=T.textMuted; e.currentTarget.style.borderColor=T.border }}>
                                  <I size={12}/>
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ padding:'12px 16px', borderTop:`1px solid ${T.borderSubtle}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:'12px', color:T.textMuted, fontWeight:500 }}>
                  Showing <strong>{tableRows.length}</strong> of <strong>{filtered.length}</strong> results
                </span>
                <div style={{ display:'flex', gap:'4px' }}>
                  {[1,2,3].map(p=>(
                    <button key={p} style={{ width:'28px', height:'28px', borderRadius:'6px', border:`1px solid ${p===1?T.primary:T.border}`, background: p===1?T.primary:T.card, color: p===1?'#fff':T.textMuted, fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s' }}>{p}</button>
                  ))}
                </div>
              </div>
            </>)}

            {/* Right: Activity + Quick Stats */}
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

              {card(<>
                {cardHeader('Activity', 'Last 24 hours',
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#EF4444', animation:'pulseRed 1.5s infinite' }}/>
                    <span style={{ fontSize:'11px', fontWeight:700, color:'#EF4444' }}>LIVE</span>
                  </div>
                )}
                <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:'12px' }}>
                  {!activity.length && (
                    <div style={{ fontSize:'12px', color:T.textMuted, textAlign:'center', padding:'16px 8px' }}>
                      No claim activity in the last 24 hours.
                    </div>
                  )}
                  {activity.map(a => {
                    const s = getActivityStyle(a.type)
                    return (
                      <div key={a.id} style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                        <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <s.Icon size={13} style={{ color:s.color }}/>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'12px', fontWeight:600, color:T.textSecondary }}>{a.action}</div>
                          <div style={{ fontSize:'11px', color:T.textSubtle, marginTop:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.detail || `${a.claim} · ${a.user}`}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>)}

              {/* Quick stats */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                {[
                  { label:'Approval Rate', value:`${metrics.approvalRate || 0}%`, color:'#059669', bg:'#ECFDF5', border:'#A7F3D0', icon:'✅' },
                  { label:'SLA Compliance',value:`${metrics.slaCompliance || 0}%`, color:'#1D4ED8', bg:'#EFF6FF', border:'#BFDBFE', icon:'🎯' },
                  { label:'High Priority', value:String(metrics.fraudFlags || 0), color:'#DC2626', bg:'#FEF2F2', border:'#FECACA', icon:'🚩' },
                  { label:'Avg. Days',     value:`${metrics.avgDaysOpen || 0}d`, color:'#D97706', bg:'#FFFBEB', border:'#FDE68A', icon:'⏱️' },
                ].map(s=>(
                  <div key={s.label} style={{ borderRadius:'10px', padding:'14px', background:s.bg, border:`1px solid ${s.border}`, cursor:'default', transition:'transform 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform=''}>
                    <div style={{ fontSize:'18px', marginBottom:'4px' }}>{s.icon}</div>
                    <div style={{ fontSize:'20px', fontWeight:900, color:s.color, letterSpacing:'-0.02em', lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:'11px', color:T.textMuted, marginTop:'4px', fontWeight:600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
      </div>

      {/* Overlays */}
      <HoverPreview claim={hoverClaim} x={mouse.x} y={mouse.y}/>

    </AppLayout>
  )
}
