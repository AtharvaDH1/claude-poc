import React, { useState, useEffect } from 'react'
import { Field, Input, Select, Textarea, SubTabNav, Grid, Btn, InfoCard, T } from './shared'
import { getSystemDecision } from '../../services/masterService'
import { registerClaim as registerClaimAPI } from '../../services/claimsService'
import { useToast } from '../../components/Toast'
import { useNavigate } from 'react-router-dom'

const fmtRs = n => n ? `₹${Number(n)>=1e7?(Number(n)/1e7).toFixed(1)+'Cr':Number(n)>=1e5?(Number(n)/1e5).toFixed(1)+'L':Number(n).toLocaleString('en-IN')}` : '—'

/* ── Success Modal ── */
function SuccessModal({ claimNo, onClose, onAnother }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#fff', borderRadius:'20px', width:'460px', padding:'40px', textAlign:'center', boxShadow:'0 32px 80px rgba(0,0,0,0.25)' }}>
        <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'linear-gradient(135deg,#059669,#047857)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 8px 24px rgba(5,150,105,0.4)' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 14L11 20L23 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ fontSize:'22px', fontWeight:900, color:T.textPrimary, letterSpacing:'-0.02em', marginBottom:'8px' }}>Claim Registered!</div>
        <div style={{ fontSize:'14px', color:T.textMuted, marginBottom:'20px' }}>Your claim has been successfully registered and sent for assessment.</div>
        <div style={{ padding:'16px 20px', background:'#ECFDF5', borderRadius:'12px', border:'1px solid #A7F3D0', marginBottom:'24px' }}>
          <div style={{ fontSize:'11px', fontWeight:700, color:'#047857', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>Claim Number</div>
          <div style={{ fontSize:'24px', fontWeight:900, color:'#065F46', fontFamily:'monospace' }}>{claimNo}</div>
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={onAnother} style={{ flex:1, padding:'11px', borderRadius:'10px', border:`1px solid ${T.border}`, background:'#F8FAFC', fontSize:'13px', fontWeight:700, cursor:'pointer', color:T.textSecondary, fontFamily:'Inter,sans-serif' }}>Register Another</button>
          <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:'10px', border:'none', background:T.primary, color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 4px 12px rgba(29,78,216,0.3)' }}>View Dashboard</button>
        </div>
      </div>
    </div>
  )
}

export default function DecisionTab({ data, update, policy }) {
  const toast = useToast()
  const navigate = useNavigate()
  const [subTab, setSubTab] = useState('System Decision')
  const [loadingSys, setLoadingSys] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [claimNo, setClaimNo] = useState(null)

  const handleGenSystemDecision = async () => {
    setLoadingSys(true)
    try {
      const res = await getSystemDecision({ ...data, sumAssured: data.sumAssured||policy?.sumAssured })
      update({ sysRecommendation:res.recommendation, sysPayableAmount:res.payableAmount, sysReason:res.reason, sysRiskScore:res.riskScore, sysProcessedOn:res.processedOn })
      toast('success','System Decision Ready','Auto-generated recommendation complete.')
    } catch(e) { toast('error','Failed',e.message) }
    finally { setLoadingSys(false) }
  }

  const handleSubmit = async () => {
    if (!data.accessorDecision) { toast('warning','Missing','Please enter the Accessor Decision before submitting.'); return }
    setSubmitting(true)
    try {
      const res = await registerClaimAPI(data)
      setClaimNo(res.claimNo || res.claimNumber || res.message)
    } catch(e) { toast('error','Submission Failed',e.message) }
    finally { setSubmitting(false) }
  }

  const summaryItems = [
    { title:'Policy & Claim Setup', items:[ ['Policy ID',data.policyId], ['Claim Type',data.claimType], ['Product',data.productName||policy?.productName], ['Sum Assured',fmtRs(data.sumAssured||policy?.sumAssured)] ] },
    { title:'Intimation', items:[ ['Intimation Date',data.intimationDate], ['Source',data.source], ['Date of Death',data.dateOfDeathEvent], ['Cause of Death',data.causeDescription] ] },
    { title:'Claimant', items:[ ['Name',data.claimantName||(data.claimants?.[0]?.name)], ['Relation',data.claimants?.[0]?.relation], ['Mobile',data.claimants?.[0]?.mobileNo] ] },
    { title:'Requirements', items:[ ['Documents Received', Object.values(data.reqStatus||{}).filter(v=>v==='Received').length.toString()], ['Pending', Object.values(data.reqStatus||{}).filter(v=>v==='Pending').length.toString()] ] },
    { title:'Assessment', items:[ ['Questions Answered', Object.keys(data.assessmentAnswers||{}).length.toString()], ['Case Trigger',data.caseTrigger||'—'], ['Priority Flag',data.priorityFlag||'—'] ] },
    { title:'Decision', items:[ ['System Recommendation',data.sysRecommendation||'Not generated'], ['Accessor Decision',data.accessorDecision||'Pending'], ['Payable Amount',fmtRs(data.accessorAmount||data.sysPayableAmount)] ] },
  ]

  return (
    <div style={{ padding:'24px' }}>
      <SubTabNav tabs={['System Decision','Accessor Decision','Verification','Summary']} active={subTab} onChange={setSubTab}/>

      {/* ── SYSTEM DECISION ── */}
      {subTab === 'System Decision' && (
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
      {subTab === 'Accessor Decision' && (
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
      {subTab === 'Verification' && (
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
      {subTab === 'Summary' && (
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
          <div style={{ padding:'20px', background: data.accessorDecision?'#ECFDF5':'#FFFBEB', borderRadius:'12px', border:`1px solid ${data.accessorDecision?'#A7F3D0':'#FDE68A'}` }}>
            {!data.accessorDecision ? (
              <div style={{ fontSize:'13px', fontWeight:600, color:'#92400E' }}>⚠️ Please complete the Accessor Decision before submitting the claim.</div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:700, color:'#065F46' }}>Ready to Submit</div>
                  <div style={{ fontSize:'12px', color:'#047857', marginTop:'2px' }}>All sections complete. Click to register this claim.</div>
                </div>
                <Btn variant='success' size='lg' onClick={handleSubmit} disabled={submitting}>
                  {submitting ? '⏳ Registering...' : '📤 Register Claim'}
                </Btn>
              </div>
            )}
          </div>
        </div>
      )}

      {claimNo && (
        <SuccessModal claimNo={claimNo} onClose={()=>navigate('/dashboard')} onAnother={()=>{ setClaimNo(null); navigate('/registration') }}/>
      )}
    </div>
  )
}
