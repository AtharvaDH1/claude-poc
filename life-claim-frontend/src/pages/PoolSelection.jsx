import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../layouts/AppLayout'
import { DataSearch, updateAssignedUser } from '../services/poolSelectionService'
import { getWorkflowPoolRoles, defaultPoolRole } from '../util/workflowRoles'
import ClaimHoverPreview from '../components/claim/ClaimHoverPreview'
import { Layers, UserPlus, ChevronDown } from 'lucide-react'

const T = {
  primary: '#1D4ED8', primaryHover: '#1E40AF',
  card: '#FFFFFF', border: '#E2E8F0', borderSubtle: '#F1F5F9',
  textPrimary: '#0F172A', textSecondary: '#334155',
  textMuted: '#64748B', textSubtle: '#94A3B8',
}

function mapPoolRow(c) {
  return {
    claimId: c.CLAIM_NUMBER || c.claimNumber || c.claimId,
    policyId: c.POLICY_ID || c.POLICY_NUMBER || c.policyId || '',
    status: c.STATUS || c.CLAIM_STATUS || c.status || '—',
    role: c.ROLE || c.role || '—',
    createdOn: (c.CREATED_AT || c.CREATED_ON || '').toString().split('T')[0] || '—',
    createdBy: c.CREATED_BY || c.createdBy || '—',
    claimType: c.CLAIM_TYPE || c.claimType || '',
  }
}

export default function PoolSelection() {
  const toast = useToast()
  const { user } = useAuth()
  const poolRoles = getWorkflowPoolRoles(user)
  const [poolType, setPoolType] = useState(() => defaultPoolRole(user))
  const [pool, setPool] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [poolOpen, setPoolOpen] = useState(false)
  const [hoverClaim, setHoverClaim] = useState(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  const loggedUser = sessionStorage.getItem('loggedUser') || user?.username || ''

  const loadPool = useCallback(async (role) => {
    if (!role) return
    setLoading(true)
    setSelected(new Set())
    try {
      const data = await DataSearch(role)
      setPool((Array.isArray(data) ? data : []).map(mapPoolRow).filter((r) => r.claimId))
    } catch (e) {
      setPool([])
      toast('error', 'Load failed', e?.message || 'Could not load pool.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (poolRoles.length && !poolRoles.includes(poolType)) {
      setPoolType(poolRoles[0])
      return
    }
    loadPool(poolType)
  }, [poolType, poolRoles, loadPool])

  const toggleSelect = (claimId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(claimId)) next.delete(claimId)
      else next.add(claimId)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === pool.length) setSelected(new Set())
    else setSelected(new Set(pool.map((p) => p.claimId)))
  }

  const handleAssignToSelf = async () => {
    if (!selected.size) {
      toast('warning', 'Select claims', 'Tick one or more claims to assign.')
      return
    }
    if (!loggedUser) {
      toast('error', 'Not signed in', 'No logged-in user for self-assign.')
      return
    }
    setAssigning(true)
    let ok = 0
    let fail = 0
    for (const claimId of selected) {
      try {
        await updateAssignedUser(claimId, loggedUser, poolType, true)
        ok += 1
      } catch {
        fail += 1
      }
    }
    setAssigning(false)
    setSelected(new Set())
    await loadPool(poolType)
    if (ok) toast('success', 'Assigned', `${ok} claim(s) assigned to you. Open My Task to work them.`)
    if (fail) toast('warning', 'Some failed', `${fail} claim(s) could not be assigned (may already be taken).`)
  }

  return (
    <AppLayout pageTitle="Pool Selection">
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif' }} onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: T.textPrimary, margin: 0 }}>Pool Selection</h1>
            <p style={{ fontSize: '13px', color: T.textMuted, marginTop: '4px' }}>
              Pick unassigned claims from the {poolType} pool, then assign to yourself and work them in My Task.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <Layers size={15} style={{ color: '#D97706' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400E' }}>{pool.length} unassigned</span>
          </div>
        </div>

        <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: T.textMuted }}>Pool type</span>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setPoolOpen((p) => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 14px', height: '40px', borderRadius: '8px', border: `1.5px solid ${T.border}`, background: '#F8FAFC', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif', color: T.textSecondary }}
            >
              {poolType}
              <ChevronDown size={14} />
            </button>
            {poolOpen && (
              <div style={{ position: 'absolute', top: '44px', left: 0, background: '#fff', border: `1px solid ${T.border}`, borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 20, minWidth: '140px' }}>
                {poolRoles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setPoolType(r); setPoolOpen(false) }}
                    style={{ display: 'block', width: '100%', padding: '10px 14px', border: 'none', background: poolType === r ? '#EFF6FF' : 'transparent', textAlign: 'left', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: poolType === r ? T.primary : T.textSecondary, fontFamily: 'Inter,sans-serif' }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleAssignToSelf}
            disabled={assigning || !selected.size}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', height: '40px', borderRadius: '8px', border: 'none', background: selected.size && !assigning ? T.primary : '#CBD5E1', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: selected.size && !assigning ? 'pointer' : 'not-allowed', fontFamily: 'Inter,sans-serif' }}
          >
            <UserPlus size={16} />
            {assigning ? 'Assigning…' : `Assign to self (${selected.size})`}
          </button>
        </div>

        <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: T.textMuted, fontWeight: 600 }}>Loading pool…</div>
          ) : pool.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: T.textPrimary }}>Pool is empty</div>
              <div style={{ fontSize: '13px', color: T.textMuted, marginTop: '6px' }}>No unassigned {poolType} claims (role = {poolType}, ASSIGNED_TO is null).</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FAFAFA', borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ padding: '10px 12px', width: '40px' }}>
                      <input type="checkbox" checked={selected.size === pool.length && pool.length > 0} onChange={toggleAll} />
                    </th>
                    {['Claim Number', 'Policy Number', 'Status', 'Role', 'Created On', 'Created By'].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pool.map((item) => (
                    <tr key={item.claimId} style={{ borderBottom: `1px solid ${T.borderSubtle}` }}>
                      <td style={{ padding: '12px' }}>
                        <input type="checkbox" checked={selected.has(item.claimId)} onChange={() => toggleSelect(item.claimId)} />
                      </td>
                      <td
                        style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: T.primary, fontFamily: 'monospace', cursor: 'default' }}
                        onMouseEnter={() => setHoverClaim(item)}
                        onMouseLeave={() => setHoverClaim(null)}
                      >
                        {item.claimId}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', color: T.textMuted }}>{item.policyId}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: T.textSecondary }}>{item.status}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: T.textMuted }}>{item.role}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: T.textMuted }}>{item.createdOn}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: T.textMuted }}>{item.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{ fontSize: '12px', color: T.textSubtle, marginTop: '12px' }}>
          There is no open-claim link here. After assign, go to <strong>My Task</strong> to open the claim in work mode.
        </p>

        <ClaimHoverPreview claim={hoverClaim} x={mouse.x} y={mouse.y} />
      </div>
    </AppLayout>
  )
}
