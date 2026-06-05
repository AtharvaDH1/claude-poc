import React, { useState, useEffect } from 'react'
import { SubTabNav, Btn, T } from './shared'
import { useToast } from '../../components/Toast'
import { validateRequirements, showValidationToast } from '../../util/registrationValidation'
import { getSystemRequirementService, requirementMasterService } from '../../services/statesService'

const REQ_DOCS = {
  General: [
    { id:1,  name:'Original Death Certificate',            required:true  },
    { id:2,  name:'Policy Document (Original)',            required:true  },
    { id:3,  name:'Claimant Photo ID Proof (Aadhaar/PAN)', required:true  },
    { id:4,  name:'Cancelled Cheque / Bank Details',       required:true  },
    { id:5,  name:'Nominee ID Proof',                      required:false },
    { id:6,  name:'Medical / Treatment Records',           required:false },
    { id:7,  name:'NEFT / Bank Account Proof',             required:true  },
  ],
  Additional: [
    { id:8,  name:'FIR Copy (if accidental)',              required:false },
    { id:9,  name:'Post Mortem Report',                    required:false },
    { id:10, name:'Hospital Discharge Summary',            required:false },
    { id:11, name:'Employer Certificate',                  required:false },
    { id:12, name:'Income Proof (last 3 years)',           required:false },
    { id:13, name:'Inquest Report (if applicable)',        required:false },
  ],
  Supporting: [
    { id:14, name:'Witness Statement',                     required:false },
    { id:15, name:'Newspaper Cutting (if relevant)',       required:false },
    { id:16, name:'Agent Statement',                       required:false },
    { id:17, name:'Viscera Report (if applicable)',        required:false },
    { id:18, name:'Driving Licence Copy',                  required:false },
  ],
}

