import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useToast } from '../components/Toast'
import adminService from '../services/adminService'
import { getUsers } from '../services/userService'

const T = {
  primary: '#1D4ED8',
  card: '#fff',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textMuted: '#64748B',
}

const VIEW_LABELS = {
  slaBreached: 'SLA breached (>3 days pending)',
  slaAtRisk: 'SLA at risk (1–3 days pending)',
  openByRole: 'Open / pending by role',
  rejected30d: 'Rejected in last 30 days',
}

const ROLES = ['Pre Assessor', 'Assessor', 'Verifier']

function normRole(r) {
  return String(r || '').trim()
}

export default function AdminClaimSearch() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const view = params.get('view') || 'openByRole'
  const toast = useToast()
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [assigning, setAssigning] = useState(null)
  const [draftAssignee, setDraftAssignee] = useState({})

  const canAssign = view === 'openByRole'

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        let list = await adminService.getRecentClaims({ limit: 300, view })
        if (!list?.length) {
          const summary = await adminService.getSummary()
          const key = {
            slaBreached: 'slaBreachedClaims',
            slaAtRisk: 'slaAtRiskClaims',
            openByRole: 'openByRoleClaims',
            rejected30d: 'rejected30dClaims',
          }[view]
          list = summary?.[key] || []
        }
        if (!cancelled) setClaims(Array.isArray(list) ? list : [])
      } catch (e) {
        if (!cancelled) {
          toast('error', 'Load failed', e?.message || 'Could not load claims.')
          setClaims([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [view, toast])

  useEffect(() => {
    if (!canAssign) return
    getUsers()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.users || data?.data || []
        setUsers(list.filter((u) => u.active !== false && u.active !== 0))
      })
      .catch(() => setUsers([]))
  }, [canAssign])

  const usersByRole = useMemo(() => {
    const buckets = { 'Pre Assessor': [], Assessor: [], Verifier: [] }
    users.forEach((u) => {
      const roles = Array.isArray(u.roles) ? u.roles : (u.role ? [u.role] : [])
      roles.forEach((r) => {
        const nr = normRole(r)
        if (buckets[nr]) buckets[nr].push(u.username)
      })
    })
    return buckets
  }, [users])

  const handleAssign = async (claim) => {
    const claimNumber = claim.claimNumber || claim.CLAIM_NUMBER
    const role = claim.role || claim.ROLE
    const assignee = draftAssignee[claimNumber]
    if (!assignee) {
      toast('warning', 'Assignee', 'Select a user for this claim.')
      return
    }
    setAssigning(claimNumber)
    try {
      await adminService.assignClaim({ claimNumber, assignee, role })
      toast('success', 'Assigned', `${claimNumber} → ${assignee}`)
      setClaims((prev) =>
        prev.map((c) =>
          (c.claimNumber || c.CLAIM_NUMBER) === claimNumber ? { ...c, assignedTo: assignee } : c
        )
      )
    } catch (e) {
      toast('error', 'Assign failed', e?.message || 'Could not assign claim.')
    } finally {
      setAssigning(null)
    }
  }

  return (
    <AppLayout pageTitle="Admin claim search" pageSubtitle={VIEW_LABELS[view] || view}>
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px' }}>Claim drill-down</h1>
        <p style={{ fontSize: '13px', color: T.textMuted, marginBottom: '12px' }}>
          {VIEW_LABELS[view] || view}
          {canAssign ? ' · Assign claims to users below' : ' · Read-only list'}
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {Object.entries(VIEW_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => navigate(`/admin/claim-search?view=${key}`)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: `1px solid ${view === key ? T.primary : T.border}`,
                background: view === key ? '#EFF6FF' : '#F8FAFC',
                color: view === key ? T.primary : T.textMuted,
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'Inter,sans-serif',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '32px', color: T.textMuted }}>Loading claims…</div>
        ) : claims.length === 0 ? (
          <div style={{ padding: '32px', color: T.textMuted }}>No claims for this view.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Claim', 'Policy', 'Status', 'Role', 'Assigned', ...(canAssign ? ['Assign to', ''] : [])].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => {
                const cn = c.claimNumber || c.CLAIM_NUMBER
                const role = normRole(c.role || c.ROLE)
                const options = usersByRole[role] || []
                return (
                  <tr key={cn} style={{ borderTop: `1px solid #F1F5F9` }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: T.primary }}>{cn}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px' }}>{c.policyNumber || c.POLICY_NUMBER || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px' }}>{c.status || c.STATUS}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px' }}>{role}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px' }}>{c.assignedTo || c.ASSIGNED_TO || '—'}</td>
                    {canAssign && (
                      <>
                        <td style={{ padding: '10px 14px' }}>
                          <select
                            value={draftAssignee[cn] || ''}
                            onChange={(e) => setDraftAssignee((p) => ({ ...p, [cn]: e.target.value }))}
                            style={{ height: '34px', minWidth: '140px', borderRadius: '6px', border: `1px solid ${T.border}`, fontSize: '12px', fontFamily: 'Inter,sans-serif' }}
                          >
                            <option value="">— Select —</option>
                            {options.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <button
                            type="button"
                            disabled={assigning === cn}
                            onClick={() => handleAssign(c)}
                            style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: T.primary, color: '#fff', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
                          >
                            {assigning === cn ? '…' : 'Assign'}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  )
}
