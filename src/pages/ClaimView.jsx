import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import DocumentUpload from '../components/DocumentUpload'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { fetchClaimDetails, updateClaimStatus } from '../services/mockServices'
import { getClaimByNumber, changeClaimStatus } from '../services/claimsService'

const T = { primary:'#1D4ED8', card:'#fff', border:'#E2E8F0', borderSubtle:'#F1F5F9', textPrimary:'#0F172A', textSecondary:'#334155', textMuted:'#64748B', textSubtle:'#94A3B8' }
const fmtRs = n => n ? `₹${Number(n)>=1e7?(Number(n)/1e7).toFixed(1)+'Cr':Number(n)>=1e5?(Number(n)/1e5).toFixed(1)+'L':Number(n).toLocaleString('en-IN')}` : '—'

const STATUS_COLORS = { Pending:{ bg:'#FFFBEB',border:'#FDE68A',color:'#92400E' }, Approved:{ bg:'#ECFDF5',border:'#A7F3D0',color:'#065F46' }, Rejected:{ bg:'#FEF2F2',border:'#FECACA',color:'#991B1B' }, 'In Progress':{ bg:'#EFF6FF',border:'#BFDBFE',color:'#1E40AF' } }

const TABS = ['Overview','Demographics','Requirements','Assessment','Decision','Documents','Audit Trail']

function ROField({ label, value, span }) {
  return (
    <div style={{ gridColumn: span?'1/-1':'auto' }}>
      <div style={{ fontSize:'10px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'3px' }}>{label}</div>
      <div style={{ fontSize:'13px', fontWeight:600, color:T.textSecondary, padding:'8px 10px', background:'#F8FAFC', borderRadius:'6px', border:`1px solid ${T.border}`, minHeight:'36px', wordBreak:'break-word' }}>{value||'—'}</div>
    </div>
  )
}

function ROGrid({ cols=3, children }) {
  return <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:'12px' }}>{children}</div>
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:'20px' }}>
      <div style={{ fontSize:'11px', fontWeight:700, color:T.primary, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px', paddingBottom:'6px', borderBottom:`2px solid ${T.border}` }}>{title}</div>
      {children}
    </div>
  )
}

/* ── Quick Control Modal ── */
function QuickControlModal({ claim, onClose, onSave }) {
  const [status, setStatus] = useState(claim.status)
  const [remarks, setRemarks] = useState('')
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)' }}>
      <div style={{ background:'#fff', borderRadius:'16px', width:'440px', boxShadow:'0 24px 64px rgba(0,0,0,0.2)', overflow:'hidden' }}>
        <div style={{ padding:'18px 22px', borderBottom:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:800, fontSize:'15px', color:T.textPrimary }}>Quick Control — {claim.claimId}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'20px', color:T.textMuted }}>×</button>
        </div>
        <div style={{ padding:'20px 22px' }}>
          <div style={{ marginBottom:'16px' }}>
            <label style={{ display:'block', fontSize:'12px', fontWeight:700, color:T.textSecondary, marginBottom:'6px' }}>Change Status</label>
            <div style={{ display:'flex', gap:'8px' }}>
              {['Pending','In Progress','Approved','Rejected'].map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  style={{ flex:1, padding:'10px 8px', borderRadius:'8px', border:`1.5px solid ${status===s?T.primary:T.border}`, background:status===s?'#EFF6FF':'#F8FAFC', color:status===s?T.primary:T.textMuted, fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'12px', fontWeight:700, color:T.textSecondary, marginBottom:'6px' }}>Remarks <span style={{ color:'#EF4444' }}>*</span></label>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} placeholder="Enter reason for status change..."
              style={{ width:'100%', padding:'10px 12px', border:`1.5px solid ${T.border}`, borderRadius:'8px', fontSize:'13px', fontFamily:'Inter,sans-serif', outline:'none', resize:'vertical', boxSizing:'border-box' }}
              onFocus={e => e.target.style.borderColor=T.primary} onBlur={e => e.target.style.borderColor=T.border}/>
          </div>
        </div>
        <div style={{ padding:'14px 22px', borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'flex-end', gap:'10px' }}>
          <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:'8px', border:`1px solid ${T.border}`, background:'#F8FAFC', fontSize:'13px', fontWeight:700, cursor:'pointer', color:T.textSecondary, fontFamily:'Inter,sans-serif' }}>Cancel</button>
          <button onClick={() => { if (!remarks.trim()) return; onSave(status, remarks) }}
            disabled={!remarks.trim()}
            style={{ padding:'9px 22px', borderRadius:'8px', border:'none', background:!remarks.trim()?'#CBD5E1':T.primary, color:'#fff', fontSize:'13px', fontWeight:700, cursor:!remarks.trim()?'not-allowed':'pointer', fontFamily:'Inter,sans-serif', boxShadow:remarks.trim()?'0 4px 12px rgba(29,78,216,0.3)':'none' }}>
            Update Status
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════
   CLAIM VIEW (RegistrationDuplicate)