export default function RequirementsTab({ data, update, onComplete, userRole }) {
  const toast = useToast()
  const [subTab, setSubTab] = useState('General')
  const [reqDocs, setReqDocs] = useState(REQ_DOCS)
  const [loadingReq, setLoadingReq] = useState(false)
  const showCommTab = userRole && userRole !== 'Pre Assessor'

  const reqStatus = data.reqStatus || {}
  const reqRemarks = data.reqRemarks || {}

  useEffect(() => {
    requirementMasterService().then((master) => {
      if (!Array.isArray(master) || !master.length) return
      const general = master.filter((m) => (m.category || m.CATEGORY || 'General') === 'General').map((m, i) => ({
        id: m.id || i + 1,
        name: m.document_name || m.DOCUMENT_NAME || m.name,
        required: m.mandatory === 'Y' || m.MANDATORY === 'Y' || m.required,
      }))
      if (general.length) setReqDocs((prev) => ({ ...prev, General: general }))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!data.portfolioType || !data.claimRegistrationType) return
    setLoadingReq(true)
    getSystemRequirementService(
      data.portfolioType,
      data.claimRegistrationType || data.causeSubType,
      data.premiumStatus || 'Active',
      data.sumAssured
    ).then((sys) => {
      const list = sys?.requirements || sys?.data || sys
      if (!Array.isArray(list) || !list.length) return
      const additional = list.map((m, i) => ({
        id: 100 + i,
        name: m.document_name || m.name || m.DOCUMENT_NAME,
        required: m.mandatory === 'Y' || m.required,
      }))
      setReqDocs((prev) => ({ ...prev, Additional: additional }))
      toast('success', 'Requirements loaded', 'System requirements applied from portfolio rules.')
    }).catch(() => {})
      .finally(() => setLoadingReq(false))
  }, [data.portfolioType, data.claimRegistrationType, data.sumAssured])

  const setStatus = (id, val) => update({ reqStatus:{ ...reqStatus, [id]:val } })
  const setRemark = (id, val) => update({ reqRemarks:{ ...reqRemarks, [id]:val } })

  const markAllReceived = () => {
    const updated = { ...reqStatus }
    (reqDocs[subTab] || []).forEach(d => { updated[d.id] = 'Received' })
    update({ reqStatus: updated })
    toast('success','Updated', `All ${subTab} documents marked as Received.`)
  }

  const allDocs = Object.values(reqDocs).flat()
  const received = allDocs.filter(d => reqStatus[d.id] === 'Received').length
  const mandatoryDocs = allDocs.filter(d => d.required)
  const mandatoryReceived = mandatoryDocs.filter(d => reqStatus[d.id] === 'Received').length

  const statusColor = (s) => ({
    Received: { bg:'#ECFDF5', color:'#059669', border:'#A7F3D0' },
    Pending:  { bg:'#FFFBEB', color:'#D97706', border:'#FDE68A' },
    Waived:   { bg:'#EFF6FF', color:T.primary, border:'#BFDBFE' },
    NA:       { bg:'#F8FAFC', color:T.textSubtle, border:T.border },
  }[s] || { bg:'#FFFBEB', color:'#D97706', border:'#FDE68A' })

  return (
    <div style={{ padding:'24px' }}>
      {/* Progress */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px' }}>
        {[
          { label:'Total Documents', value:allDocs.length, color:T.primary, bg:'#EFF6FF' },
          { label:'Received', value:received, color:'#059669', bg:'#ECFDF5' },
          { label:'Mandatory Received', value:`${mandatoryReceived}/${mandatoryDocs.length}`, color: mandatoryReceived===mandatoryDocs.length?'#059669':'#D97706', bg: mandatoryReceived===mandatoryDocs.length?'#ECFDF5':'#FFFBEB' },
        ].map(s=>(
          <div key={s.label} style={{ padding:'14px 16px', background:s.bg, borderRadius:'10px', border:`1px solid ${s.color}30` }}>
            <div style={{ fontSize:'24px', fontWeight:900, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:'11px', fontWeight:700, color:s.color, opacity:0.7, marginTop:'3px', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loadingReq && <div style={{ fontSize:'12px', color:T.textMuted, marginBottom:'12px' }}>Loading system requirements…</div>}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
        <SubTabNav
          tabs={showCommTab ? ['General','Additional','Supporting','Communication'] : ['General','Additional','Supporting']}
          active={subTab}
          onChange={setSubTab}
        />
        {subTab !== 'Communication' && <Btn variant='secondary' size='sm' onClick={markAllReceived}>✓ Mark All Received</Btn>}
      </div>

      <div style={{ border:`1px solid ${T.border}`, borderRadius:'10px', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
              {['#','Document Name','Required','Status','Remarks / Action'].map(h=>(
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(reqDocs[subTab] || []).map((doc, i) => {
              const s = reqStatus[doc.id] || 'Pending'
              const sc = statusColor(s)
              return (
                <tr key={doc.id} style={{ borderBottom:`1px solid ${T.borderSubtle}`, background: i%2===0?'#FAFAFA':'#fff', transition:'background 0.1s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#F0F6FF'} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#FAFAFA':'#fff'}>
                  <td style={{ padding:'12px 14px', fontSize:'12px', fontWeight:700, color:T.textSubtle }}>{i+1}</td>
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ fontSize:'13px', fontWeight:600, color:T.textSecondary }}>{doc.name}</div>
                  </td>
                  <td style={{ padding:'12px 14px' }}>
                    <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'99px', background: doc.required?'#FEF2F2':'#F8FAFC', color: doc.required?'#DC2626':T.textSubtle, border:`1px solid ${doc.required?'#FECACA':T.border}` }}>
                      {doc.required ? 'Mandatory' : 'Optional'}
                    </span>
                  </td>
                  <td style={{ padding:'12px 14px' }}>
                    <select value={s} onChange={e=>setStatus(doc.id, e.target.value)}
                      style={{ padding:'5px 10px', borderRadius:'7px', border:`1.5px solid ${sc.border}`, background:sc.bg, fontSize:'12px', fontWeight:700, color:sc.color, fontFamily:'Inter,sans-serif', cursor:'pointer', outline:'none' }}>
                      <option value='Pending'>Pending</option>
                      <option value='Received'>Received</option>
                      <option value='Waived'>Waived</option>
                      <option value='NA'>N/A</option>
                    </select>
                  </td>
                  <td style={{ padding:'12px 14px' }}>
                    <input value={reqRemarks[doc.id]||''} onChange={e=>setRemark(doc.id, e.target.value)} placeholder="Add remark..."
                      style={{ width:'100%', padding:'6px 10px', border:`1px solid ${T.border}`, borderRadius:'6px', fontSize:'12px', fontFamily:'Inter,sans-serif', outline:'none', background:'#F8FAFC', boxSizing:'border-box' }}
                      onFocus={e=>{ e.target.style.borderColor=T.primary; e.target.style.background='#fff' }}
                      onBlur={e=>{ e.target.style.borderColor=T.border; e.target.style.background='#F8FAFC' }}/>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Communication tab content — shown only for Assessor/Verifier */}
      {subTab === 'Communication' && showCommTab && (
        <div style={{ padding:'4px 0 16px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            {[
              { key:'commEmailSent',     label:'Email Sent to Claimant',     type:'select', opts:['Yes','No','Pending'] },
              { key:'commEmailDate',     label:'Email Sent Date',             type:'date' },
              { key:'commSmsSent',       label:'SMS Sent to Claimant',        type:'select', opts:['Yes','No','Pending'] },
              { key:'commSmsDate',       label:'SMS Sent Date',               type:'date' },
              { key:'commLetterSent',    label:'Letter Dispatched',           type:'select', opts:['Yes','No','Pending'] },
              { key:'commLetterDate',    label:'Letter Dispatch Date',        type:'date' },
              { key:'commWhatsapp',      label:'WhatsApp Notified',           type:'select', opts:['Yes','No','NA'] },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#334155', marginBottom:'5px' }}>{f.label}</label>
                {f.type === 'select' ? (
                  <select value={data[f.key]||''} onChange={e=>update({[f.key]:e.target.value})}
                    style={{ width:'100%', height:'38px', padding:'0 10px', border:`1.5px solid ${T.border}`, borderRadius:'7px', background:'#fff', fontSize:'13px', fontFamily:'Inter,sans-serif', outline:'none', cursor:'pointer' }}>
                    <option value=''>-- Select --</option>
                    {f.opts.map(o=><option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={f.type} value={data[f.key]||''} onChange={e=>update({[f.key]:e.target.value})}
                    style={{ width:'100%', height:'38px', padding:'0 10px', border:`1.5px solid ${T.border}`, borderRadius:'7px', background:'#F8FAFC', fontSize:'13px', fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }}/>
                )}
              </div>
            ))}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#334155', marginBottom:'5px' }}>Communication Remarks</label>
              <textarea value={data.commRemarks||''} onChange={e=>update({commRemarks:e.target.value})} rows={3} placeholder="Enter communication details..."
                style={{ width:'100%', padding:'8px 10px', border:`1.5px solid ${T.border}`, borderRadius:'7px', background:'#F8FAFC', fontSize:'13px', fontFamily:'Inter,sans-serif', outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop:'20px', paddingTop:'16px', borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'flex-end', gap:'10px' }}>
        {mandatoryReceived < mandatoryDocs.length && subTab !== 'Communication' && (
          <div style={{ marginRight:'auto', fontSize:'12px', fontWeight:600, color:'#D97706', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'8px', padding:'8px 14px', display:'flex', alignItems:'center' }}>
            ⚠️ {mandatoryDocs.length - mandatoryReceived} mandatory document(s) still pending
          </div>
        )}
        <Btn variant='success' onClick={() => {
          const { valid, missing } = validateRequirements(data, { allDocs })
          if (!valid) {
            showValidationToast(toast, missing, 'Requirements incomplete')
            return
          }
          update({ _requirementsComplete: true })
          onComplete()
        }}>✓ Complete Requirements →</Btn>
      </div>
    </div>
  )
}
