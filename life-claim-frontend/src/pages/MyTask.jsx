import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../context/AuthContext'
import { CheckSquare, Eye, Search, ChevronLeft, ChevronRight, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { getClaimsByUser } from '../services/claimsService'
import { getWorkflowPoolRoles } from '../util/workflowRoles'
import { workflowStatusFromRow, workflowRoleFromRow } from '../util/claimSearchMap'
import { filterClaimRows, sortClaimRows, uniqueFieldValues, CLAIM_TABLE_COLUMNS } from '../util/claimTableFilters'
import ClaimHoverPreview from '../components/claim/ClaimHoverPreview'

const T = {
  primary: '#1D4ED8', primaryHover: '#1E40AF',
  card: '#FFFFFF', border: '#E2E8F0', borderSubtle: '#F1F5F9',
  textPrimary: '#0F172A', textSecondary: '#334155',
  textMuted: '#64748B', textSubtle: '#94A3B8',
}

const PAGE_SIZE = 10

function statusBadgeStyle(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('pending assessor')) return { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' }
  if (s.includes('pending verifier')) return { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF' }
  if (s.includes('payout completed') || s.includes('approved')) return { bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46' }
  if (s.includes('reject') || s.includes('repudi')) return { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B' }
  if (s.includes('pending')) return { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' }
  return { bg: '#F8FAFC', border: T.border, color: T.textMuted }
}

function mapTaskRow(c) {
  const status = workflowStatusFromRow(c)
  const role = workflowRoleFromRow(c)
  return {
    claimId: c.CLAIM_NUMBER || c.id || c.claimNumber,
    policyId: c.POLICY_ID || c.policy || '',
    createdOn: (c.CREATED_AT || c.CREATED_ON || '').toString().split('T')[0] || '—',
    createdBy: c.CREATED_BY || c.createdBy || '—',
    status,
    role,
    claimType: c.CLAIM_TYPE || c.type || '',
    assignedTo: c.ASSIGNED_TO || c.assignedTo || '',
  }
}

export default function MyTask() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const workflowRoles = getWorkflowPoolRoles(user)

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const [searchApplied, setSearchApplied] = useState('')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [sortCol, setSortCol] = useState('status')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(0)
  const [hoverClaim, setHoverClaim] = useState(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  const loggedUser = sessionStorage.getItem('loggedUser') || user?.username || ''

  useEffect(() => {
    if (!loggedUser) return
    setLoading(true)
    getClaimsByUser(loggedUser)
      .then((data) => {
        const arr = Array.isArray(data) ? data : data?.claims || []
        setTasks(arr.map(mapTaskRow).filter((t) => t.claimId))
      })
      .catch(() => toast('error', 'Load Failed', 'Could not load your tasks.'))
      .finally(() => setLoading(false))
  }, [loggedUser, toast])

  const applySearch = () => {
    const q = searchQ.trim()
    setSearchApplied(q)
    setPage(0)
    if (q && !tasks.some((t) => String(t.claimId).toLowerCase() === q.toLowerCase())) {
      toast('info', 'Not in list', 'That claim number is not in your loaded tasks.')
    }
  }

  const statusOptions = useMemo(() => ['All Statuses', ...uniqueFieldValues(tasks, 'status')], [tasks])

  const filtered = useMemo(() => {
    const list = filterClaimRows(tasks, {
      search: searchApplied,
      statusFilter,
      roleFilter,
    })
    return sortClaimRows(list, sortCol, sortDir)
  }, [tasks, searchApplied, statusFilter, roleFilter, sortCol, sortDir])

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
    setPage(0)
  }

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ArrowUpDown size={11} style={{ color: T.textSubtle, marginLeft: '4px', opacity: 0.5 }} />
    return sortDir === 'asc'
      ? <ArrowUp size={11} style={{ color: T.primary, marginLeft: '4px' }} />
      : <ArrowDown size={11} style={{ color: T.primary, marginLeft: '4px' }} />
  }

  const singleResultMode = searchApplied && filtered.length <= 1
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageRows = singleResultMode ? filtered : filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  useEffect(() => {
    if (page > totalPages - 1) setPage(0)
  }, [page, totalPages])

  const handleOpen = (task) => {
    navigate(`/registration-fetch/${encodeURIComponent(task.claimId)}`, {
      state: { from: 'myTask' },
    })
  }

  const roleOptions = ['All Roles', ...workflowRoles]

  return (
    <AppLayout pageTitle="My Tasks">
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif' }} onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: T.textPrimary, margin: 0 }}>My Task</h1>
          <p style={{ fontSize: '13px', color: T.textMuted, marginTop: '4px' }}>
            Claims linked to you (assigned, modified, or assessor/approver username). Open in work mode — no browse-only flag.
          </p>
        </div>

        <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '16px 20px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', height: '40px', borderRadius: '8px', border: `1.5px solid ${T.border}`, background: '#F8FAFC' }}>
            <Search size={14} style={{ color: T.textSubtle }} />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              placeholder="Search claim, policy, or creator"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', fontFamily: 'Inter,sans-serif' }}
            />
            {searchQ && (
              <button type="button" onClick={() => { setSearchQ(''); setSearchApplied(''); setPage(0) }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.textSubtle }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button type="button" onClick={applySearch} style={{ padding: '0 18px', height: '40px', borderRadius: '8px', border: 'none', background: T.primary, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            Search
          </button>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
            style={{ height: '40px', padding: '0 12px', borderRadius: '8px', border: `1.5px solid ${T.border}`, fontSize: '13px', fontWeight: 600, fontFamily: 'Inter,sans-serif', color: T.textSecondary, minWidth: '180px' }}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(0) }}
            style={{ height: '40px', padding: '0 12px', borderRadius: '8px', border: `1.5px solid ${T.border}`, fontSize: '13px', fontWeight: 600, fontFamily: 'Inter,sans-serif', color: T.textSecondary }}
          >
            {roleOptions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.borderSubtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>Your claims</div>
              <div style={{ fontSize: '12px', color: T.textMuted }}>{filtered.length} shown · POST claimByUsername</div>
            </div>
            {!singleResultMode && filtered.length > PAGE_SIZE && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button type="button" disabled={safePage <= 0} onClick={() => setPage((p) => p - 1)} style={{ padding: '6px', borderRadius: '6px', border: `1px solid ${T.border}`, background: '#fff', cursor: safePage <= 0 ? 'not-allowed' : 'pointer' }}>
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '12px', fontWeight: 600, color: T.textMuted }}>Page {safePage + 1} / {totalPages}</span>
                <button type="button" disabled={safePage >= totalPages - 1} onClick={() => setPage((p) => p + 1)} style={{ padding: '6px', borderRadius: '6px', border: `1px solid ${T.border}`, background: '#fff', cursor: safePage >= totalPages - 1 ? 'not-allowed' : 'pointer' }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: T.textMuted }}>Loading tasks…</div>
          ) : pageRows.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <CheckSquare size={32} style={{ color: '#059669', margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, color: T.textPrimary }}>No tasks match</div>
              <div style={{ fontSize: '13px', color: T.textMuted, marginTop: '6px' }}>Assign claims from Pool Selection to see them here.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FAFAFA', borderBottom: `2px solid ${T.border}` }}>
                    {CLAIM_TABLE_COLUMNS.map(({ label, key }) => (
                      <th
                        key={key}
                        onClick={() => handleSort(key)}
                        style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{label}<SortIcon col={key} /></span>
                      </th>
                    ))}
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((task) => {
                    const sc = statusBadgeStyle(task.status)
                    return (
                      <tr key={task.claimId} style={{ borderBottom: `1px solid ${T.borderSubtle}` }}>
                        <td
                          style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: T.primary, fontFamily: 'monospace' }}
                          onMouseEnter={() => setHoverClaim(task)}
                          onMouseLeave={() => setHoverClaim(null)}
                        >
                          {task.claimId}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', color: T.textMuted }}>{task.policyId}</td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: T.textMuted }}>{task.createdOn}</td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: T.textMuted }}>{task.createdBy}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>
                            {task.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: T.textSecondary }}>{task.role}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpen(task)}
                            title="Open in work mode"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', border: `1px solid ${T.border}`, background: '#F8FAFC', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif', color: T.textSecondary }}
                          >
                            <Eye size={14} /> Open
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <ClaimHoverPreview claim={hoverClaim} x={mouse.x} y={mouse.y} />
      </div>
    </AppLayout>
  )
}