═══════════════════════════════════ */
export default function ClaimView() {
  const { claimId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()

  const [claim, setClaim] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Overview')
  const [showQC, setShowQC] = useState(false)
  const [saving, setSaving] = useState(false)

  // Assessor/Verifier editable fields
  const [accessorDecision, setAccessorDecision] = useState('')
  const [accessorReason, setAccessorReason] = useState('')
  const [accessorAmount, setAccessorAmount] = useState('')
  const [verificationStatus, setVerificationStatus] = useState('')
  const [verificationRemarks, setVerificationRemarks] = useState('')

  useEffect(() => {
    // Try real API first, fall back to mock
    const loadFn = () => getClaimByNumber(claimId).catch(() => fetchClaimDetails(claimId))
    loadFn().then(data => {
      // Normalise UPPERCASE backend columns to camelCase for ClaimView
      if (data.CLAIM_NUMBER) {
        data = {
          claimId:          data.CLAIM_NUMBER,
          policyId:         data.POLICY_ID,
          status:           data.CLAIM_STATUS    || 'Pending',
          priority:         data.priority        || 'Normal',
          daysOpen:         data.daysOpen        || 0,
          claimType:        data.CLAIM_TYPE,
          laName:           data.la_name         || data.CREATED_BY,
          laDob:            data.la_dob,
          laGender:         data.la_gender,
          laCity:           data.la_city,
          laState:          data.la_state,
          intimationDate:   data.INITIATION_DATE ? data.INITIATION_DATE.toString().split('T')[0] : '',
          dateOfDeathEvent: data.DATE_OF_DEATH   ? data.DATE_OF_DEATH.toString().split('T')[0]   : '',
          source:           data.source,
          bondType:         data.bond_type,
          deathCertificate: data.death_certificate,
          causeDescription: data.cause_description,
          placeOfDeath:     data.place_of_death,
          productName:      data.productName,
          sumAssured:       data.sumAssured,
          advisorCode:      data.advisorCode,
          uwDecision:       data.uwDecision,
          sysRecommendation:data.sys_recommendation,
          sysPayableAmount: data.sys_payable_amount,
          sysRiskScore:     data.sys_risk_score,
          sysProcessedOn:   data.sys_processed_on,
          accessorDecision: data.accessor_decision || '',
          accessorReason:   data.accessor_reason   || '',
          accessorAmount:   data.accessor_amount   || '',
          claimants:        data.claimants         || [],
          hospitalDetails:  (data.lifeAssured?.hospital_details) || [],
          doctorDetails:    (data.lifeAssured?.doctor_details)   || [],
          reqStatus:        {},
          assessmentAnswers:{},
          auditTrail:       data.statusHistory?.map(h => ({ action: `Status: ${h.STATUS}`, by: h.MODIFIED_BY, role: 'System', date: h.MODIFIED_ON, remarks: h.REMARKS })) || [],
        }
      }
    return data
    }).then(data => {
      setClaim(data)
      setAccessorDecision(data.accessorDecision || '')
      setAccessorReason(data.accessorReason || '')
      setAccessorAmount(data.accessorAmount || '')
      setLoading(false)
    })
  }, [claimId])

  const handleQCSave = async (status, remarks) => {
    setSaving(true)
    await changeClaimStatus(claimId, status, remarks).catch(() => updateClaimStatus(claimId, status, remarks))
    setClaim(p => ({ ...p, status, auditTrail: [...(p.auditTrail||[]), { action:`Status changed to ${status}`, by:user?.name, role:user?.role, date:new Date().toLocaleString(), remarks }] }))
    toast('success', 'Status Updated', `Claim ${claimId} → ${status}`)
    setShowQC(false); setSaving(false)
  }

  const handleSaveAssessment = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setClaim(p => ({ ...p, accessorDecision, accessorReason, accessorAmount, verificationStatus, verificationRemarks }))
    toast('success', 'Saved', 'Assessment details saved.')
    setSaving(false)
  }

  if (loading) return (
    <AppLayout>
      <div style={{ padding:'60px', textAlign:'center' }}>
        <div style={{ fontSize:'32px', marginBottom:'12px' }}>⏳</div>
        <div style={{ fontSize:'14px', color:T.textMuted, fontWeight:600 }}>Loading claim {claimId}...</div>
      </div>
    </AppLayout>
  )

  const sc = STATUS_COLORS[claim.status] || STATUS_COLORS.Pending
  const canEdit = ['Assessor','Verifier'].includes(user?.role)
  const isVerifier = user?.role === 'Verifier'

  const inp = (val, onChange, readOnly=false, placeholder='') => (
    <input value={val} onChange={onChange} readOnly={readOnly||!canEdit} placeholder={placeholder}
      style={{ width:'100%', height:'38px', padding:'0 10px', border:`1.5px solid ${T.border}`, borderRadius:'7px', background: readOnly||!canEdit?'#F8FAFC':'#fff', fontSize:'13px', fontWeight:500, color: readOnly||!canEdit?T.textMuted:T.textPrimary, fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }}
      onFocus={e=>{ if(canEdit&&!readOnly) e.target.style.borderColor=T.primary }} onBlur={e=>e.target.style.borderColor=T.border}/>
  )
  const sel = (val, onChange, options) => (
    <select value={val} onChange={onChange} disabled={!canEdit}
      style={{ width:'100%', height:'38px', padding:'0 10px', border:`1.5px solid ${T.border}`, borderRadius:'7px', background:canEdit?'#fff':'#F8FAFC', fontSize:'13px', fontWeight:500, color:T.textPrimary, fontFamily:'Inter,sans-serif', outline:'none', cursor:canEdit?'pointer':'default' }}>
      <option value=''>-- Select --</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
  const ta = (val, onChange, placeholder='', rows=3) => (
    <textarea value={val} onChange={onChange} rows={rows} placeholder={canEdit?placeholder:'—'} readOnly={!canEdit}
      style={{ width:'100%', padding:'8px 10px', border:`1.5px solid ${T.border}`, borderRadius:'7px', background:canEdit?'#fff':'#F8FAFC', fontSize:'13px', fontFamily:'Inter,sans-serif', outline:'none', resize:'vertical', color:T.textSecondary, boxSizing:'border-box' }}
      onFocus={e=>{ if(canEdit) e.target.style.borderColor=T.primary }} onBlur={e=>e.target.style.borderColor=T.border}/>
  )

  return (
    <AppLayout>
      <div style={{ padding:'24px', fontFamily:'Inter,sans-serif' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px' }}>
          <div style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
            <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'8px', border:`1px solid ${T.border}`, background:'#F8FAFC', fontSize:'13px', fontWeight:600, cursor:'pointer', color:T.textSecondary, fontFamily:'Inter,sans-serif', transition:'all 0.15s', marginTop:'2px' }}
              onMouseEnter={e => e.currentTarget.style.background='#EFF6FF'} onMouseLeave={e => e.currentTarget.style.background='#F8FAFC'}>
              ← Back
            </button>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <h1 style={{ fontSize:'22px', fontWeight:800, color:T.textPrimary, letterSpacing:'-0.02em', margin:0 }}>{claim.claimId}</h1>
                <span style={{ fontSize:'12px', fontWeight:700, padding:'4px 12px', borderRadius:'99px', background:sc.bg, border:`1px solid ${sc.border}`, color:sc.color }}>{claim.status}</span>
                {claim.priority === 'High' && <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'99px', background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626' }}>⚠️ High Priority</span>}
              </div>
              <p style={{ fontSize:'13px', color:T.textMuted, marginTop:'4px', fontWeight:500 }}>
                {claim.policyId} · {claim.claimType} · {claim.laName} · Open {claim.daysOpen}d
              </p>
            </div>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            {canEdit && (
              <button onClick={() => setShowQC(true)}
                style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 18px', borderRadius:'8px', border:'none', background:'#7C3AED', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 4px 12px rgba(124,58,237,0.3)', transition:'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background='#6D28D9'} onMouseLeave={e => e.currentTarget.style.background='#7C3AED'}>
                ⚡ Quick Control
              </button>
            )}
            {canEdit && (
              <button onClick={handleSaveAssessment} disabled={saving}
                style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 18px', borderRadius:'8px', border:'none', background:T.primary, color:'#fff', fontSize:'13px', fontWeight:700, cursor:saving?'wait':'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 4px 12px rgba(29,78,216,0.3)', transition:'all 0.15s' }}>
                {saving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <div style={{ display:'flex', borderBottom:`1px solid ${T.border}`, overflowX:'auto' }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding:'13px 18px', border:'none', borderBottom: activeTab===tab?`3px solid ${T.primary}`:'3px solid transparent', background: activeTab===tab?'#EFF6FF':'transparent', cursor:'pointer', fontSize:'13px', fontWeight: activeTab===tab?700:500, color: activeTab===tab?T.primary:T.textMuted, fontFamily:'Inter,sans-serif', transition:'all 0.15s', whiteSpace:'nowrap', marginBottom:'-1px' }}>
                {tab}
              </button>
            ))}
          </div>

          <div style={{ padding:'24px' }}>

            {/* ── OVERVIEW ── */}
            {activeTab === 'Overview' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px' }}>
                {[
                  ['Claim ID', claim.claimId], ['Policy ID', claim.policyId], ['Status', claim.status],
                  ['Claim Type', claim.claimType], ['Product', claim.productName], ['Sum Assured', fmtRs(claim.sumAssured)],
                  ['Life Assured', claim.laName], ['DOB', claim.laDob], ['Gender', claim.laGender],
                  ['Intimation Date', claim.intimationDate], ['Date of Death', claim.dateOfDeathEvent], ['Source', claim.source],
                  ['Cause of Death', claim.causeDescription], ['Place of Death', claim.placeOfDeath], ['Days Open', `${claim.daysOpen} days`],
                  ['Advisor Code', claim.advisorCode], ['UW Decision', claim.uwDecision], ['Priority', claim.priority],
                ].map(([k,v]) => <ROField key={k} label={k} value={v}/>)}
              </div>
            )}

            {/* ── DEMOGRAPHICS ── */}
            {activeTab === 'Demographics' && (
              <div>
                <Section title="Intimation Details">
                  <ROGrid>
                    <ROField label="Intimation Date" value={claim.intimationDate}/><ROField label="Source" value={claim.source}/>
                    <ROField label="Bond Type" value={claim.bondType}/><ROField label="FIR/PM Received" value={claim.firPmReceived}/>
                    <ROField label="Declared by Doctor" value={claim.declaredByDoctor}/><ROField label="Date of Death Event" value={claim.dateOfDeathEvent}/>
                    <ROField label="Date of Death Reg." value={claim.dateOfDeathReg}/><ROField label="Place of Death" value={claim.placeOfDeath}/>
                    <ROField label="Death Certificate" value={claim.deathCertificate}/>
                  </ROGrid>
                </Section>
                <Section title="Cause of Death">
                  <ROGrid>
                    <ROField label="Cause Code" value={claim.causeCode}/><ROField label="Description" value={claim.causeDescription}/>
                    <ROField label="Category" value={claim.causeCategory}/><ROField label="Claim Sub Type" value={claim.causeSubType}/>
                  </ROGrid>
                </Section>
                <Section title="Life Assured">
                  <ROGrid>
                    <ROField label="Name" value={claim.laName}/><ROField label="DOB" value={claim.laDob}/>
                    <ROField label="Gender" value={claim.laGender}/><ROField label="City" value={claim.laCity}/>
                    <ROField label="State" value={claim.laState}/>
                  </ROGrid>
                </Section>
                <Section title="Claimant(s)">
                  {(claim.claimants||[]).length === 0 ? <div style={{ color:T.textSubtle, fontSize:'13px' }}>No claimants recorded.</div> : (
                    <div style={{ border:`1px solid ${T.border}`, borderRadius:'8px', overflow:'hidden' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead><tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
                          {['Name','Role','Relation','Mobile','PAN'].map(h=><th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {(claim.claimants||[]).map((c,i)=>(
                            <tr key={i} style={{ borderBottom:`1px solid ${T.borderSubtle}` }}>
                              <td style={{ padding:'9px 12px', fontSize:'13px', fontWeight:600, color:T.textSecondary }}>{c.name}</td>
                              <td style={{ padding:'9px 12px', fontSize:'12px', color:T.textMuted }}>{c.role}</td>
                              <td style={{ padding:'9px 12px', fontSize:'12px', color:T.textMuted }}>{c.relation}</td>
                              <td style={{ padding:'9px 12px', fontSize:'12px', color:T.textMuted }}>{c.mobileNo}</td>
                              <td style={{ padding:'9px 12px', fontSize:'12px', color:T.textMuted }}>{c.panNo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Section>
                <Section title="Hospital Details">
                  {(claim.hospitalDetails||[]).length===0 ? <div style={{ color:T.textSubtle, fontSize:'13px' }}>No hospital records.</div> : (
                    <div style={{ border:`1px solid ${T.border}`, borderRadius:'8px', overflow:'hidden' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead><tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
                          {['Hospital','Admission','Discharge','Diagnosis','Nature'].map(h=><th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {(claim.hospitalDetails||[]).map((h,i)=>(
                            <tr key={i} style={{ borderBottom:`1px solid ${T.borderSubtle}` }}>
                              <td style={{ padding:'9px 12px', fontSize:'13px', fontWeight:600, color:T.textSecondary }}>{h.hospitalName}</td>
                              <td style={{ padding:'9px 12px', fontSize:'12px', color:T.textMuted }}>{h.admissionDate}</td>
                              <td style={{ padding:'9px 12px', fontSize:'12px', color:T.textMuted }}>{h.dischargeDate}</td>
                              <td style={{ padding:'9px 12px', fontSize:'12px', color:T.textMuted }}>{h.diagnosis}</td>
                              <td style={{ padding:'9px 12px', fontSize:'12px', color:T.textMuted }}>{h.natureOfIllness}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Section>
              </div>
            )}

            {/* ── REQUIREMENTS ── */}
            {activeTab === 'Requirements' && (
              <div>
                {!claim.reqStatus ? <div style={{ color:T.textSubtle }}>No requirements data.</div> : (
                  <div style={{ border:`1px solid ${T.border}`, borderRadius:'10px', overflow:'hidden' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead><tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
                        {['#','Document','Required','Status'].map(h=><th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {Object.entries(claim.reqStatus).map(([id, status], i) => {
                          const names = ['Original Death Certificate','Policy Document (Original)','Claimant Photo ID Proof','Cancelled Cheque / Bank Details','Nominee ID Proof','Medical / Treatment Records','NEFT / Bank Account Proof']
                          const sc2 = { Received:{ bg:'#ECFDF5',color:'#059669',border:'#A7F3D0' }, Pending:{ bg:'#FFFBEB',color:'#D97706',border:'#FDE68A' }, Waived:{ bg:'#EFF6FF',color:T.primary,border:'#BFDBFE' } }[status] || { bg:'#F8FAFC',color:T.textSubtle,border:T.border }
                          return (
                            <tr key={id} style={{ borderBottom:`1px solid ${T.borderSubtle}`, background:i%2===0?'#FAFAFA':'#fff' }}>
                              <td style={{ padding:'9px 14px', fontSize:'12px', color:T.textSubtle, fontWeight:700 }}>{i+1}</td>
                              <td style={{ padding:'9px 14px', fontSize:'13px', fontWeight:600, color:T.textSecondary }}>{names[i]||`Document ${id}`}</td>
                              <td style={{ padding:'9px 14px' }}><span style={{ fontSize:'11px', fontWeight:700, padding:'2px 8px', borderRadius:'99px', background:i<4?'#FEF2F2':'#F8FAFC', color:i<4?'#DC2626':T.textSubtle }}>{i<4?'Mandatory':'Optional'}</span></td>
                              <td style={{ padding:'9px 14px' }}><span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'99px', background:sc2.bg, border:`1px solid ${sc2.border}`, color:sc2.color }}>{status}</span></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── ASSESSMENT ── */}
            {activeTab === 'Assessment' && (
              <div>
                <Section title="Assessment Questions">
                  {Object.entries(claim.assessmentAnswers||{}).map(([id, ans]) => {
                    const qs = ['Was the claim reported within 30 days?','Does cause of death match policy terms?','Is nominee correctly mentioned?','Are all mandatory documents submitted?','Any previous claims on this policy?','Medical history of serious illness prior to policy?','Was Life Assured employed at time of death?','Any other active life policies for Life Assured?']
                    const ac = { Yes:{ bg:'#ECFDF5',color:'#059669',border:'#A7F3D0' }, No:{ bg:'#FEF2F2',color:'#DC2626',border:'#FECACA' }, NA:{ bg:'#EFF6FF',color:T.primary,border:'#BFDBFE' } }[ans] || {}
                    return (
                      <div key={id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 14px', background: parseInt(id)%2===0?'#FAFAFA':'#fff', borderRadius:'8px', border:`1px solid ${T.border}`, marginBottom:'6px' }}>
                        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                          <span style={{ width:'20px', height:'20px', borderRadius:'50%', background:'#E2E8F0', fontSize:'10px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:T.textMuted }}>{id}</span>
                          <span style={{ fontSize:'13px', color:T.textSecondary, fontWeight:500 }}>{qs[parseInt(id)-1]||`Question ${id}`}</span>
                        </div>
                        <span style={{ fontSize:'12px', fontWeight:800, padding:'3px 12px', borderRadius:'99px', background:ac.bg, border:`1px solid ${ac.border}`, color:ac.color, flexShrink:0, marginLeft:'12px' }}>{ans}</span>
                      </div>
                    )
                  })}
                </Section>
                <Section title="Assessor Decision">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:700, color:T.textSecondary, marginBottom:'5px' }}>Decision {canEdit&&<span style={{ color:'#EF4444' }}>*</span>}</label>
                      {sel(accessorDecision, e => setAccessorDecision(e.target.value), ['Approve','Reject','Refer to Verifier','Request More Documents','Repudiate'])}
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:700, color:T.textSecondary, marginBottom:'5px' }}>Amount</label>
                      {inp(accessorAmount, e => setAccessorAmount(e.target.value), false, 'e.g. 1250000')}
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:700, color:T.textSecondary, marginBottom:'5px' }}>Reason / Remarks</label>
                      {ta(accessorReason, e => setAccessorReason(e.target.value), 'Enter reason for decision...', 4)}
                    </div>
                  </div>
                </Section>
                {isVerifier && (
                  <Section title="Verification Details">
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                      <div>
                        <label style={{ display:'block', fontSize:'12px', fontWeight:700, color:T.textSecondary, marginBottom:'5px' }}>Verification Status</label>
                        {sel(verificationStatus, e => setVerificationStatus(e.target.value), ['Pending','Verified','Rejected'])}
                      </div>
                      <div style={{ gridColumn:'1/-1' }}>
                        <label style={{ display:'block', fontSize:'12px', fontWeight:700, color:T.textSecondary, marginBottom:'5px' }}>Verification Remarks</label>
                        {ta(verificationRemarks, e => setVerificationRemarks(e.target.value), 'Enter verification remarks...', 3)}
                      </div>
                    </div>
                  </Section>
                )}
              </div>
            )}

            {/* ── DECISION ── */}
            {activeTab === 'Decision' && (
              <div>
                {claim.sysRecommendation && (
                  <Section title="System Decision">
                    <div style={{ padding:'16px', borderRadius:'10px', background: claim.sysRecommendation==='Approve'?'#ECFDF5':'#FEF2F2', border:`1px solid ${claim.sysRecommendation==='Approve'?'#A7F3D0':'#FECACA'}`, marginBottom:'16px' }}>
                      <div style={{ fontSize:'16px', fontWeight:900, color: claim.sysRecommendation==='Approve'?'#065F46':'#991B1B', marginBottom:'6px' }}>
                        {claim.sysRecommendation==='Approve'?'✅':'❌'} System Recommendation: {claim.sysRecommendation?.toUpperCase()}
                      </div>
                      <div style={{ fontSize:'13px', color: claim.sysRecommendation==='Approve'?'#047857':'#B91C1C' }}>Processed: {claim.sysProcessedOn} · Risk: {claim.sysRiskScore}</div>
                    </div>
                    <ROGrid>
                      <ROField label="Recommended Payout" value={fmtRs(claim.sysPayableAmount)}/>
                      <ROField label="Risk Score" value={claim.sysRiskScore}/>
                      <ROField label="Processed On" value={claim.sysProcessedOn}/>
                    </ROGrid>
                  </Section>
                )}
                <Section title="Accessor Decision">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:700, color:T.textSecondary, marginBottom:'5px' }}>Decision</label>
                      {sel(accessorDecision, e => setAccessorDecision(e.target.value), ['Approve','Reject','Refer to Verifier','Request More Documents','Repudiate'])}
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:700, color:T.textSecondary, marginBottom:'5px' }}>Recommended Amount</label>
                      {inp(accessorAmount, e => setAccessorAmount(e.target.value), false, 'Enter amount')}
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:700, color:T.textSecondary, marginBottom:'5px' }}>Reason</label>
                      {ta(accessorReason, e => setAccessorReason(e.target.value), 'Enter detailed reason...', 4)}
                    </div>
                  </div>
                </Section>
              </div>
            )}

            {/* ── DOCUMENTS ── */}
            {activeTab === 'Documents' && (
              <DocumentUpload claimId={claimId} label={`Documents for ${claimId}`}/>
            )}

            {/* ── AUDIT TRAIL ── */}
            {activeTab === 'Audit Trail' && (
              <div>
                <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary, marginBottom:'14px' }}>Activity Timeline</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
                  {(claim.auditTrail||[]).map((entry, i) => (
                    <div key={i} style={{ display:'flex', gap:'14px', position:'relative', paddingBottom:'20px' }}>
                      {i < (claim.auditTrail.length-1) && <div style={{ position:'absolute', left:'14px', top:'28px', width:'2px', background:'#E2E8F0', bottom:'0' }}/>}
                      <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:T.primary, color:'#fff', fontSize:'11px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, zIndex:1 }}>{i+1}</div>
                      <div style={{ flex:1, paddingTop:'3px' }}>
                        <div style={{ fontSize:'13px', fontWeight:700, color:T.textPrimary }}>{entry.action}</div>
                        <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'2px' }}>
                          <span style={{ fontWeight:600, color:T.textSecondary }}>{entry.by}</span> ({entry.role}) · {entry.date}
                        </div>
                        {entry.remarks && <div style={{ fontSize:'12px', color:T.textSubtle, marginTop:'3px', fontStyle:'italic' }}>"{entry.remarks}"</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showQC && <QuickControlModal claim={claim} onClose={() => setShowQC(false)} onSave={handleQCSave}/>}
    </AppLayout>
  )
}
