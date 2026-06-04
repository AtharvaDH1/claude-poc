import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../context/AuthContext'
import { CheckSquare, ExternalLink, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { getClaimsByUser } from '../services/claimsService'
import { changeClaimStatus } from '../services/claimsService'

const T = {
  primary: '#1D4ED8', primaryHover: '#1E40AF',
  pageBg: '#F1F5F9', card: '#FFFFFF',
  border: '#E2E8F0', borderSubtle: '#F1F5F9',
  textPrimary: '#0F172A', textSecondary: '#334155',
  textMuted: '#64748B', textSubtle: '#94A3B8',
}

const fmt = n => new Intl.NumberFormat('en-IN').format(n)
const fmtRs = n => `₹${n >= 1e7 ? (n/1e7).toFixed(1)+'Cr' : n >= 1e5 ? (n/1e5).toFixed(1)+'L' : fmt(n)}`

const STATUS_STYLES = {
  'In Progress':    { bg:'#EFF6FF', border:'#BFDBFE', color:'#1E40AF' },
  'Pending Review': { bg:'#FFFBEB', border:'#FDE68A', color:'#92400E' },
  'Completed':      { bg:'#ECFDF5', border:'#A7F3D0', color:'#065F46' },
}

const PRIORITY_STYLES = {
  High:   { bg:'#FEF2F2', color:'#DC2626' },
  Normal: { bg:'#EFF6FF', color:'#1D4ED8' },
  Low:    { bg:'#ECFDF5', color:'#059669' },
}

export default function MyTask() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    if (!user?.username) return
    getClaimsByUser(user.username).then(data => {
      const mapped = (data || []).map(c => ({
        claimId:      c.CLAIM_NUMBER || c.id,
        policyId:     c.POLICY_ID    || c.policy    || '',
        claimant:     c.CREATED_BY   || c.claimant  || 'Unknown',
        type:         c.CLAIM_TYPE   || c.type      || 'Death Claim',
        assignedDate: (c.CREATED_AT  || '').toString().split('T')[0],
        dueDate:      (c.MODIFIED_AT || '').toString().split('T')[0],
        priority:     c.priority     || 'Normal',
        status:       c.CLAIM_STATUS || c.status    || 'Pending',
        daysOpen:     c.daysOpen     || 0,
        amount:       c.amount       || 0,
      }))
      if (mapped.length) setTasks(mapped)
    }).catch(() => toast('error', 'Load Failed', 'Could not load your tasks.'))
  }, [user?.username, toast])
  const [hovRow, setHovRow] = useState(null)
  const today = '2025-06-02'

  const isOverdue = (dueDate) => dueDate < today

  const handleComplete = (task) => {
    setTasks(prev => prev.map(t => t.claimId === task.claimId ? { ...t, status:'Completed' } : t))
    changeClaimStatus(task.claimId, 'Approved', 'Task completed by assessor').catch(() => {})
    toast('success', 'Task Completed', `${task.claimId} marked as completed.`)
  }

  const handleOpen = (task) => {
    navigate(`/claim-view/${task.claimId}`)
  }

  const pending = tasks.filter(t => t.status !== 'Completed')
  const completed = tasks.filter(t => t.status === 'Completed')

  return (
    <AppLayout pageTitle="My Tasks">
      <div style={{ padding:'24px', fontFamily:'Inter,sans-serif' }}>

        {/* Page header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
          <div>
            <h1 style={{ fontSize:'22px', fontWeight:800, color:T.textPrimary, letterSpacing:'-0.02em', margin:0 }}>My Tasks</h1>
            <p style={{ fontSize:'13px', color:T.textMuted, marginTop:'4px', fontWeight:500 }}>
              Your assigned claims and their current status.
            </p>
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            <div style={{ textAlign:'center', padding:'10px 16px', borderRadius:'10px', background:T.card, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:'20px', fontWeight:800, color:T.primary }}>{pending.length}</div>
              <div style={{ fontSize:'11px', color:T.textMuted, fontWeight:600, marginTop:'2px' }}>Active</div>
            </div>
            <div style={{ textAlign:'center', padding:'10px 16px', borderRadius:'10px', background:'#ECFDF5', border:'1px solid #A7F3D0' }}>
              <div style={{ fontSize:'20px', fontWeight:800, color:'#059669' }}>{completed.length}</div>
              <div style={{ fontSize:'11px', color:'#065F46', fontWeight:600, marginTop:'2px' }}>Done</div>
            </div>
            <div style={{ textAlign:'center', padding:'10px 16px', borderRadius:'10px', background:'#FEF2F2', border:'1px solid #FECACA' }}>
              <div style={{ fontSize:'20px', fontWeight:800, color:'#DC2626' }}>{tasks.filter(t => isOverdue(t.dueDate) && t.status!=='Completed').length}</div>
              <div style={{ fontSize:'11px', color:'#991B1B', fontWeight:600, marginTop:'2px' }}>Overdue</div>
            </div>
          </div>
        </div>

        {/* Tasks table */}
        <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:`1px solid ${T.borderSubtle}` }}>
            <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary }}>Assigned Claims</div>
            <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'2px', fontWeight:500 }}>{tasks.length} total tasks</div>
          </div>

          {tasks.length === 0 ? (
            <div style={{ padding:'60px 24px', textAlign:'center' }}>
              <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'#ECFDF5', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <CheckSquare size={24} style={{ color:'#059669' }} />
              </div>
              <div style={{ fontWeight:700, fontSize:'16px', color:T.textPrimary, marginBottom:'8px' }}>All caught up!</div>
              <div style={{ fontSize:'13px', color:T.textMuted }}>You have no assigned tasks. Go to Pool Selection to pick up new claims.</div>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
                    {['Claim ID','Claimant','Type','Assigned','Due Date','Priority','Status','Days Open','Amount','Actions'].map(h => (
                      <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, i) => {
                    const overdue = isOverdue(task.dueDate) && task.status !== 'Completed'
                    const statusStyle = STATUS_STYLES[task.status] || STATUS_STYLES['In Progress']
                    const prStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Normal
                    return (
                      <tr key={task.claimId}
                        style={{ borderBottom:`1px solid ${T.borderSubtle}`, background: overdue ? 'rgba(254,242,242,0.5)' : hovRow===i ? '#F8FAFC' : 'transparent', transition:'background 0.1s' }}
                        onMouseEnter={() => setHovRow(i)}
                        onMouseLeave={() => setHovRow(null)}>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ fontSize:'12px', fontWeight:700, color:T.primary, fontFamily:'monospace' }}>{task.claimId}</div>
                          <div style={{ fontSize:'11px', color:T.textSubtle, marginTop:'2px', fontFamily:'monospace' }}>{task.policyId}</div>
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:600, color:T.textSecondary }}>{task.claimant}</td>
                        <td style={{ padding:'12px 16px', fontSize:'12px', color:T.textMuted, fontWeight:500, whiteSpace:'nowrap' }}>{task.type}</td>
                        <td style={{ padding:'12px 16px', fontSize:'12px', color:T.textMuted, fontWeight:500 }}>{task.assignedDate}</td>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                            {overdue && <AlertTriangle size={12} style={{ color:'#DC2626', flexShrink:0 }} />}
                            <span style={{ fontSize:'12px', fontWeight:700, color: overdue?'#DC2626':T.textMuted }}>{task.dueDate}</span>
                          </div>
                          {overdue && <div style={{ fontSize:'10px', color:'#DC2626', fontWeight:600, marginTop:'2px' }}>OVERDUE</div>}
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'6px', background:prStyle.bg, color:prStyle.color }}>{task.priority}</span>
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'99px', background:statusStyle.bg, border:`1px solid ${statusStyle.border}`, color:statusStyle.color }}>
                            {task.status}
                          </span>
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ fontSize:'12px', fontWeight:700, color: task.daysOpen > 7?'#D97706':T.textMuted }}>{task.daysOpen}d</span>
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:700, color:T.textSecondary, whiteSpace:'nowrap' }}>{fmtRs(task.amount)}</td>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', gap:'6px' }}>
                            <button
                              onClick={() => handleOpen(task)}
                              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'7px', border:`1px solid ${T.border}`, background:'#F8FAFC', color:T.textSecondary, fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s', whiteSpace:'nowrap' }}
                              onMouseEnter={e => { e.currentTarget.style.background='#EFF6FF'; e.currentTarget.style.color=T.primary; e.currentTarget.style.borderColor=T.primary+'60' }}
                              onMouseLeave={e => { e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.color=T.textSecondary; e.currentTarget.style.borderColor=T.border }}>
                              <ExternalLink size={11} /> Open
                            </button>
                            {task.status !== 'Completed' && (
                              <button
                                onClick={() => handleComplete(task)}
                                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'7px', border:'none', background:'#ECFDF5', color:'#059669', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s', whiteSpace:'nowrap' }}
                                onMouseEnter={e => { e.currentTarget.style.background='#059669'; e.currentTarget.style.color='#fff' }}
                                onMouseLeave={e => { e.currentTarget.style.background='#ECFDF5'; e.currentTarget.style.color='#059669' }}>
                                <CheckCircle size={11} /> Complete
                              </button>
                            )}
                          </div>
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
