import React, { useState, useEffect } from 'react'
import { DECISION_SUB_TAB, getDecisionSubTabs } from '../../util/decisionSubTabs'
import { Field, Input, Select, Textarea, SubTabNav, Grid, Btn, InfoCard, T } from './shared'
import { getSystemDecision } from '../../services/masterService'
import { registerClaim as registerClaimAPI } from '../../services/claimsService'
import { useToast } from '../../components/Toast'
import {
  validatePreAssessorSubmit,
  validateAssessorSubmit,
  showValidationToast,
} from '../../util/registrationValidation'
import { buildRegistrationPayload } from '../../util/buildRegistrationPayload'
import { useNavigate } from 'react-router-dom'

const fmtRs = n => n ? `₹${Number(n)>=1e7?(Number(n)/1e7).toFixed(1)+'Cr':Number(n)>=1e5?(Number(n)/1e5).toFixed(1)+'L':Number(n).toLocaleString('en-IN')}` : '—'

/* ── Success Modal ── */
function SuccessModal({ claimNo, acuity, onViewClaim, onAnother }) {
  const flagged = acuity?.finalAcuityDecision === 'FLAGGED'
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#fff', borderRadius:'20px', width:'460px', padding:'40px', textAlign:'center', boxShadow:'0 32px 80px rgba(0,0,0,0.25)' }}>
        <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'linear-gradient(135deg,#059669,#047857)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 8px 24px rgba(5,150,105,0.4)' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 14L11 20L23 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ fontSize:'22px', fontWeight:900, color:T.textPrimary, letterSpacing:'-0.02em', marginBottom:'8px' }}>Claim Registered!</div>
        <div style={{ fontSize:'14px', color:T.textMuted, marginBottom:'20px' }}>Your claim has been successfully registered and sent for assessment.</div>
        <div style={{ padding:'16px 20px', background:'#ECFDF5', borderRadius:'12px', border:'1px solid #A7F3D0', marginBottom: acuity ? '12px' : '24px' }}>
          <div style={{ fontSize:'11px', fontWeight:700, color:'#047857', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>Claim Number</div>
          <div style={{ fontSize:'24px', fontWeight:900, color:'#065F46', fontFamily:'monospace' }}>{claimNo}</div>
        </div>
        {acuity && (
          <div style={{ padding:'14px 16px', background: flagged ? '#FFFBEB' : '#F8FAFC', borderRadius:'12px', border:`1px solid ${flagged ? '#FDE68A' : T.border}`, marginBottom:'24px', textAlign:'left' }}>
            <div style={{ fontSize:'17px', fontWeight:800, color: flagged ? '#B45309' : T.textPrimary, marginBottom:'10px' }}>Accuity decision</div>
            <div style={{ fontSize:'14px', fontWeight:600, color:T.textSecondary, lineHeight:1.7 }}>
              Claimant: {acuity.claimantAcuityDecision || 'NOT FLAGGED'}<br />
              Payee: {acuity.payeeAcuityDecision || 'NOT FLAGGED'}<br />
              <span style={{ fontWeight:800, color: flagged ? '#92400E' : '#065F46' }}>Final: {acuity.finalAcuityDecision || 'NOT FLAGGED'}</span>
            </div>
          </div>
        )}
        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={onAnother} style={{ flex:1, padding:'11px', borderRadius:'10px', border:`1px solid ${T.border}`, background:'#F8FAFC', fontSize:'13px', fontWeight:700, cursor:'pointer', color:T.textSecondary, fontFamily:'Inter,sans-serif' }}>Register Another</button>
          <button onClick={onViewClaim} style={{ flex:1, padding:'11px', borderRadius:'10px', border:'none', background:T.primary, color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 4px 12px rgba(29,78,216,0.3)' }}>View Claim</button>
        </div>
      </div>
    </div>
  )
}

export default function DecisionTab({ data, update, policy, isPreAssessor = false, userRoles = [], userRole = '' }) {
  const toast = useToast()
  const navigate = useNavigate()
  const decisionTabs = getDecisionSubTabs(userRoles, { userRole, forcePreAssessor: isPreAssessor })
  const [subTab, setSubTab] = useState(decisionTabs[0])
  useEffect(() => {
    if (!decisionTabs.includes(subTab)) setSubTab(decisionTabs[0])
  }, [decisionTabs, subTab])
  const [loadingSys, setLoadingSys] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [claimNo, setClaimNo] = useState(null)
  const [acuityResult, setAcuityResult] = useState(null)

  const handleGenSystemDecision = async () => {
    setLoadingSys(true)
    try {
      const res = await getSystemDecision(data, policy)
      update({
        sysRecommendation: res.recommendation,
        sysPayableAmount: res.payableAmount,
        sysReason: res.reason,
        sysRiskScore: res.riskScore,
        sysProcessedOn: res.processedOn,
        systemDetails: res,
      })
      const title = res.estimated ? 'System Decision (estimated)' : 'System Decision Ready'
      toast('success', title, `${res.recommendation} — payable ${fmtRs(res.payableAmount)}`)
    } catch (e) {
      toast('error', 'Failed', e.message)
    } finally {
      setLoadingSys(false)
    }
  }

  const submitCheck = isPreAssessor
    ? validatePreAssessorSubmit(data, { policy, fromRegisterGate: Boolean(policy?.registerForm) })
    : validateAssessorSubmit(data, { policy })

  const handleSubmit = async () => {
    if (!submitCheck.valid) {
      showValidationToast(toast, submitCheck.missing, 'Cannot register claim')
      return
    }
    setSubmitting(true)
    const payload = buildRegistrationPayload({
      ...data,
      createdBy: data.createdBy || sessionStorage.getItem('loggedUser') || '',
      verifierDetails: {
        ...(data.verifierDetails || {}),
        sendMail: data.sendMail !== 'No' && data.verifierDetails?.sendMail !== false,
      },
      systemDetails: undefined,
    }, policy)
    try {
      const res = await registerClaimAPI(payload)
      const num = res?.claimNo || res?.claimNumber || res?.data?.claimNumber
      if (!num) throw new Error(res?.message || res?.error || 'Registration failed')
      setAcuityResult(res?.acuity || null)
      setClaimNo(num)
    } catch (e) {
      toast('error', 'Submission Failed', e?.message || 'Server is unavailable. Try again later.')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = submitCheck.valid

  const summaryItems = [
    { title:'Policy & Claim Setup', items:[ ['Policy ID',data.policyId], ['Claim Type',data.claimType], ['Product',data.productName||policy?.productName], ['Sum Assured',fmtRs(data.sumAssured||policy?.sumAssured)] ] },
    { title:'Intimation', items:[ ['Intimation Date',data.intimationDate], ['Source',data.source], ['Date of Death',data.dateOfDeathEvent], ['Cause of Death',data.causeDescription] ] },
    { title:'Claimant', items:[ ['Name',data.claimantName||(data.claimants?.[0]?.name)], ['Relation',data.claimants?.[0]?.relation], ['Mobile',data.claimants?.[0]?.mobileNo] ] },
    { title:'Requirements', items:[ ['Documents Received', `${Object.values(data.reqStatus||{}).filter(v=>v==='Received').length}/10`], ['Pending', Object.values(data.reqStatus||{}).filter(v=>v==='Pending').length.toString()] ] },
    { title:'Assessment', items:[ ['Questions Answered', `${Object.keys(data.assessmentAnswers||{}).filter(k=>data.assessmentAnswers[k]).length}/14`], ['Case Trigger',data.caseTrigger||'—'], ['Priority Flag',data.priorityFlag||'—'] ] },
    { title:'Decision', items: isPreAssessor
      ? [['System Recommendation',data.sysRecommendation||'Not generated'], ['Payable Amount',fmtRs(data.sysPayableAmount)], ['Trap Score',data.trapScore||'—']]
      : [['System Recommendation',data.sysRecommendation||'Not generated'], ['Accessor Decision',data.accessorDecision||'Pending'], ['Payable Amount',fmtRs(data.accessorAmount||data.sysPayableAmount)]] },
  ]

  return (
    <div style={{ padding:'24px' }}>
      <SubTabNav tabs={decisionTabs} active={subTab} onChange={setSubTab}/>

      {/* ── SYSTEM DECISION ── */}
      {subTab === DECISION_SUB_TAB.SYSTEM && (
        <div>
          {!data.sysRecommendation ? (
            <div>
              <InfoCard type='info' >System decision is auto-generated based on all section data. Click the button below to generate it.</InfoCard>
              <div style={{ marginTop:'16px' }}>
                <Btn onClick={handleGenSystemDecision} disabled={loadingSys}>
                  {loadingSys ? '⏳ Generating...' : '⚙️ Generate System Decision'}
                </Btn>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ padding:'20px', borderRadius:'12px', background: data.sysRecommendation==='Approve'?'#ECFDF5':'#FEF2F2', border:`1px solid ${data.sysRecommendation==='Approve'?'#A7F3D0':'#FECACA'}`, marginBottom:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'10px', background: data.sysRecommendation==='Approve'?'#059669':'#DC2626', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'18px' }}>
                    {data.sysRecommendation==='Approve'?'✓':'✗'}
                  </div>
                  <div>
                    <div style={{ fontSize:'16px', fontWeight:900, color: data.sysRecommendation==='Approve'?'#065F46':'#991B1B' }}>System Recommendation: {data.sysRecommendation?.toUpperCase()}</div>
                    <div style={{ fontSize:'12px', color: data.sysRecommendation==='Approve'?'#047857':'#B91C1C', marginTop:'2px' }}>Processed on: {data.sysProcessedOn}</div>
                  </div>
                </div>
                <div style={{ fontSize:'13px', color: data.sysRecommendation==='Approve'?'#065F46':'#991B1B', lineHeight:1.7 }}>{data.sysReason}</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px' }}>
                {[['Recommended Payout',fmtRs(data.sysPayableAmount)],['Risk Score',data.sysRiskScore],['Generated On',data.sysProcessedOn]].map(([k,v])=>(
                  <div key={k} style={{ padding:'14px', background:'#F8FAFC', borderRadius:'10px', border:`1px solid ${T.border}` }}>
                    <div style={{ fontSize:'10px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'4px' }}>{k}</div>
                    <div style={{ fontSize:'18px', fontWeight:900, color:T.textPrimary }}>{v}</div>
                  </div>
                ))}
              </div>
              {policy?.riders?.length > 0 && (
                <div style={{ marginTop:'20px' }}>
                  <div style={{ fontSize:'12px', fontWeight:700, color:T.primary, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'10px' }}>Rider Payout Details</div>
                  <div style={{ border:`1px solid ${T.border}`, borderRadius:'8px', overflow:'hidden' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead><tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
                        {['Rider Code','Sum Assured','Status','Recommended Payout'].map(h=>(
                          <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {policy.riders.map((r,i)=>(
                          <tr key={i} style={{ borderBottom:`1px solid ${T.borderSubtle}` }}>
                            <td style={{ padding:'9px 14px', fontSize:'12px', fontWeight:700, color:T.primary }}>{r.riderCode}</td>
                            <td style={{ padding:'9px 14px', fontSize:'12px', color:T.textSecondary }}>{fmtRs(r.riderSA)}</td>
                            <td style={{ padding:'9px 14px' }}><span style={{ fontSize:'11px', fontWeight:700, padding:'2px 8px', borderRadius:'99px', background:'#ECFDF5', color:'#059669' }}>{r.riderStatus}</span></td>
                            <td style={{ padding:'9px 14px', fontSize:'12px', fontWeight:700, color:'#059669' }}>{fmtRs(r.riderSA)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ACCESSOR DECISION ── */}
      {subTab === DECISION_SUB_TAB.ACCESSOR && (
        <div>
          {!data.sysRecommendation && <div style={{ marginBottom:'16px' }}><InfoCard type='warning'>Please generate the System Decision first before entering the Accessor Decision.</InfoCard></div>}
          <Grid cols={2}>
            <Field label="Decision" required>
              <Select value={data.accessorDecision} onChange={e=>update({accessorDecision:e.target.value})} options={['Approve','Reject','Refer to Verifier','Request More Documents','Repudiate']}/>
            </Field>
            <Field label="Recommended Amount">
              <Input value={data.accessorAmount} onChange={e=>update({accessorAmount:e.target.value})} placeholder={`e.g. ${data.sysPayableAmount||'1250000'}`}/>
            </Field>
            <Field label="Reason / Remarks" full>
              <Textarea value={data.accessorReason} onChange={e=>update({accessorReason:e.target.value})} placeholder="Provide detailed reasoning for your decision..." rows={5}/>
            </Field>
            <Field label="Assessor Name">
              <Input value={data.accessorName} onChange={e=>update({accessorName:e.target.value})} placeholder="Your name"/>
            </Field>
            <Field label="Decision Date">
              <Input type="date" value={data.accessorDecisionDate} onChange={e=>update({accessorDecisionDate:e.target.value})}/>
            </Field>
          </Grid>
        </div>
      )}

      {/* ── VERIFICATION ── */}
      {subTab === DECISION_SUB_TAB.VERIFICATION && (
        <div>
          <InfoCard type='info'>Verification details are completed by the Verifier role after the Assessor submits their decision.</InfoCard>
          <div style={{ marginTop:'16px' }}>
            <Grid cols={2}>
              <Field label="Verification Status">
                <Select value={data.verificationStatus} onChange={e=>update({verificationStatus:e.target.value})} options={['Pending','In Progress','Verified','Rejected']}/>
              </Field>
              <Field label="Verifier Name">
                <Input value={data.verifierName} onChange={e=>update({verifierName:e.target.value})} placeholder="Verifier name"/>
              </Field>
              <Field label="Verification Date">
                <Input type="date" value={data.verificationDate} onChange={e=>update({verificationDate:e.target.value})}/>
              </Field>
              <Field label="Send Mail on Completion">
                <Select value={data.sendMail} onChange={e=>update({sendMail:e.target.value})} options={['Yes','No']}/>
              </Field>
              <Field label="Verification Remarks" full>
                <Textarea value={data.verificationRemarks} onChange={e=>update({verificationRemarks:e.target.value})} placeholder="Enter verification remarks..." rows={4}/>
              </Field>
            </Grid>
          </div>
        </div>
      )}

      {/* ── SUMMARY ── */}
      {subTab === DECISION_SUB_TAB.SUMMARY && (
        <div>
          <div style={{ display:'flex', flexDirection:'column', gap:'14px', marginBottom:'24px' }}>
            {summaryItems.map(section => (
              <div key={section.title} style={{ padding:'16px 20px', background:'#FAFAFA', borderRadius:'10px', border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:'11px', fontWeight:700, color:T.primary, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'12px' }}>{section.title}</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px' }}>
                  {section.items.map(([k,v])=>(
                    <div key={k} style={{ display:'flex', gap:'8px' }}>
                      <span style={{ fontSize:'12px', color:T.textMuted, fontWeight:500, whiteSpace:'nowrap' }}>{k}:</span>
                      <span style={{ fontSize:'12px', color:T.textSecondary, fontWeight:700 }}>{v||'—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          {isPreAssessor && (
            <div style={{ marginBottom:'16px' }}>
              <Grid cols={2}>
                <Field label="Send notification email">
                  <Select value={data.sendMail ?? 'Yes'} onChange={e=>update({ sendMail: e.target.value, verifierDetails: { ...(data.verifierDetails||{}), sendMail: e.target.value !== 'No' } })} options={['Yes','No']}/>
                </Field>
              </Grid>
            </div>
          )}
          <div style={{ padding:'20px', background: canSubmit?'#ECFDF5':'#FFFBEB', borderRadius:'12px', border:`1px solid ${canSubmit?'#A7F3D0':'#FDE68A'}` }}>
            {!canSubmit && (
              <div style={{ marginBottom:'16px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#92400E', marginBottom:'8px' }}>
                  ⚠️ Complete the following before registering:
                </div>
                <ul style={{ margin:0, paddingLeft:'18px', fontSize:'12px', fontWeight:600, color:'#B45309', lineHeight:1.7 }}>
                  {submitCheck.missing.slice(0, 6).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                  {submitCheck.missing.length > 6 && (
                    <li>…and {submitCheck.missing.length - 6} more item(s)</li>
                  )}
                </ul>
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:'14px', fontWeight:700, color: canSubmit ? '#065F46' : '#92400E' }}>
                  {canSubmit ? 'Ready to Submit' : 'Registration not ready'}
                </div>
                <div style={{ fontSize:'12px', color: canSubmit ? '#047857' : '#B45309', marginTop:'2px' }}>
                  {canSubmit
                    ? 'All wizard sections complete. This creates the claim in MySQL (single submit).'
                    : 'Fill all mandatory fields in Demographics, Requirements, and Assessment first.'}
                </div>
              </div>
              <Btn variant='success' size='lg' onClick={handleSubmit} disabled={!canSubmit || submitting}>
                {submitting ? '⏳ Registering...' : '📤 Register Claim'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {claimNo && (
        <SuccessModal
          claimNo={claimNo}
          acuity={acuityResult}
          onViewClaim={() => navigate(`/registration-fetch/${claimNo}`)}
          onAnother={() => { setClaimNo(null); setAcuityResult(null); navigate('/policy-search') }}
        />
      )}
    </div>
  )
}
