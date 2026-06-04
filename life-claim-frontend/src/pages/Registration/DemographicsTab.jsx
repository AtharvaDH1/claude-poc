// DemographicsTab v2 — null-safe
import React, { useState, useEffect } from 'react'
import { Field, Input, Select, Textarea, SectionHeader, Grid, Btn, SubTabNav, InfoCard, T } from './shared'
import { fetchPolicyDetails as fetchPolicyAPI } from '../../services/policyService'
import { getCauseEvents, getTrapScore } from '../../services/masterService'
import statesService from '../../services/statesService'
import placeOfDeathService from '../../services/placeOfDeathService'
import trapScoreService from '../../services/trapScoreService'
import { useToast } from '../../components/Toast'

/* ── Cause of Death Modal ── */
function CauseModal({ causes, onSelect, onClose }) {
  const [q, setQ] = useState('')
  const filtered = causes.filter(c => !q || c.causeDescription.toLowerCase().includes(q.toLowerCase()) || c.causeCode.includes(q))
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(2px)' }}>
      <div style={{ background:'#fff', borderRadius:'16px', width:'560px', maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:800, fontSize:'15px', color:T.textPrimary }}>Select Cause of Death / Event</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'20px', color:T.textMuted }}>×</button>
        </div>
        <div style={{ padding:'12px 16px', borderBottom:`1px solid ${T.border}` }}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search cause..." autoFocus
            style={{ width:'100%', height:'36px', padding:'0 12px', border:`1.5px solid ${T.border}`, borderRadius:'7px', fontSize:'13px', fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }}
            onFocus={e=>e.target.style.borderColor=T.primary} onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead style={{ position:'sticky', top:0, background:'#FAFAFA' }}>
              <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                {['Code','Description','Category','Sub Type'].map(h=>(
                  <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c=>(
                <tr key={c.causeCode} onClick={()=>onSelect(c)} style={{ borderBottom:`1px solid ${T.borderSubtle}`, cursor:'pointer', transition:'background 0.1s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#EFF6FF'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                  <td style={{ padding:'10px 14px', fontSize:'12px', fontWeight:700, color:T.primary, fontFamily:'monospace' }}>{c.causeCode}</td>
                  <td style={{ padding:'10px 14px', fontSize:'13px', fontWeight:600, color:T.textSecondary }}>{c.causeDescription}</td>
                  <td style={{ padding:'10px 14px', fontSize:'12px', color:T.textMuted }}>{c.causeCategory}</td>
                  <td style={{ padding:'10px 14px', fontSize:'12px', color:T.textMuted }}>{c.claimSubType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ── Dynamic table for Eagle Screen ── */
function DynamicTable({ title, columns, rows, onAdd, onDelete }) {
  return (
    <div style={{ marginBottom:'16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
        <span style={{ fontSize:'12px', fontWeight:700, color:T.textSecondary, textTransform:'uppercase', letterSpacing:'0.06em' }}>{title}</span>
        <Btn size='sm' variant='secondary' onClick={onAdd}>+ Add Row</Btn>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding:'20px', textAlign:'center', background:'#FAFAFA', borderRadius:'8px', border:`1px dashed ${T.border}`, fontSize:'13px', color:T.textSubtle }}>No records added. Click "+ Add Row" to begin.</div>
      ) : (
        <div style={{ overflowX:'auto', borderRadius:'8px', border:`1px solid ${T.border}` }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'600px' }}>
            <thead>
              <tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
                {columns.map(c=><th key={c.key} style={{ padding:'8px 12px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{c.label}</th>)}
                <th style={{ padding:'8px 12px', width:'50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i)=>(
                <tr key={i} style={{ borderBottom:`1px solid ${T.borderSubtle}`, transition:'background 0.1s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                  {columns.map(c=><td key={c.key} style={{ padding:'8px 12px', fontSize:'12px', color:T.textSecondary }}>{row[c.key]||'—'}</td>)}
                  <td style={{ padding:'8px 12px' }}>
                    <button onClick={()=>onDelete(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444', fontSize:'16px', lineHeight:1 }} title="Delete row">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Add Row Modal ── */
function AddRowModal({ title, fields, onSave, onClose }) {
  const [form, setForm] = useState({})
  const set = (k,v) => setForm(p=>({...p,[k]:v}))
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(2px)' }}>
      <div style={{ background:'#fff', borderRadius:'14px', width:'520px', maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 48px rgba(0,0,0,0.2)' }}>
        <div style={{ padding:'14px 20px', borderBottom:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:800, fontSize:'14px', color:T.textPrimary }}>Add — {title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'20px', color:T.textMuted }}>×</button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            {fields.map(f=>(
              <div key={f.key} style={{ gridColumn: f.full?'1/-1':'auto' }}>
                <Field label={f.label} required={f.required}>
                  {f.options
                    ? <Select value={form[f.key]} onChange={e=>set(f.key,e.target.value)} options={f.options}/>
                    : <Input type={f.type||'text'} value={form[f.key]} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder}/>
                  }
                </Field>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:'14px 20px', borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'flex-end', gap:'10px' }}>
          <Btn variant='secondary' onClick={onClose}>Cancel</Btn>
          <Btn onClick={()=>{ onSave(form); onClose() }}>Save Row</Btn>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════
   DEMOGRAPHICS TAB
════════════════════════════════════ */
export default function DemographicsTab({ data, update, policy, setPolicy, onComplete }) {
  const toast = useToast()
  const [open, setOpen] = useState('register')
  const [completed, setCompleted] = useState(new Set())
  const [causes, setCauses] = useState([])
  const [showCauseModal, setShowCauseModal] = useState(false)
  const [loadingPolicy, setLoadingPolicy] = useState(false)
  const [addingRowFor, setAddingRowFor] = useState(null)
  const [generatingTrap, setGeneratingTrap] = useState(false)
  const [states, setStates] = useState([])
  const [placesOfDeath, setPlacesOfDeath] = useState([])

  useEffect(() => {
    getCauseEvents().then(setCauses).catch(() => setCauses([]))
    statesService.getAllStates().then(list => {
      setStates(list.map(s => s.STATE_NAME || s.state_name || s.name || s).filter(Boolean))
    })
    placeOfDeathService().then(list => {
      setPlacesOfDeath(list.map(p => p.place || p.PLACE || p).filter(Boolean))
    })
  }, [])

  const toggle = (s) => setOpen(p => p===s ? null : s)
  const done = (s) => completed.has(s)
  const markDone = (s) => { setCompleted(p => new Set([...p, s])); toast('success','Section Saved', `${s} saved successfully.`) }

  /* Policy fetch */
  const handlePolicySearch = async () => {
    if (!data.policyId) { toast('warning','Missing','Please enter a policy number.'); return }
    setLoadingPolicy(true)
    try {
      const p = await fetchPolicyAPI(data.policyId.trim())
      setPolicy(p)
      update({ policyId:p.policyId, productCode:p.productCode, productName:p.productName, sumAssured:p.sumAssured, issueDate:p.issueDate, riskCommencementDate:p.riskCommencementDate, paidToDate:p.paidToDate, premiumStatus:p.premiumStatus, premiumFrequency:p.premiumFrequency, term:p.term, premPaidYrs:p.premPaidYrs, totalPremiumPaid:p.totalPremiumPaid, currentSA:p.currentSA, cashValue:p.cashValue, maturityValue:p.maturityValue, advisorCode:p.advisorCode, advisorStatus:p.advisorStatus, uwDecision:p.uwDecision })
      markDone('register'); setOpen('intimation')
      toast('success','Policy Loaded', `${p.policyId} — ${p.productName} loaded.`)
    } catch(e) { toast('error','Not Found', e.message) }
    finally { setLoadingPolicy(false) }
  }

  const selectCause = (c) => { update({ causeCode:c.causeCode, causeDescription:c.causeDescription, causeCategory:c.causeCategory, causeSubType:c.claimSubType, claimRegistrationType:c.claimRegistrationType }); setShowCauseModal(false) }

  /* Trap score */
  const handleTrapScore = async () => {
    setGeneratingTrap(true)
    try {
      let res
      try {
        res = await getTrapScore({ gender:data.laGender, sumAssured:data.sumAssured, ageAtDeath:data.laAgeAtDeath, causeOfDeath:data.causeCode, placeOfDeath:data.placeOfDeath, advisorCode:data.advisorCode })
      } catch {
        res = await trapScoreService({ gender:data.laGender, sumAssured:data.sumAssured, ageAtDeath:data.laAgeAtDeath, causeOfDeath:data.causeCode, placeOfDeath:data.placeOfDeath, advisorCode:data.advisorCode })
      }
      update({ trapScore:res.trapScore, trapRisk:res.trapRisk, trapRemarks:res.trapRemarks, trapDate:res.trapDate })
      markDone('trap'); toast('success','Trap Score Generated', `Score: ${res.trapScore} — Risk: ${res.trapRisk}`)
    } catch(e) { toast('error','Failed', e.message) }
    finally { setGeneratingTrap(false) }
  }

  /* Eagle screen table columns */
  const HOSPITAL_COLS = [
    { key:'hospitalName', label:'Hospital Name' }, { key:'admissionDate', label:'Admission' }, { key:'dischargeDate', label:'Discharge' }, { key:'diagnosis', label:'Diagnosis' }, { key:'natureOfIllness', label:'Illness' },
  ]
  const HOSPITAL_FIELDS = [
    { key:'hospitalName', label:'Hospital Name', required:true, placeholder:'Full hospital name' },
    { key:'hospitalAddress', label:'Address', placeholder:'Hospital address' },
    { key:'admissionDate', label:'Date of Admission', type:'date', required:true },
    { key:'dischargeDate', label:'Date of Discharge', type:'date' },
    { key:'diagnosis', label:'Diagnosis', placeholder:'Primary diagnosis' },
    { key:'doctorName', label:'Treating Doctor' },
    { key:'natureOfIllness', label:'Nature of Illness', full:true, options:['Acute','Chronic','Trauma','Others'] },
  ]
  const DOCTOR_COLS = [
    { key:'doctorName', label:'Doctor Name' }, { key:'regNo', label:'Reg No' }, { key:'qualification', label:'Qualification' }, { key:'firstConsultDate', label:'First Consultation' }, { key:'causeOfDeath', label:'Cause' },
  ]
  const DOCTOR_FIELDS = [
    { key:'doctorName', label:'Doctor Name', required:true }, { key:'regNo', label:'Registration No', required:true },
    { key:'qualification', label:'Qualification', options:['MBBS','MD','MS','BDS','BAMS','Others'] }, { key:'specialization', label:'Specialization' },
    { key:'firstConsultDate', label:'First Consultation Date', type:'date', required:true }, { key:'causeOfDeath', label:'Cause of Death Mentioned' },
    { key:'hospitalName', label:'Associated Hospital', full:true },
  ]
  const PROOF_COLS = [
    { key:'proofType', label:'Proof Type' }, { key:'documentType', label:'Document Type' }, { key:'issueDate', label:'Issue Date' }, { key:'documentId', label:'Document ID' }, { key:'holderName', label:'Holder Name' },
  ]
  const PROOF_FIELDS = [
    { key:'proofType', label:'Proof Type', required:true, options:['Identity','Address','Age','Death Certificate','Medical','Financial','Legal'] },
    { key:'documentType', label:'Document Type', required:true, options:['Aadhaar','PAN','Passport','Voter ID','Driving Licence','Ration Card','Birth Certificate','Others'] },
    { key:'documentId', label:'Document ID / Number', required:true },
    { key:'issueDate', label:'Issue Date', type:'date' }, { key:'holderName', label:'Document Holder Name', required:true },
    { key:'dobOnDoc', label:'DOB on Document', type:'date' }, { key:'isLetterSubmitted', label:'Letter Submitted', options:['Yes','No'] },
    { key:'category', label:'Category', options:['Original','Attested Copy','Self-attested','Notarized'] },
  ]
  const WITNESS_COLS = [
    { key:'witnessName', label:'Name' }, { key:'relation', label:'Relation' }, { key:'mobileNo', label:'Mobile' }, { key:'address', label:'Address' },
  ]
  const WITNESS_FIELDS = [
    { key:'witnessName', label:'Witness Name', required:true }, { key:'relation', label:'Relation to Life Assured', required:true, options:['Spouse','Parent','Sibling','Friend','Neighbour','Employer','Others'] },
    { key:'mobileNo', label:'Mobile Number' }, { key:'address', label:'Address', full:true },
    { key:'signature', label:'Signature Available', options:['Yes','No','Pending'] },
  ]

  // ── Insurance Proof Details (original: InsuranceProofDetails table)
  const INS_PROOF_COLS = [
    { key:'proofType', label:'Proof Type' }, { key:'documentId', label:'Document ID' }, { key:'holderName', label:'Holder Name' }, { key:'dobOnDoc', label:'DOB on Doc' }, { key:'aadhaarMatch', label:'Aadhaar Match' }, { key:'panMatch', label:'PAN Match' },
  ]
  const INS_PROOF_FIELDS = [
    { key:'proofType', label:'Proof Type', required:true, options:['Aadhaar','PAN','Passport','Voter ID','Driving Licence','Others'] },
    { key:'documentId', label:'Document ID / Number', required:true }, { key:'holderName', label:'Holder Name', required:true },
    { key:'dobOnDoc', label:'DOB on Document', type:'date' }, { key:'issueDate', label:'Issue Date', type:'date' },
    { key:'aadhaarMatch', label:'Aadhaar Match', options:['Yes','No','NA'] },
    { key:'panMatch', label:'PAN Name Match', options:['Yes','No','NA'] },
    { key:'dobMatch', label:'DOB Match', options:['Yes','No','NA'] },
    { key:'category', label:'Category', options:['Original','Attested Copy','Self-attested','Notarized'] },
    { key:'letterSubmitted', label:'Letter Submitted', options:['Yes','No'] },
    { key:'panStatus', label:'PAN Status', options:['Valid','Invalid','Not Available'] },
  ]

  // ── Income Document Details (original: IncomeDetails table)
  const INCOME_COLS = [
    { key:'financialYear', label:'Financial Year' }, { key:'proofType', label:'Proof Type' }, { key:'incomeAmount', label:'Income (₹)' }, { key:'issueDate', label:'Issue Date' },
  ]
  const INCOME_FIELDS = [
    { key:'financialYear', label:'Financial Year', required:true, placeholder:'e.g. 2024-25' },
    { key:'proofType', label:'Proof Type', required:true, options:['ITR','Form 16','Salary Slip','Bank Statement','CA Certificate','Others'] },
    { key:'incomeAmount', label:'Income Amount (₹)', placeholder:'Annual income' },
    { key:'issueDate', label:'Document Issue Date', type:'date' },
    { key:'emailId', label:'Email on Document' },
    { key:'mobileNo', label:'Mobile on Document' },
    { key:'remarks', label:'Remarks', full:true },
  ]

  const addRow = (field, row) => update({ [field]: [...(data[field]||[]), row] })
  const delRow = (field, i) => update({ [field]: (data[field]||[]).filter((_,idx)=>idx!==i) })

  const sec = (id, title, sub, children) => (
    <div style={{ borderBottom:`1px solid ${T.border}` }}>
      <SectionHeader title={title} subtitle={sub} open={open===id} onToggle={()=>toggle(id)} done={done(id)}/>
      {open===id && <div style={{ padding:'20px 22px' }}>{children}</div>}
    </div>
  )

  const policyLoaded = !!policy

  return (
    <div>
      {/* 1. Register Form */}
      {sec('register','1. Policy & Claim Setup','Search policy and select claim type',
        <div>
          <Grid cols={3}>
            <Field label="Policy Number" required>
              <div style={{ display:'flex', gap:'8px' }}>
                <Input value={data.policyId} onChange={e=>update({policyId:e.target.value})} placeholder="e.g. POL-78432"
                  onFocus={undefined} onBlur={undefined}/>
                <Btn onClick={handlePolicySearch} disabled={loadingPolicy} size='sm'>
                  {loadingPolicy ? '...' : '🔍 Fetch'}
                </Btn>
              </div>
            </Field>
            <Field label="Claim Type" required>
              <Select value={data.claimType} onChange={e=>update({claimType:e.target.value})} options={['Death','Rider']}/>
            </Field>
            <Field label="Information Type" required>
              <Select value={data.informationType} onChange={e=>update({informationType:e.target.value})} options={['Written Information','Verbal Information']}/>
            </Field>
          </Grid>
          {policyLoaded && (
            <div style={{ marginTop:'16px', padding:'14px 16px', background:'#ECFDF5', borderRadius:'10px', border:'1px solid #A7F3D0', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
              {[['Product',policy.productName],['Sum Assured',`₹${(policy.sumAssured/1e5).toFixed(1)}L`],['Issue Date',policy.issueDate],['Status',policy.premiumStatus]].map(([k,v])=>(
                <div key={k}><div style={{ fontSize:'10px', color:'#047857', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>{k}</div><div style={{ fontSize:'13px', fontWeight:800, color:'#065F46', marginTop:'2px' }}>{v}</div></div>
              ))}
            </div>
          )}
          <div style={{ marginTop:'16px', display:'flex', justifyContent:'flex-end' }}>
            <Btn onClick={()=>{ markDone('register'); setOpen('intimation') }} disabled={!policyLoaded}>Save & Continue →</Btn>
          </div>
        </div>
      )}

      {/* 2. Intimation Details */}
      {sec('intimation','2. Intimation Details','Dates, source and death certificate information',
        <div>
          <Grid cols={3}>
            <Field label="Intimation Date" required><Input type="date" value={data.intimationDate} onChange={e=>update({intimationDate:e.target.value})}/></Field>
            <Field label="Source" required><Select value={data.source} onChange={e=>update({source:e.target.value})} options={['Branch','Direct','Website','Email','WhatsApp','Agent','Hospital']}/></Field>
            <Field label="Bond Type" required><Select value={data.bondType} onChange={e=>update({bondType:e.target.value})} options={['Policy Bond','Indemnity Bond','Not Provided']}/></Field>
            <Field label="FIR / PM Received"><Select value={data.firPmReceived} onChange={e=>update({firPmReceived:e.target.value})} options={['Yes','No','Not Required']}/></Field>
            <Field label="Declared by Doctor"><Select value={data.declaredByDoctor} onChange={e=>update({declaredByDoctor:e.target.value})} options={['Yes','No']}/></Field>
            <Field label="WhatsApp Flag"><Select value={data.whatsappFlag} onChange={e=>update({whatsappFlag:e.target.value})} options={['Yes','No']}/></Field>
            <Field label="Date of Death / Event" required><Input type="date" value={data.dateOfDeathEvent} onChange={e=>update({dateOfDeathEvent:e.target.value})}/></Field>
            <Field label="Date of Death Registration" required><Input type="date" value={data.dateOfDeathReg} onChange={e=>update({dateOfDeathReg:e.target.value})}/></Field>
            <Field label="Date of Cremation"><Input type="date" value={data.dateOfCremation} onChange={e=>update({dateOfCremation:e.target.value})}/></Field>
            <Field label="Date of Accident"><Input type="date" value={data.dateOfAccident} onChange={e=>update({dateOfAccident:e.target.value})}/></Field>
            <Field label="Place of Death" required><Select value={data.placeOfDeath} onChange={e=>update({placeOfDeath:e.target.value})} options={placesOfDeath}/></Field>
            <Field label="Policy Status on DOD"><Input value={data.policyStatusOnDod} onChange={e=>update({policyStatusOnDod:e.target.value})} readOnly={true} placeholder="Auto-filled"/></Field>
          </Grid>
          <div style={{ marginTop:'20px', paddingTop:'16px', borderTop:`1px solid ${T.border}` }}>
            <div style={{ fontSize:'12px', fontWeight:700, color:T.primary, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'14px' }}>Death Certificate Details</div>
            <Grid cols={3}>
              <Field label="Death Certificate Type" required>
                <Select value={data.deathCertificate} onChange={e=>{
                  const v=e.target.value; update({deathCertificate:v, ...(v==='NA'?{dcRegNumber:'NA',dcRegDate:'NA',dcIssueDistrict:'NA',dcIssuingAuthority:'NA',dcTehsil:'NA',dcIssueState:'NA',dcPlaceOnCertificate:'NA',dcVillageBlock:'NA',dcOfficerPosition:'NA'}:{})})
                }} options={['NA','Manual','Printed']}/>
              </Field>
              <Field label="Reg. Number"><Input value={data.dcRegNumber} onChange={e=>update({dcRegNumber:e.target.value})} readOnly={data.deathCertificate==='NA'}/></Field>
              <Field label="Reg. Date"><Input type="date" value={data.dcRegDate} onChange={e=>update({dcRegDate:e.target.value})} readOnly={data.deathCertificate==='NA'}/></Field>
              <Field label="Issue District"><Input value={data.dcIssueDistrict} onChange={e=>update({dcIssueDistrict:e.target.value})} readOnly={data.deathCertificate==='NA'}/></Field>
              <Field label="Issuing Authority"><Input value={data.dcIssuingAuthority} onChange={e=>update({dcIssuingAuthority:e.target.value})} readOnly={data.deathCertificate==='NA'}/></Field>
              <Field label="Tehsil"><Input value={data.dcTehsil} onChange={e=>update({dcTehsil:e.target.value})} readOnly={data.deathCertificate==='NA'}/></Field>
              <Field label="Issue State"><Select value={data.dcIssueState} onChange={e=>update({dcIssueState:e.target.value})} options={states} readOnly={data.deathCertificate==='NA'}/></Field>
              <Field label="Place on Certificate"><Input value={data.dcPlaceOnCertificate} onChange={e=>update({dcPlaceOnCertificate:e.target.value})} readOnly={data.deathCertificate==='NA'}/></Field>
              <Field label="Village / Block"><Input value={data.dcVillageBlock} onChange={e=>update({dcVillageBlock:e.target.value})} readOnly={data.deathCertificate==='NA'}/></Field>
              <Field label="Officer Position" full><Input value={data.dcOfficerPosition} onChange={e=>update({dcOfficerPosition:e.target.value})} readOnly={data.deathCertificate==='NA'}/></Field>
            </Grid>
          </div>
          <div style={{ marginTop:'16px', display:'flex', justifyContent:'flex-end' }}>
            <Btn onClick={()=>{ markDone('intimation'); setOpen('cause') }}>Save & Continue →</Btn>
          </div>
        </div>
      )}

      {/* 3. Declared Cause */}
      {sec('cause','3. Declared Cause of Death / Event','Select cause from the cause event list',
        <div>
          <div style={{ marginBottom:'16px' }}>
            <Btn variant='secondary' onClick={()=>setShowCauseModal(true)}>🔍 Search & Select Cause</Btn>
          </div>
          {data.causeCode ? (
            <div style={{ padding:'14px', background:'#EFF6FF', borderRadius:'10px', border:'1px solid #BFDBFE', marginBottom:'16px' }}>
              <div style={{ fontSize:'12px', fontWeight:700, color:'#1E40AF', marginBottom:'8px' }}>Selected Cause</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
                {[['Cause Code',data.causeCode],['Description',data.causeDescription],['Category',data.causeCategory],['Claim Sub Type',data.causeSubType],['Registration Type',data.claimRegistrationType]].map(([k,v])=>(
                  <div key={k}><div style={{ fontSize:'10px', color:'#1D4ED8', fontWeight:700, textTransform:'uppercase' }}>{k}</div><div style={{ fontSize:'13px', fontWeight:700, color:T.textPrimary }}>{v||'—'}</div></div>
                ))}
              </div>
            </div>
          ) : <InfoCard type='warning'>No cause selected. Click "Search & Select Cause" above.</InfoCard>}
          <Grid cols={2}>
            <Field label="Date of Event"><Input type="date" value={data.causeEventDate||data.dateOfDeathEvent} onChange={e=>update({causeEventDate:e.target.value})} readOnly={!!data.dateOfDeathEvent}/></Field>
            <Field label="Policy Status on Event"><Input value={data.policyStatusOnEvent||data.policyStatusOnDod} readOnly={true} placeholder="Auto-filled"/></Field>
            <Field label="If Others – Specify" full><Input value={data.causeIfOthers} onChange={e=>update({causeIfOthers:e.target.value})} placeholder="Specify if cause is 'Others'"/></Field>
          </Grid>
          <div style={{ marginTop:'16px', display:'flex', justifyContent:'flex-end' }}>
            <Btn onClick={()=>{ markDone('cause'); setOpen('payee') }} disabled={!data.causeCode}>Save & Continue →</Btn>
          </div>
        </div>
      )}

      {/* 4. Payee Details */}
      {sec('payee','4. Payee Details','Select payee from policy clients',
        <div>
          {!policy ? <InfoCard type='warning'>Please load a policy first (Section 1).</InfoCard> : (
            <>
              <div style={{ marginBottom:'14px', fontSize:'13px', fontWeight:600, color:T.textMuted }}>Select the payee from the policy clients below:</div>
              <div style={{ border:`1px solid ${T.border}`, borderRadius:'10px', overflow:'hidden', marginBottom:'16px' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
                    <th style={{ padding:'9px 14px', width:'40px' }}></th>
                    {['Client ID','Name','DOB','Gender','Role','Relation','Mobile'].map(h=>(
                      <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(policy?.clients||[]).map(c=>(
                      <tr key={c.clientId} style={{ borderBottom:`1px solid ${T.borderSubtle}`, cursor:'pointer', background: data.selectedPayeeId===c.clientId?'#EFF6FF':'' }}
                        onClick={()=>update({ selectedPayeeId:c.clientId, payeeName:c.name, payeeLastName:c.lastName, payeeClientId:c.clientId, payeeDob:c.dob, payeeGender:c.gender, payeeRole:c.role, payeeIdNumber:c.idNumber, payeePanNo:c.panNo, payeeFlat:c.flat, payeeRoad:c.road, payeeArea:c.area, payeeCity:c.city, payeeState:c.state, payeeCountry:c.country, payeePincode:c.pincode, payeeMobileNo:c.mobileNo, payeeEmailId:c.emailId })}>
                        <td style={{ padding:'9px 14px' }}><input type='radio' readOnly checked={data.selectedPayeeId===c.clientId} style={{ cursor:'pointer' }}/></td>
                        <td style={{ padding:'9px 14px', fontSize:'12px', fontWeight:700, color:T.primary, fontFamily:'monospace' }}>{c.clientId}</td>
                        <td style={{ padding:'9px 14px', fontSize:'13px', fontWeight:600, color:T.textSecondary }}>{c.name} {c.lastName}</td>
                        <td style={{ padding:'9px 14px', fontSize:'12px', color:T.textMuted }}>{c.dob}</td>
                        <td style={{ padding:'9px 14px', fontSize:'12px', color:T.textMuted }}>{c.gender}</td>
                        <td style={{ padding:'9px 14px' }}><span style={{ fontSize:'11px', fontWeight:700, padding:'2px 8px', borderRadius:'99px', background:'#EFF6FF', color:T.primary }}>{c.role}</span></td>
                        <td style={{ padding:'9px 14px', fontSize:'12px', color:T.textMuted }}>{c.relation}</td>
                        <td style={{ padding:'9px 14px', fontSize:'12px', color:T.textMuted, fontFamily:'monospace' }}>{c.mobileNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.selectedPayeeId && (
                <div style={{ padding:'14px', background:'#EFF6FF', borderRadius:'10px', border:'1px solid #BFDBFE' }}>
                  <div style={{ fontSize:'12px', fontWeight:700, color:T.primary, marginBottom:'10px' }}>Edit Payee Details</div>
                  <Grid cols={3}>
                    <Field label="Relation with Life Assured" required><Select value={data.payeeRelation} onChange={e=>update({payeeRelation:e.target.value})} options={['Self','Spouse','Mother','Father','Son','Daughter','Brother','Sister','Relative - Others','Friend','Not Related']}/></Field>
                    <Field label="Status" required><Select value={data.payeeStatus} onChange={e=>update({payeeStatus:e.target.value})} options={['Alive','Deceased']}/></Field>
                    <Field label="PAN No"><Input value={data.payeePanNo} onChange={e=>update({payeePanNo:e.target.value})}/></Field>
                    <Field label="Mobile No"><Input value={data.payeeMobileNo} onChange={e=>update({payeeMobileNo:e.target.value})} maxLength={10}/></Field>
                    <Field label="Tel No"><Input value={data.payeeTelNo} onChange={e=>update({payeeTelNo:e.target.value})} maxLength={7}/></Field>
                    <Field label="Email"><Input type="email" value={data.payeeEmailId} onChange={e=>update({payeeEmailId:e.target.value})}/></Field>
                  </Grid>
                </div>
              )}
            </>
          )}
          <div style={{ marginTop:'16px', display:'flex', justifyContent:'flex-end' }}>
            <Btn onClick={()=>{ markDone('payee'); setOpen('claimant') }} disabled={!data.selectedPayeeId}>Save & Continue →</Btn>
          </div>
        </div>
      )}

      {/* 5. Claimant Details */}
      {sec('claimant','5. Claimant Details','Add one or more claimants',
        <div>
          <ClaimantSection data={data} update={update} policy={policy}/>
          <div style={{ marginTop:'16px', display:'flex', justifyContent:'flex-end' }}>
            <Btn onClick={()=>{ markDone('claimant'); setOpen('la') }}>Save & Continue →</Btn>
          </div>
        </div>
      )}

      {/* 6. Life Assured Details */}
      {sec('la','6. Life Assured Details','Details of the insured person',
        <div>
          <Grid cols={3}>
            <Field label="Name" required><Input value={data.laName||(policy?.clients?.[0]?.name+' '+policy?.clients?.[0]?.lastName)} onChange={e=>update({laName:e.target.value})} readOnly={!!policy}/></Field>
            <Field label="Client ID"><Input value={data.laClientId||(policy?.clients?.[0]?.clientId)} readOnly={true}/></Field>
            <Field label="Date of Birth"><Input type="date" value={data.laDob||(policy?.clients?.[0]?.dob)} onChange={e=>update({laDob:e.target.value})} readOnly={!!policy}/></Field>
            <Field label="Gender"><Select value={data.laGender||(policy?.clients?.[0]?.gender)} onChange={e=>update({laGender:e.target.value})} options={['Male','Female','Other']} readOnly={!!policy}/></Field>
            <Field label="Risk Indicator"><Input value={data.laRiskIndicator||(policy?.clients?.[0]?.riskIndicator)} readOnly={true} placeholder="From policy"/></Field>
            <Field label="Age at Death (Auto)"><Input value={data.laAgeAtDeath||( data.dateOfDeathEvent&&(data.laDob||policy?.clients?.[0]?.dob) ? `${new Date(data.dateOfDeathEvent).getFullYear() - new Date(data.laDob||policy?.clients?.[0]?.dob).getFullYear()} yrs`:'Auto-calc')} readOnly={true}/></Field>
            <Field label="ID Proof Type"><Select value={data.laIdProofType} onChange={e=>update({laIdProofType:e.target.value})} options={['Aadhaar','PAN','Passport','Voter ID','Others']}/></Field>
            <Field label="ID Number"><Input value={data.laIdNumber||(policy?.clients?.[0]?.idNumber)} onChange={e=>update({laIdNumber:e.target.value})}/></Field>
            <Field label="Mobile No"><Input value={data.laMobileNo||(policy?.clients?.[0]?.mobileNo)} onChange={e=>update({laMobileNo:e.target.value})} maxLength={10}/></Field>
            <Field label="Email"><Input type="email" value={data.laEmailId||(policy?.clients?.[0]?.emailId)} onChange={e=>update({laEmailId:e.target.value})}/></Field>
            <Field label="Flat/House No"><Input value={data.laFlat||(policy?.clients?.[0]?.flat)} onChange={e=>update({laFlat:e.target.value})} readOnly={!!policy}/></Field>
            <Field label="Road / Street"><Input value={data.laRoad||(policy?.clients?.[0]?.road)} onChange={e=>update({laRoad:e.target.value})} readOnly={!!policy}/></Field>
            <Field label="Area / Locality"><Input value={data.laArea||(policy?.clients?.[0]?.area)} onChange={e=>update({laArea:e.target.value})} readOnly={!!policy}/></Field>
            <Field label="City"><Input value={data.laCity||(policy?.clients?.[0]?.city)} onChange={e=>update({laCity:e.target.value})} readOnly={!!policy}/></Field>
            <Field label="State"><Select value={data.laState||(policy?.clients?.[0]?.state)} onChange={e=>update({laState:e.target.value})} options={states} readOnly={!!policy}/></Field>
            <Field label="Pincode"><Input value={data.laPincode||(policy?.clients?.[0]?.pincode)} onChange={e=>update({laPincode:e.target.value})} maxLength={6} readOnly={!!policy}/></Field>
          </Grid>
          <div style={{ marginTop:'20px', paddingTop:'16px', borderTop:`1px solid ${T.border}` }}>
            <div style={{ fontSize:'12px', fontWeight:700, color:T.primary, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'14px' }}>Occupation Details</div>
            <Grid cols={3}>
              <Field label="Occupation Code"><Input value={data.laOccCode} onChange={e=>update({laOccCode:e.target.value})} placeholder="Occ. category"/></Field>
              <Field label="Occupation Description"><Input value={data.laOccDesc} onChange={e=>update({laOccDesc:e.target.value})}/></Field>
              <Field label="Annual Income"><Input value={data.laIncome} onChange={e=>update({laIncome:e.target.value})} placeholder="₹"/></Field>
              <Field label="Establishment Name"><Input value={data.laEstName} onChange={e=>update({laEstName:e.target.value})}/></Field>
              <Field label="Designation"><Input value={data.laDesignation} onChange={e=>update({laDesignation:e.target.value})}/></Field>
              <Field label="Nature of Work"><Input value={data.laNatureOfWork} onChange={e=>update({laNatureOfWork:e.target.value})}/></Field>
            </Grid>
          </div>
          <div style={{ marginTop:'16px', display:'flex', justifyContent:'flex-end' }}>
            <Btn onClick={()=>{ markDone('la'); setOpen('contract') }}>Save & Continue →</Btn>
          </div>
        </div>
      )}

      {/* 7. Contract Details */}
      {sec('contract','7. Contract Details','Policy contract and financial information',
        <div>
          <Grid cols={3}>
            <Field label="Application No"><Input value={data.appNo} onChange={e=>update({appNo:e.target.value})}/></Field>
            <Field label="Product Name"><Input value={data.productName||policy?.productName} readOnly={true}/></Field>
            <Field label="Product Code"><Input value={data.productCode||policy?.productCode} readOnly={true}/></Field>
            <Field label="CDF Signature Date"><Input type="date" value={data.cdfDate} onChange={e=>update({cdfDate:e.target.value})}/></Field>
            <Field label="Issue Date"><Input type="date" value={data.issueDate||policy?.issueDate} readOnly={true}/></Field>
            <Field label="Risk Commencement Date"><Input type="date" value={data.riskCommencementDate||policy?.riskCommencementDate} readOnly={true}/></Field>
            <Field label="Paid to Date"><Input type="date" value={data.paidToDate||policy?.paidToDate} readOnly={true}/></Field>
            <Field label="Premium Frequency"><Input value={data.premiumFrequency||policy?.premiumFrequency} readOnly={true}/></Field>
            <Field label="Premium Status"><Input value={data.premiumStatus||policy?.premiumStatus} readOnly={true}/></Field>
            <Field label="Policy Term (yrs)"><Input value={data.term||policy?.term} readOnly={true}/></Field>
            <Field label="Premium Paid Years"><Input value={data.premPaidYrs||policy?.premPaidYrs} readOnly={true}/></Field>
            <Field label="Total Premium Paid"><Input value={data.totalPremiumPaid||policy?.totalPremiumPaid} readOnly={true}/></Field>
            <Field label="Original Sum Assured"><Input value={data.originalSA||policy?.originalSA} readOnly={true}/></Field>
            <Field label="Current Sum Assured"><Input value={data.currentSA||policy?.currentSA} readOnly={true}/></Field>
            <Field label="Cash Value"><Input value={data.cashValue||policy?.cashValue} readOnly={true}/></Field>
            <Field label="Maturity Value"><Input value={data.maturityValue||policy?.maturityValue} readOnly={true}/></Field>
            <Field label="Outstanding Loan"><Input value={data.outstandingLoan} onChange={e=>update({outstandingLoan:e.target.value})}/></Field>
            <Field label="Excess Premium"><Input value={data.excessPremium} onChange={e=>update({excessPremium:e.target.value})}/></Field>
            <Field label="UW Decision"><Input value={data.uwDecision||policy?.uwDecision} readOnly={true}/></Field>
            <Field label="UW Decision Date"><Input value={data.uwDecisionDate||policy?.uwDecisionDate} readOnly={true}/></Field>
            <Field label="Advisor Code"><Input value={data.advisorCode||policy?.advisorCode} readOnly={true}/></Field>
            <Field label="Advisor Status"><Input value={data.advisorStatus||policy?.advisorStatus} readOnly={true}/></Field>
            <Field label="Name Change Declared"><Select value={data.nameChangeDecl} onChange={e=>update({nameChangeDecl:e.target.value})} options={['Yes','No']}/></Field>
            <Field label="E-Kit Printed"><Select value={data.ekitPrinted||(policy?.ekitPrinted)} onChange={e=>update({ekitPrinted:e.target.value})} options={['Yes','No']}/></Field>
            <Field label="Assignment"><Input value={data.assignment||policy?.assignment} readOnly={true}/></Field>
            <Field label="Sales Channel"><Input value={data.salesChannel||policy?.salesChannel} readOnly={true}/></Field>
          </Grid>
          {policy?.riders?.length > 0 && (
            <div style={{ marginTop:'20px' }}>
              <div style={{ fontSize:'12px', fontWeight:700, color:T.primary, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'10px' }}>Rider Details</div>
              <div style={{ border:`1px solid ${T.border}`, borderRadius:'8px', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
                    {['Rider Code','Sum Assured','RCD','Term','Status','Cessation Date'].map(h=>(
                      <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {policy.riders.map((r,i)=>(
                      <tr key={i} style={{ borderBottom:`1px solid ${T.borderSubtle}` }}>
                        <td style={{ padding:'9px 14px', fontSize:'12px', fontWeight:700, color:T.primary }}>{r.riderCode}</td>
                        <td style={{ padding:'9px 14px', fontSize:'12px', color:T.textSecondary }}>₹{(r.riderSA/1e5).toFixed(1)}L</td>
                        <td style={{ padding:'9px 14px', fontSize:'12px', color:T.textMuted }}>{r.riderRCD}</td>
                        <td style={{ padding:'9px 14px', fontSize:'12px', color:T.textMuted }}>{r.riderTerm} yrs</td>
                        <td style={{ padding:'9px 14px' }}><span style={{ fontSize:'11px', fontWeight:700, padding:'2px 8px', borderRadius:'99px', background:'#ECFDF5', color:'#059669' }}>{r.riderStatus}</span></td>
                        <td style={{ padding:'9px 14px', fontSize:'12px', color:T.textMuted }}>{r.riderCessationDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div style={{ marginTop:'16px', display:'flex', justifyContent:'flex-end' }}>
            <Btn onClick={()=>{ markDone('contract'); setOpen('eagle') }}>Save & Continue →</Btn>
          </div>
        </div>
      )}

      {/* 8. Eagle Screen */}
      {sec('eagle','8. Eagle Screen / Fraud Details','Hospital, doctor, proof and witness information',
        <div>
          <Grid cols={3}>
            <Field label="LA Mobile No"><Input value={data.eagleLaMobile} onChange={e=>update({eagleLaMobile:e.target.value})} maxLength={10}/></Field>
            <Field label="Claimant Mobile No"><Input value={data.eagleClaimantMobile} onChange={e=>update({eagleClaimantMobile:e.target.value})} maxLength={10}/></Field>
            <Field label="Agent Mobile No"><Input value={data.eagleAgentMobile} onChange={e=>update({eagleAgentMobile:e.target.value})} maxLength={10}/></Field>
            <Field label="Bank Name (ECS)"><Input value={data.eagleBankName} onChange={e=>update({eagleBankName:e.target.value})}/></Field>
            <Field label="Account Number"><Input value={data.eagleAccNo} onChange={e=>update({eagleAccNo:e.target.value})}/></Field>
            <Field label="Account Opening Date"><Input type="date" value={data.eagleAccOpenDate} onChange={e=>update({eagleAccOpenDate:e.target.value})}/></Field>
            <Field label="Center Name"><Input value={data.eagleCenterName} onChange={e=>update({eagleCenterName:e.target.value})}/></Field>
            <Field label="Doctor Name"><Input value={data.eagleDoctorName} onChange={e=>update({eagleDoctorName:e.target.value})}/></Field>
            <Field label="Life Assured Occupation"><Input value={data.eagleOccupation} onChange={e=>update({eagleOccupation:e.target.value})}/></Field>
          </Grid>
          <div style={{ marginTop:'20px' }}>
            <DynamicTable title="Hospital Details" columns={HOSPITAL_COLS} rows={data.hospitalDetails||[]} onAdd={()=>setAddingRowFor('hospital')} onDelete={i=>delRow('hospitalDetails',i)}/>
            <DynamicTable title="Doctor Details" columns={DOCTOR_COLS} rows={data.doctorDetails||[]} onAdd={()=>setAddingRowFor('doctor')} onDelete={i=>delRow('doctorDetails',i)}/>
            <DynamicTable title="Proof / Document Details" columns={PROOF_COLS} rows={data.proofDetails||[]} onAdd={()=>setAddingRowFor('proof')} onDelete={i=>delRow('proofDetails',i)}/>
            <DynamicTable title="Witness Details" columns={WITNESS_COLS} rows={data.witnessDetails||[]} onAdd={()=>setAddingRowFor('witness')} onDelete={i=>delRow('witnessDetails',i)}/>
            <DynamicTable title="Insurance Proof Details" columns={INS_PROOF_COLS} rows={data.insProofDetails||[]} onAdd={()=>setAddingRowFor('insProof')} onDelete={i=>delRow('insProofDetails',i)}/>
            <DynamicTable title="Income Document Details" columns={INCOME_COLS} rows={data.incomeDetails||[]} onAdd={()=>setAddingRowFor('income')} onDelete={i=>delRow('incomeDetails',i)}/>
          </div>
          <div style={{ marginTop:'16px', display:'flex', justifyContent:'flex-end' }}>
            <Btn onClick={()=>{ markDone('eagle'); setOpen('trap') }}>Save & Continue →</Btn>
          </div>
        </div>
      )}

      {/* 9. Trap Score */}
      {sec('trap','9. Trap Score Details','Automated fraud risk scoring',
        <div>
          {data.trapScore ? (
            <div style={{ marginBottom:'16px', padding:'16px', borderRadius:'10px', background:'#F0FDF4', border:'1px solid #A7F3D0' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'12px' }}>
                {[['Trap Score',data.trapScore],['Risk Level',data.trapRisk],['Generated On',data.trapDate]].map(([k,v])=>(
                  <div key={k}><div style={{ fontSize:'10px', fontWeight:700, color:'#047857', textTransform:'uppercase' }}>{k}</div><div style={{ fontSize:'16px', fontWeight:900, color:'#065F46', marginTop:'2px' }}>{v}</div></div>
                ))}
              </div>
              {data.trapRemarks && <div style={{ fontSize:'12px', color:'#065F46', fontWeight:500 }}>Remarks: {data.trapRemarks}</div>}
            </div>
          ) : <InfoCard type='info'>No trap score generated yet. Click the button below to generate it.</InfoCard>}
          <div style={{ marginTop:'16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <Btn variant='warning' onClick={handleTrapScore} disabled={generatingTrap}>
              {generatingTrap ? '⏳ Generating...' : '🎯 Generate Trap Score'}
            </Btn>
            {data.trapScore && <Btn onClick={()=>{ markDone('trap'); setOpen('agent') }}>Save & Continue →</Btn>}
          </div>
        </div>
      )}

      {/* 10. Agent Repudiation History */}
      {sec('agent','10. Agent Repudiation History','Historical repudiation records for this advisor',
        <div>
          {!policy?.agentRepudiation?.length ? (
            <InfoCard type='success'>No repudiation history found for Advisor Code: {data.advisorCode||'N/A'}.</InfoCard>
          ) : (
            <div style={{ border:`1px solid ${T.border}`, borderRadius:'8px', overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
                  {['Case No','Reason','Date','Decision','Remarks'].map(h=>(
                    <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {policy.agentRepudiation.map((r,i)=>(
                    <tr key={i} style={{ borderBottom:`1px solid ${T.borderSubtle}` }}>
                      <td style={{ padding:'9px 14px', fontSize:'12px', fontWeight:700, color:T.primary }}>{r.caseNo}</td>
                      <td style={{ padding:'9px 14px', fontSize:'12px', color:T.textSecondary }}>{r.reason}</td>
                      <td style={{ padding:'9px 14px', fontSize:'12px', color:T.textMuted }}>{r.date}</td>
                      <td style={{ padding:'9px 14px' }}><span style={{ fontSize:'11px', fontWeight:700, padding:'2px 8px', borderRadius:'99px', background:'#FEF2F2', color:'#DC2626' }}>{r.decision}</span></td>
                      <td style={{ padding:'9px 14px', fontSize:'12px', color:T.textMuted }}>{r.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ marginTop:'16px', display:'flex', justifyContent:'flex-end' }}>
            <Btn variant='success' onClick={()=>{ markDone('agent'); onComplete() }}>✓ Complete Demographics</Btn>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCauseModal && <CauseModal causes={causes} onSelect={selectCause} onClose={()=>setShowCauseModal(false)}/>}
      {addingRowFor==='hospital' && <AddRowModal title="Hospital Detail" fields={HOSPITAL_FIELDS} onSave={r=>addRow('hospitalDetails',r)} onClose={()=>setAddingRowFor(null)}/>}
      {addingRowFor==='doctor' && <AddRowModal title="Doctor Detail" fields={DOCTOR_FIELDS} onSave={r=>addRow('doctorDetails',r)} onClose={()=>setAddingRowFor(null)}/>}
      {addingRowFor==='proof' && <AddRowModal title="Proof / Document" fields={PROOF_FIELDS} onSave={r=>addRow('proofDetails',r)} onClose={()=>setAddingRowFor(null)}/>}
      {addingRowFor==='witness'   && <AddRowModal title="Witness Detail"          fields={WITNESS_FIELDS}    onSave={r=>addRow('witnessDetails',r)}   onClose={()=>setAddingRowFor(null)}/>}
      {addingRowFor==='insProof'  && <AddRowModal title="Insurance Proof Detail"  fields={INS_PROOF_FIELDS}  onSave={r=>addRow('insProofDetails',r)}  onClose={()=>setAddingRowFor(null)}/>}
      {addingRowFor==='income'    && <AddRowModal title="Income Document Detail"  fields={INCOME_FIELDS}     onSave={r=>addRow('incomeDetails',r)}    onClose={()=>setAddingRowFor(null)}/>}
    </div>
  )
}

/* ── Claimant Section (inline) ── */
function ClaimantSection({ data, update, policy }) {
  const [sameAsPayee, setSameAsPayee] = useState(false)
  const [form, setForm] = useState({})
  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  const handleSameAsPayee = (checked) => {
    setSameAsPayee(checked)
    if (checked && data.selectedPayeeId) {
      setForm({ clientId:data.payeeClientId, name:data.payeeName, dob:data.payeeDob, gender:data.payeeGender, flat:data.payeeFlat, road:data.payeeRoad, area:data.payeeArea, city:data.payeeCity, state:data.payeeState, pincode:data.payeePincode, mobileNo:data.payeeMobileNo, emailId:data.payeeEmailId, panNo:data.payeePanNo, idNumber:data.payeeIdNumber })
    } else setForm({})
  }

  const addClaimant = () => {
    if (!form.name || !form.mobileNo) return
    update({ claimants:[...(data.claimants||[]), {...form}] })
    setForm({}); setSameAsPayee(false)
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px', padding:'10px 14px', background:'#F0F9FF', borderRadius:'8px', border:'1px solid #BAE6FD' }}>
        <input type="checkbox" id="samePayee" checked={sameAsPayee} onChange={e=>handleSameAsPayee(e.target.checked)} style={{ cursor:'pointer' }}/>
        <label htmlFor="samePayee" style={{ fontSize:'13px', fontWeight:600, color:'#0C4A6E', cursor:'pointer' }}>Same as Payee Details</label>
      </div>
      <Grid cols={3}>
        <Field label="Name" required><Input value={form.name} onChange={e=>set('name',e.target.value)} readOnly={sameAsPayee}/></Field>
        <Field label="Client ID"><Input value={form.clientId} onChange={e=>set('clientId',e.target.value)} readOnly={sameAsPayee}/></Field>
        <Field label="Date of Birth"><Input type="date" value={form.dob} onChange={e=>set('dob',e.target.value)} readOnly={sameAsPayee}/></Field>
        <Field label="Gender" required><Select value={form.gender} onChange={e=>set('gender',e.target.value)} options={['Male','Female','Other']} readOnly={sameAsPayee}/></Field>
        <Field label="Role" required><Select value={form.role} onChange={e=>set('role',e.target.value)} options={['Proposer','Nominee','Appointee','Joint Life','Joint Payee','Life Assured','Others']}/></Field>
        <Field label="Relation with Life Assured" required><Select value={form.relation} onChange={e=>set('relation',e.target.value)} options={['Self','Spouse','Mother','Father','Son','Daughter','Brother','Sister','Relative - Others','Friend','Not Related']}/></Field>
        <Field label="Mobile No" required><Input value={form.mobileNo} onChange={e=>set('mobileNo',e.target.value)} maxLength={10} readOnly={sameAsPayee}/></Field>
        <Field label="Email"><Input type="email" value={form.emailId} onChange={e=>set('emailId',e.target.value)} readOnly={sameAsPayee}/></Field>
        <Field label="PAN No"><Input value={form.panNo} onChange={e=>set('panNo',e.target.value)} readOnly={sameAsPayee}/></Field>
        <Field label="PAN Validity"><Select value={form.panValidFlag} onChange={e=>set('panValidFlag',e.target.value)} options={['Valid','Not Valid','Not Available']}/></Field>
        <Field label="Politically Exposed"><Select value={form.politicallyExposed} onChange={e=>set('politicallyExposed',e.target.value)} options={['Yes','No']}/></Field>
        <Field label="Occupation"><Input value={form.occupation} onChange={e=>set('occupation',e.target.value)} readOnly={sameAsPayee}/></Field>
        <Field label="Flat / House"><Input value={form.flat} onChange={e=>set('flat',e.target.value)} readOnly={sameAsPayee}/></Field>
        <Field label="Road / Street"><Input value={form.road} onChange={e=>set('road',e.target.value)} readOnly={sameAsPayee}/></Field>
        <Field label="Area"><Input value={form.area} onChange={e=>set('area',e.target.value)} readOnly={sameAsPayee}/></Field>
        <Field label="City" required><Input value={form.city} onChange={e=>set('city',e.target.value)} readOnly={sameAsPayee}/></Field>
        <Field label="State"><Select value={form.state} onChange={e=>set('state',e.target.value)} options={states} readOnly={sameAsPayee}/></Field>
        <Field label="Pincode"><Input value={form.pincode} onChange={e=>set('pincode',e.target.value)} maxLength={6} readOnly={sameAsPayee}/></Field>
      </Grid>
      <div style={{ marginTop:'12px', display:'flex', justifyContent:'flex-end' }}>
        <Btn variant='secondary' onClick={addClaimant}>+ Add Claimant to List</Btn>
      </div>
      {(data.claimants||[]).length > 0 && (
        <div style={{ marginTop:'12px', border:`1px solid ${T.border}`, borderRadius:'8px', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
              {['Name','Role','Relation','Mobile','PAN'].map(h=>(
                <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase' }}>{h}</th>
              ))}
              <th style={{ padding:'8px 12px', width:'40px' }}></th>
            </tr></thead>
            <tbody>
              {(data.claimants||[]).map((c,i)=>(
                <tr key={i} style={{ borderBottom:`1px solid ${T.borderSubtle}` }}>
                  <td style={{ padding:'8px 12px', fontSize:'13px', fontWeight:600, color:T.textSecondary }}>{c.name}</td>
                  <td style={{ padding:'8px 12px', fontSize:'12px', color:T.textMuted }}>{c.role}</td>
                  <td style={{ padding:'8px 12px', fontSize:'12px', color:T.textMuted }}>{c.relation}</td>
                  <td style={{ padding:'8px 12px', fontSize:'12px', color:T.textMuted }}>{c.mobileNo}</td>
                  <td style={{ padding:'8px 12px', fontSize:'12px', color:T.textMuted }}>{c.panNo}</td>
                  <td style={{ padding:'8px 12px' }}>
                    <button onClick={()=>update({claimants:(data.claimants||[]).filter((_,idx)=>idx!==i)})} style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444', fontSize:'16px' }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
