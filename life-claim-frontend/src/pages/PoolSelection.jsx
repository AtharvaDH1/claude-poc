import { useState, useEffect } from 'react'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../layouts/AppLayout'
import { DataSearch, updateAssignedUser } from '../services/poolSelectionService'
import { Layers, UserPlus, ChevronDown, AlertTriangle } from 'lucide-react'

const T = {
  primary: '#1D4ED8', primaryHover: '#1E40AF',
  pageBg: '#F1F5F9', card: '#FFFFFF',
  border: '#E2E8F0', borderSubtle: '#F1F5F9',
  textPrimary: '#0F172A', textSecondary: '#334155',
  textMuted: '#64748B', textSubtle: '#94A3B8',
}

const PRIORITY_STYLES = {
  High:   { bg:'#FEF2F2', color:'#DC2626', border:'#FECACA' },
  Normal: { bg:'#F8FAFC', color:'#64748B', border:'#E2E8F0' },
  Low:    { bg:'#ECFDF5', color:'#059669', border:'#A7F3D0' },
}

export default function PoolSelection() {
  const toast = useToast()
  const { user } = useAuth()
  const [pool, setPool] = useState([])

  useEffect(() => {
    if (!user?.username) return
    const role = user.roles?.includes('Verifier') ? 'Verifier' : 'Assessor'
    DataSearch(role).then(data => {
      const items = (Array.isArray(data) ? data : []).map(c => ({
        claimId:         c.CLAIM_NUMBER || c.claimId,
        policyId:        c.POLICY_ID    || c.policyId    || '',
        claimant:        c.CREATED_BY   || c.claimant    || 'Unknown',
        type:            c.CLAIM_TYPE   || c.type        || 'Death Claim',
        registeredDate:  (c.CREATED_AT  || c.registeredDate || '').toString().split('T')[0],
        priority:        c.priority     || 'Normal',
        status:          c.CLAIM_STATUS || c.status      || 'Pending',
        daysOpen:        c.daysOpen     || 0,
      }))
      setPool(items)
    }).catch(() => toast('error', 'Load Failed', 'Could not load pool data.'))
  }, [user?.username, user?.roles, toast])
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [sortByDays, setSortByDays] = useState(true)
  const [hovRow, setHovRow] = useState(null)
  const [dropOpen, setDropOpen] = useState(false)

  const handleAssign = async (item) => {
    const role = user?.roles?.includes('Verifier') ? 'Verifier' : 'Assessor'
    try {
      await updateAssignedUser(item.claimId, user.username, role, true)
      setPool(prev => prev.filter(p => p.claimId !== item.claimId))
      toast('success', 'Claim Assigned', `${item.claimId} has been added to your tasks.`)
    } catch {
      toast('error', 'Assign Failed', 'Could not assign this claim.')
    }
  }

  let displayed = pool
  if (priorityFilter !== 'All') displayed = displayed.filter(p => p.priority === priorityFilter)
  if (sortByDays) displayed = [...displayed].sort((a, b) => b.daysOpen - a.daysOpen)

  return (
    <AppLayout pageTitle="Pool Selection">
      <div style={{ padding:'24px', fontFamily:'Inter,sans-serif' }}>

        {/* Page header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
          <div>
            <h1 style={{ fontSize:'22px', fontWeight:800, color:T.textPrimary, letterSpacing:'-0.02em', margin:0 }}>Pool Selection</h1>
            <p style={{ fontSize:'13px', color:T.textMuted, marginTop:'4px', fontWeight:500 }}>
              Select claims from the unassigned pool to work on.
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 16px', borderRadius:'10px', background:'#FFFBEB', border:'1px solid #FDE68A' }}>
            <Layers size={15} style={{ color:'#D97706' }} />
            <span style={{ fontSize:'13px', fontWeight:700, color:'#92400E' }}>{pool.length} unassigned</span>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', padding:'16px 20px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
          <span style={{ fontSize:'13px', fontWeight:600, color:T.textMuted }}>Filter:</span>

          {/* Priority pills */}
          <div style={{ display:'flex', gap:'4px', background:'#F8FAFC', border:`1px solid ${T.border}`, borderRadius:'8px', padding:'3px' }}>
            {['All','High','Normal','Low'].map(p => (
              <button key={p} onClick={() => setPriorityFilter(p)}
                style={{ padding:'5px 12px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:700, fontFamily:'Inter,sans-serif', transition:'all 0.15s', background: priorityFilter===p ? T.primary : 'transparent', color: priorityFilter===p ? '#fff' : T.textSubtle, boxShadow: priorityFilter===p ? '0 2px 6px rgba(29,78,216,0.25)' : 'none' }}>
                {p}
              </button>
            ))}
          </div>

          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ fontSize:'12px', fontWeight:600, color:T.textMuted }}>Sort by days open:</span>
            <button
              onClick={() => setSortByDays(p => !p)}
              style={{ padding:'5px 12px', borderRadius:'6px', border:`1px solid ${T.border}`, background: sortByDays ? '#EFF6FF' : '#F8FAFC', color: sortByDays ? T.primary : T.textMuted, fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s' }}>
              {sortByDays ? 'Oldest First ↑' : 'Default Order'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:`1px solid ${T.borderSubtle}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary }}>Unassigned Claims Pool</div>
              <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'2px', fontWeight:500 }}>{displayed.length} claims available</div>
            </div>
          </div>

          {displayed.length === 0 ? (
            <div style={{ padding:'60px 24px', textAlign:'center' }}>
              <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'#ECFDF5', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <Layers size={24} style={{ color:'#059669' }} />
              </div>
              <div style={{ fontWeight:700, fontSize:'16px', color:T.textPrimary, marginBottom:'8px' }}>Pool is Empty</div>
              <div style={{ fontSize:'13px', color:T.textMuted }}>No unassigned claims match the current filter.</div>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
                    {['Claim ID','Policy ID','Claimant','Type','Priority','Registered Date','Days Open','Action'].map(h => (
                      <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((item, i) => {
                    const pr = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.Normal
                    const overdue = item.daysOpen > 10
                    return (
                      <tr key={item.claimId}
                        style={{ borderBottom:`1px solid ${T.borderSubtle}`, background: overdue ? 'rgba(254,242,242,0.4)' : hovRow===i ? '#F8FAFC' : 'transparent', transition:'background 0.1s' }}
                        onMouseEnter={() => setHovRow(i)}
                        onMouseLeave={() => setHovRow(null)}>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ fontSize:'12px', fontWeight:700, color:T.primary, fontFamily:'monospace' }}>{item.claimId}</div>
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:'12px', fontWeight:600, color:T.textMuted, fontFamily:'monospace' }}>{item.policyId}</td>
                        <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:600, color:T.textSecondary }}>{item.claimant}</td>
                        <td style={{ padding:'12px 16px', fontSize:'12px', color:T.textMuted, fontWeight:500, whiteSpace:'nowrap' }}>{item.type}</td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'6px', background:pr.bg, color:pr.color, border:`1px solid ${pr.border}` }}>{item.priority}</span>
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:'12px', color:T.textMuted, fontWeight:500 }}>{item.registeredDate}</td>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                            {overdue && <AlertTriangle size={13} style={{ color:'#DC2626' }} />}
                            <span style={{ fontSize:'12px', fontWeight:700, color: overdue?'#DC2626':T.textMuted, background: overdue?'#FEF2F2':'transparent', padding: overdue?'2px 8px':'0', borderRadius:'99px' }}>
                              {item.daysOpen}d
                            </span>
                          </div>
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <button
                            onClick={() => handleAssign(item)}
                            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'7px', border:'none', background:T.primary, color:'#fff', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s', whiteSpace:'nowrap' }}
                            onMouseEnter={e => { e.currentTarget.style.background=T.primaryHover; e.currentTarget.style.transform='translateY(-1px)' }}
                            onMouseLeave={e => { e.currentTarget.style.background=T.primary; e.currentTarget.style.transform='' }}>
                            <UserPlus size={12} /> Assign to Me
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
      </div>
    </AppLayout>
  )
}
