import React, { useState, useEffect } from 'react'
import { Field, Input, Select, Textarea, SubTabNav, Grid, Btn, InfoCard, T } from './shared'
import { ASSESSMENT_QUESTIONS } from '../../services/mockServices'
import { getAssessmentQuestions } from '../../services/masterService'

export default function AssessmentTab({ data, update, onComplete, userRole }) {
  const isAssessorPlus = userRole && userRole !== 'Pre Assessor'
  const [subTab, setSubTab] = useState('Questions')
  const [questions, setQuestions] = useState(ASSESSMENT_QUESTIONS)

  React.useEffect(() => {
    getAssessmentQuestions().then(setQuestions).catch(() => {})
  }, [])

  const setAnswer = (id, val) => update({ assessmentAnswers:{ ...(data.assessmentAnswers||{}), [id]: val } })
  const ans = data.assessmentAnswers || {}

  const answeredCount = Object.keys(ans).length
  const allAnswered = answeredCount >= questions.length

  const grouped = questions.reduce((acc, q) => {
    if (!acc[q.section]) acc[q.section] = []
    acc[q.section].push(q)
    return acc
  }, {})

  return (
    <div style={{ padding:'24px' }}>
      <SubTabNav
        tabs={isAssessorPlus
          ? ['Questions','IIB Enquiry','Telecalling','Remarks','Fraud Remarks','Assessor Remarks']
          : ['Questions','IIB Enquiry','Telecalling','Remarks']}
        active={subTab}
        onChange={setSubTab}
      />

      {/* ── QUESTIONS ── */}
      {subTab === 'Questions' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <div style={{ fontSize:'13px', fontWeight:600, color:T.textMuted }}>{answeredCount} of {questions.length} questions answered</div>
            {allAnswered && <span style={{ fontSize:'12px', fontWeight:700, color:'#059669', background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:'99px', padding:'3px 12px' }}>✓ All answered</span>}
          </div>
          {Object.entries(grouped).map(([section, qs]) => (
            <div key={section} style={{ marginBottom:'20px' }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:T.primary, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px', paddingBottom:'6px', borderBottom:`1px solid ${T.border}` }}>{section}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {qs.map(q => {
                  const a = ans[q.id]
                  return (
                    <div key={q.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background: a?'#FAFAFE':'#FAFAFA', borderRadius:'10px', border:`1px solid ${a?T.border+'80':T.border}`, transition:'all 0.15s' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', flex:1 }}>
                        <div style={{ width:'22px', height:'22px', borderRadius:'50%', background: a==='Yes'?'#ECFDF5': a==='No'?'#FEF2F2': a==='NA'?'#EFF6FF':'#E2E8F0', color: a==='Yes'?'#059669': a==='No'?'#DC2626': a==='NA'?T.primary:T.textSubtle, fontSize:'10px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {q.id}
                        </div>
                        <span style={{ fontSize:'13px', fontWeight:500, color:T.textSecondary, lineHeight:1.5 }}>{q.question}</span>
                      </div>
                      <div style={{ display:'flex', gap:'6px', flexShrink:0, marginLeft:'16px' }}>
                        {['Yes','No','NA'].map(opt => (
                          <button key={opt} onClick={() => setAnswer(q.id, opt)}
                            style={{ padding:'5px 14px', borderRadius:'6px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s', border:`1.5px solid ${a===opt?(opt==='Yes'?'#A7F3D0': opt==='No'?'#FECACA':'#BFDBFE'):'#E2E8F0'}`, background: a===opt?(opt==='Yes'?'#ECFDF5': opt==='No'?'#FEF2F2':'#EFF6FF'):'#fff', color: a===opt?(opt==='Yes'?'#059669': opt==='No'?'#DC2626':T.primary):T.textMuted }}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TELECALLING ── */}
      {/* IIB Enquiry — Insurance Information Bureau check */}
      {subTab === 'IIB Enquiry' && (
        <div>
          <div style={{ marginBottom:'16px' }}><InfoCard type='info'>IIB (Insurance Information Bureau) enquiry checks the life assured's existing insurance portfolio across all insurers.</InfoCard></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            {[
              { key:'iibRefNo',           label:'IIB Reference Number' },
              { key:'iibEnquiryDate',     label:'Enquiry Date',              type:'date' },
              { key:'iibStatus',          label:'Enquiry Status',             opts:['Pending','Completed','Failed','Not Initiated'] },
              { key:'iibPoliciesFound',   label:'No. of Policies Found' },
              { key:'iibTotalSA',         label:'Total Sum Assured (₹)' },
              { key:'iibFraudFlag',       label:'Fraud Flag',                opts:['Yes','No','NA'] },
              { key:'iibMultiplePolicy',  label:'Multiple Policy Detected',  opts:['Yes','No'] },
              { key:'iibNonDisclosure',   label:'Non-Disclosure Detected',   opts:['Yes','No','NA'] },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#334155', marginBottom:'5px' }}>{f.label}</label>
                {f.opts ? (
                  <select value={data[f.key]||''} onChange={e=>update({[f.key]:e.target.value})}
                    style={{ width:'100%', height:'38px', padding:'0 10px', border:'1.5px solid #E2E8F0', borderRadius:'7px', background:'#fff', fontSize:'13px', fontFamily:'Inter,sans-serif', outline:'none' }}>
                    <option value=''>-- Select --</option>
                    {f.opts.map(o=><option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={f.type||'text'} value={data[f.key]||''} onChange={e=>update({[f.key]:e.target.value})}
                    style={{ width:'100%', height:'38px', padding:'0 10px', border:'1.5px solid #E2E8F0', borderRadius:'7px', background:'#F8FAFC', fontSize:'13px', fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }}/>
                )}
              </div>
            ))}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#334155', marginBottom:'5px' }}>IIB Remarks</label>
              <textarea value={data.iibRemarks||''} onChange={e=>update({iibRemarks:e.target.value})} rows={3} placeholder="Enter IIB enquiry findings..."
                style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E2E8F0', borderRadius:'7px', background:'#F8FAFC', fontSize:'13px', fontFamily:'Inter,sans-serif', outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
            </div>
          </div>
        </div>
      )}

      {subTab === 'Telecalling' && (
        <div>
          <div style={{ marginBottom:'16px' }}><InfoCard type='info'>Telecalling details are recorded after initial field verification is complete.</InfoCard></div>
          <Grid cols={2}>
            <Field label="Telecalling Date"><Input type="date" value={data.telecallingDate} onChange={e=>update({telecallingDate:e.target.value})}/></Field>
            <Field label="Telecaller Name"><Input value={data.telecallerName} onChange={e=>update({telecallerName:e.target.value})}/></Field>
            <Field label="Called Number"><Input value={data.telecalledNumber} onChange={e=>update({telecalledNumber:e.target.value})} maxLength={10}/></Field>
            <Field label="Call Status"><Select value={data.telecallStatus} onChange={e=>update({telecallStatus:e.target.value})} options={['Connected','Not Connected','Switched Off','Invalid Number','Callback Requested']}/></Field>
            <Field label="Call Duration (mins)"><Input value={data.telecallDuration} onChange={e=>update({telecallDuration:e.target.value})}/></Field>
            <Field label="Verification Outcome"><Select value={data.telecallOutcome} onChange={e=>update({telecallOutcome:e.target.value})} options={['Verified','Not Verified','Partial Verification','Suspicious','Requires Follow-up']}/></Field>
            <Field label="Telecalling Remarks" full><Textarea value={data.telecallingRemarks} onChange={e=>update({telecallingRemarks:e.target.value})} placeholder="Enter detailed telecalling remarks..." rows={4}/></Field>
          </Grid>
        </div>
      )}

      {/* ── REMARKS ── */}
      {subTab === 'Remarks' && (
        <div>
          <Grid cols={2}>
            <Field label="Case Trigger">
              <Select value={data.caseTrigger} onChange={e=>update({caseTrigger:e.target.value})} options={['Yes','No','NA']}/>
            </Field>
            <Field label="Priority Flag">
              <Select value={data.priorityFlag} onChange={e=>update({priorityFlag:e.target.value})} options={['High','Normal','Low']}/>
            </Field>
            <Field label="Assessor Remarks" full>
              <Textarea value={data.assessorRemarks} onChange={e=>update({assessorRemarks:e.target.value})} placeholder="Enter detailed assessment remarks here..." rows={5}/>
            </Field>
            <Field label="Fraud Remarks" full>
              <Textarea value={data.fraudRemarks} onChange={e=>update({fraudRemarks:e.target.value})} placeholder="Enter fraud-related observations (if any)..." rows={5}/>
            </Field>
            <Field label="System Assessor Remarks" full>
              <Textarea value={data.systemAssessorRemarks} onChange={e=>update({systemAssessorRemarks:e.target.value})} placeholder="System-generated assessment remarks..." rows={3}/>
            </Field>
          </Grid>
        </div>
      )}

      {/* Fraud Remarks — Assessor/Verifier only */}
      {subTab === 'Fraud Remarks' && isAssessorPlus && (
        <div>
          <div style={{ marginBottom:'16px' }}><InfoCard type='warning'>Fraud remarks are confidential and visible only to Assessors and Verifiers.</InfoCard></div>
          <Grid cols={2}>
            <Field label="Fraud Suspicion Level">
              <Select value={data.fraudSuspicionLevel} onChange={e=>update({fraudSuspicionLevel:e.target.value})} options={['None','Low','Medium','High','Very High']}/>
            </Field>
            <Field label="Fraud Category">
              <Select value={data.fraudCategory} onChange={e=>update({fraudCategory:e.target.value})} options={['None','Misrepresentation','Non-Disclosure','Document Forgery','Identity Fraud','Agent Fraud','Others']}/>
            </Field>
            <Field label="Fraud Investigation Required">
              <Select value={data.fraudInvestigationRequired} onChange={e=>update({fraudInvestigationRequired:e.target.value})} options={['Yes','No','NA']}/>
            </Field>
            <Field label="Investigation Assigned To">
              <Input value={data.fraudInvestigationAssignedTo} onChange={e=>update({fraudInvestigationAssignedTo:e.target.value})} placeholder="Investigator name or team"/>
            </Field>
            <Field label="Fraud Remarks" full>
              <Textarea value={data.fraudRemarks} onChange={e=>update({fraudRemarks:e.target.value})} placeholder="Detailed fraud observations, suspicious patterns, evidence noted..." rows={6}/>
            </Field>
            <Field label="Action Recommended" full>
              <Select value={data.fraudActionRecommended} onChange={e=>update({fraudActionRecommended:e.target.value})} options={['No Action','Monitor','Investigate','Repudiate','Report to IRDAI','Refer to Legal']}/>
            </Field>
          </Grid>
        </div>
      )}

      {/* System Assessor Remarks — Assessor/Verifier only */}
      {subTab === 'Assessor Remarks' && isAssessorPlus && (
        <div>
          <div style={{ marginBottom:'16px' }}><InfoCard type='info'>System assessor remarks are auto-generated based on data patterns and manually supplemented by the assessor.</InfoCard></div>
          <Grid cols={2}>
            <Field label="System Observation">
              <Select value={data.sysObservation} onChange={e=>update({sysObservation:e.target.value})} options={['Clean','Minor Discrepancy','Major Discrepancy','Suspicious','Refer to Senior']}/>
            </Field>
            <Field label="Priority Flag">
              <Select value={data.priorityFlag} onChange={e=>update({priorityFlag:e.target.value})} options={['High','Normal','Low']}/>
            </Field>
            <Field label="Case Trigger">
              <Select value={data.caseTrigger} onChange={e=>update({caseTrigger:e.target.value})} options={['Yes','No','NA']}/>
            </Field>
            <Field label="Trigger Reason">
              <Input value={data.triggerReason} onChange={e=>update({triggerReason:e.target.value})} placeholder="Reason for case trigger if Yes"/>
            </Field>
            <Field label="System Generated Remarks" full>
              <Textarea value={data.systemAssessorRemarks} onChange={e=>update({systemAssessorRemarks:e.target.value})} placeholder="System-generated assessment observations. Can be supplemented by assessor." rows={4}/>
            </Field>
            <Field label="Assessor Additional Remarks" full>
              <Textarea value={data.assessorRemarks} onChange={e=>update({assessorRemarks:e.target.value})} placeholder="Additional remarks from assessor beyond system observations..." rows={4}/>
            </Field>
          </Grid>
        </div>
      )}

      <div style={{ marginTop:'24px', paddingTop:'16px', borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'flex-end', gap:'10px' }}>
        {!allAnswered && subTab==='Questions' && (
          <div style={{ marginRight:'auto', fontSize:'12px', fontWeight:600, color:'#D97706', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'8px', padding:'8px 14px', display:'flex', alignItems:'center' }}>
            ⚠️ {questions.length - answeredCount} question(s) still unanswered
          </div>
        )}
        <Btn variant='success' onClick={onComplete}>✓ Complete Assessment →</Btn>
      </div>
    </div>
  )
}
