import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../context/AuthContext'
import { Search, UserPlus, Upload, Layers, CheckSquare, X, FileText, Eye } from 'lucide-react'
import { searchCaseTableData } from '../services/add/searchCaseData'
import { AssessmentPool } from '../services/add/AssessmentPool'
import { ExcelUploaderService } from '../services/add/DataEntryUploadService'

function mapCaseRow(row) {
  const caseId = row.case_id || row.CASE_ID || row.id
  return {
    caseId: caseId || '—',
    claimId: row.claim_number || row.claim_id || row.policy_number || row.policy_no || '—',
    claimant: row.claimant_name || row.policy_holder || row.holder_name || row.source || '—',
    type: row.claim_type || row.product_code || '—',
    registeredDate: (row.referral_date || row.trigger_date || row.created_at || '').toString().split('T')[0],
    assignedTo: row.assigned_to || row.assigned_user || row.username || 'Unassigned',
    status: row.case_status || row.status || 'Open',
  }
}

function mapPoolRow(row) {
  return {
    claimId: row.claim_number || row.CLAIM_NUMBER || row.case_id || '—',
    policyId: row.policy_number || row.policy_no || row.POLICY_NUMBER || '—',
    claimant: row.claimant_name || row.claimant || '—',
    type: row.claim_type || row.product_code || '—',
    priority: row.priority || 'Normal',
    daysOpen: row.scn_aging || row.days_open || 0,
    status: row.case_status || 'Pending',
  }
}

function extractCaseRows(result) {
  if (result?.success && Array.isArray(result.data)) return result.data
  if (Array.isArray(result?.data)) return result.data
  if (Array.isArray(result)) return result
  return []
}

const T = {
  primary:'#1D4ED8', primaryHover:'#1E40AF',
  card:'#FFFFFF', border:'#E2E8F0', borderSubtle:'#F1F5F9',
  textPrimary:'#0F172A', textSecondary:'#334155', textMuted:'#64748B', textSubtle:'#94A3B8',
}

const TABS = [
  { id:'case-search',   label:'Case Search',         icon: Search    },
  { id:'assignment',    label:'Case Assignment',      icon: UserPlus  },
  { id:'uploader',      label:'Data Uploader',        icon: Upload    },
  { id:'assess-pool',   label:'Assessment Pool',      icon: Layers    },
  { id:'approver-pool', label:'Approver Pool',        icon: CheckSquare },
]

function TabNav({ active, setActive }) {
  return (
    <div style={{ display:'flex', borderBottom:`1px solid ${T.border}`, background:T.card }}>
      {TABS.map(tab => (
        <button key={tab.id} onClick={()=>setActive(tab.id)}
          style={{ display:'flex', alignItems:'center', gap:'7px', padding:'14px 18px', border:'none', borderBottom: active===tab.id?`2px solid ${T.primary}`:'2px solid transparent', background:'transparent', cursor:'pointer', fontFamily:'Inter,sans-serif', color: active===tab.id?T.primary:T.textMuted, fontSize:'13px', fontWeight: active===tab.id?700:500, transition:'all 0.15s', marginBottom:'-1px' }}
          onMouseEnter={e=>{ if(active!==tab.id) e.currentTarget.style.color=T.textSecondary }}
          onMouseLeave={e=>{ if(active!==tab.id) e.currentTarget.style.color=T.textMuted }}>
          <tab.icon size={14}/>
          {tab.label}
        </button>
      ))}
    </div>
  )
}

const CASE_SUB_TABS = ['Demographics','Assessment','Decisions','Requirement & Comm']

function CaseDetailDrawer({ c, onClose }) {
  const [subTab, setSubTab] = useState('Demographics')

  const tabContent = {
    Demographics: (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>
        {[['Case ID',c.caseId],['Claim ID',c.claimId],['Claimant',c.claimant],['Type',c.type],['Registered',c.registeredDate],['Assigned To',c.assignedTo],['Status',c.status]].map(([k,v])=>(
          <div key={k}><div style={{ fontSize:'10px',fontWeight:700,color:T.textSubtle,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'3px' }}>{k}</div><div style={{ fontSize:'13px',fontWeight:600,color:T.textSecondary,padding:'7px 10px',background:'#F8FAFC',borderRadius:'6px',border:`1px solid ${T.border}` }}>{v||'—'}</div></div>
        ))}
      </div>
    ),
    Assessment: (
      <div style={{ color:T.textMuted, fontSize:'13px', padding:'16px', background:'#FAFAFA', borderRadius:'8px', border:`1px solid ${T.border}` }}>
        Assessment details for {c.claimId} will load here from the backend. Status: <strong style={{ color:T.primary }}>{c.status}</strong>
      </div>
    ),
    Decisions: (
      <div style={{ color:T.textMuted, fontSize:'13px', padding:'16px', background:'#FAFAFA', borderRadius:'8px', border:`1px solid ${T.border}` }}>
        Decision records for {c.claimId}. Assigned to: <strong style={{ color:T.textPrimary }}>{c.assignedTo}</strong>
      </div>
    ),
    'Requirement & Comm': (
      <div style={{ color:T.textMuted, fontSize:'13px', padding:'16px', background:'#FAFAFA', borderRadius:'8px', border:`1px solid ${T.border}` }}>
        Requirement and communication tracking for {c.claimId}.
      </div>
    ),
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:100, display:'flex', alignItems:'flex-end', justifyContent:'flex-end' }} onClick={onClose}>
      <div style={{ width:'560px', height:'100vh', background:'#fff', boxShadow:'-8px 0 32px rgba(0,0,0,0.15)', display:'flex', flexDirection:'column', animation:'slideIn 0.25s ease' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:'#FAFAFA' }}>
          <div>
            <div style={{ fontWeight:800, fontSize:'15px', color:T.textPrimary }}>{c.caseId} — {c.claimId}</div>
            <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'2px' }}>{c.claimant} · {c.type}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'22px', color:T.textMuted }}>×</button>
        </div>
        <div style={{ display:'flex', borderBottom:`1px solid ${T.border}`, padding:'0 16px' }}>
          {CASE_SUB_TABS.map(t=>(
            <button key={t} onClick={()=>setSubTab(t)} style={{ padding:'12px 14px', border:'none', borderBottom: subTab===t?`2px solid ${T.primary}`:'2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'12px', fontWeight:subTab===t?700:500, color:subTab===t?T.primary:T.textMuted, fontFamily:'Inter,sans-serif', whiteSpace:'nowrap', marginBottom:'-1px' }}>
              {t}
            </button>
          ))}
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
          {tabContent[subTab]}
        </div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </div>
  )
}

function CaseSearch({ toast }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [assigned, setAssigned] = useState({})
  const [openCase, setOpenCase] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    searchCaseTableData('case_status', 'Open', 50, 0)
      .then(result => setResults(extractCaseRows(result).map(mapCaseRow)))
      .catch(() => toast('error', 'Load Failed', 'Could not load cases.'))
      .finally(() => setLoading(false))
  }, [toast])

  const filtered = results.filter(c =>
    !q || c.claimId.toLowerCase().includes(q.toLowerCase()) || c.claimant.toLowerCase().includes(q.toLowerCase())
  )

  const handleAssign = (c) => {
    setAssigned(p => ({ ...p, [c.caseId]: true }))
    toast('success', 'Case Assigned', `${c.claimId} has been assigned to you.`)
  }

  return (
    <div style={{ padding:'24px' }}>
      <div style={{ display:'flex', gap:'10px', marginBottom:'20px' }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:'8px', padding:'0 14px', height:'42px', borderRadius:'8px', background:'#F8FAFC', border:`1.5px solid ${T.border}` }}>
          <Search size={15} style={{ color:T.textSubtle }}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by Case ID or Claimant..."
            style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'13px', color:T.textPrimary, fontWeight:500, fontFamily:'Inter,sans-serif' }}/>
          {q && <button onClick={()=>setQ('')} style={{ background:'none', border:'none', cursor:'pointer', color:T.textSubtle, display:'flex' }}><X size={13}/></button>}
        </div>
      </div>
      {loading ? (
        <div style={{ padding:'40px', textAlign:'center', color:T.textMuted, fontSize:'13px' }}>Loading cases...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:'40px', textAlign:'center', color:T.textMuted, fontSize:'13px' }}>No cases found.</div>
      ) : (
      <table style={{ width:'100%', borderCollapse:'collapse', background:T.card, borderRadius:'10px', overflow:'hidden', border:`1px solid ${T.border}` }}>
        <thead>
          <tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
            {['Case ID','Claim ID','Claimant','Type','Registered','Assigned To','Status','Action'].map(h=>(
              <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((c,i)=>(
            <tr key={c.caseId} style={{ borderBottom:`1px solid ${T.borderSubtle}`, transition:'background 0.1s' }}
              onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'} onMouseLeave={e=>e.currentTarget.style.background=''}>
              <td style={{ padding:'11px 14px', fontSize:'12px', fontWeight:700, color:T.primary, fontFamily:'monospace' }}>{c.caseId}</td>
              <td style={{ padding:'11px 14px', fontSize:'12px', fontWeight:700, color:'#7C3AED', fontFamily:'monospace' }}>{c.claimId}</td>
              <td style={{ padding:'11px 14px', fontSize:'13px', fontWeight:600, color:T.textSecondary }}>{c.claimant}</td>
              <td style={{ padding:'11px 14px', fontSize:'12px', color:T.textMuted }}>{c.type}</td>
              <td style={{ padding:'11px 14px', fontSize:'12px', color:T.textMuted }}>{c.registeredDate}</td>
              <td style={{ padding:'11px 14px', fontSize:'12px', color: c.assignedTo==='Unassigned'?T.textSubtle:T.textSecondary, fontWeight: c.assignedTo==='Unassigned'?400:600 }}>{c.assignedTo}</td>
              <td style={{ padding:'11px 14px' }}>
                <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'6px', background: c.status==='Open'?'#EFF6FF': c.status==='In Progress'?'#FFFBEB':'#ECFDF5', color: c.status==='Open'?T.primary: c.status==='In Progress'?'#D97706':'#059669' }}>{c.status}</span>
              </td>
              <td style={{ padding:'11px 14px' }}>
                <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                  <button onClick={()=>setOpenCase(c)} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'6px', border:`1px solid ${T.border}`, background:'#F8FAFC', color:T.textSecondary, fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s' }}
                    onMouseEnter={e=>{ e.currentTarget.style.background='#EFF6FF'; e.currentTarget.style.color=T.primary }} onMouseLeave={e=>{ e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.color=T.textSecondary }}>
                    <Eye size={11}/> View
                  </button>
                  {assigned[c.caseId] ? (
                    <span style={{ fontSize:'12px', fontWeight:700, color:'#059669' }}>✓</span>
                  ) : (
                    <button onClick={()=>handleAssign(c)} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'6px', border:'none', background:T.primary, color:'#fff', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background=T.primaryHover} onMouseLeave={e=>e.currentTarget.style.background=T.primary}>
                      <UserPlus size={11}/> Assign
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
      {openCase && <CaseDetailDrawer c={openCase} onClose={()=>setOpenCase(null)}/>}
    </div>
  )
}

function CaseAssignment({ toast }) {
  const [unassigned, setUnassigned] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    searchCaseTableData('case_status', 'Open', 50, 0)
      .then(result => {
        setUnassigned(extractCaseRows(result).map(mapCaseRow).filter(c => c.assignedTo === 'Unassigned'))
      })
      .catch(() => toast('error', 'Load Failed', 'Could not load unassigned cases.'))
      .finally(() => setLoading(false))
  }, [toast])

  const handleAssignSelf = c => {
    setUnassigned(p => p.filter(x=>x.caseId!==c.caseId))
    toast('success','Case Assigned',`${c.claimId} assigned to you and added to My Tasks.`)
  }

  return (
    <div style={{ padding:'24px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
        <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary }}>Unassigned Cases</div>
        <span style={{ fontSize:'12px', fontWeight:700, color:'#D97706', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'99px', padding:'3px 10px' }}>{unassigned.length} pending</span>
      </div>
      {loading ? (
        <div style={{ padding:'40px', textAlign:'center', color:T.textMuted, fontSize:'13px' }}>Loading unassigned cases...</div>
      ) : unassigned.length === 0 ? (
        <div style={{ padding:'48px', textAlign:'center', background:'#ECFDF5', borderRadius:'10px', border:'1px solid #A7F3D0' }}>
          <div style={{ fontSize:'32px', marginBottom:'8px' }}>✅</div>
          <div style={{ fontWeight:700, color:'#059669' }}>All cases assigned!</div>
        </div>
      ) : (
        <table style={{ width:'100%', borderCollapse:'collapse', background:T.card, borderRadius:'10px', overflow:'hidden', border:`1px solid ${T.border}` }}>
          <thead>
            <tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
              {['Claim ID','Claimant','Type','Registered','Action'].map(h=>(
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {unassigned.map(c=>(
              <tr key={c.caseId} style={{ borderBottom:`1px solid ${T.borderSubtle}`, transition:'background 0.1s' }}
                onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                <td style={{ padding:'12px 14px', fontSize:'12px', fontWeight:700, color:T.primary, fontFamily:'monospace' }}>{c.claimId}</td>
                <td style={{ padding:'12px 14px', fontSize:'13px', fontWeight:600, color:T.textSecondary }}>{c.claimant}</td>
                <td style={{ padding:'12px 14px', fontSize:'12px', color:T.textMuted }}>{c.type}</td>
                <td style={{ padding:'12px 14px', fontSize:'12px', color:T.textMuted }}>{c.registeredDate}</td>
                <td style={{ padding:'12px 14px' }}>
                  <button onClick={()=>handleAssignSelf(c)} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 14px', borderRadius:'7px', border:'none', background:T.primary, color:'#fff', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background=T.primaryHover} onMouseLeave={e=>e.currentTarget.style.background=T.primary}>
                    <UserPlus size={11}/> Assign to Self
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function DataUploader({ toast }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  const handleUpload = async () => {
    if (!file) { toast('warning','No File','Please select or drop a file first.'); return }
    setUploading(true)
    try {
      await ExcelUploaderService(file)
      setUploaded(true)
      toast('success','Upload Complete',`${file.name} processed successfully.`)
    } catch {
      toast('error', 'Upload Failed', 'Could not process the uploaded file.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ padding:'24px' }}>
      <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary, marginBottom:'4px' }}>Bulk Data Upload</div>
      <div style={{ fontSize:'12px', color:T.textMuted, marginBottom:'20px' }}>Upload a CSV or Excel file to import multiple claim records at once.</div>

      <div
        onDragOver={e=>{ e.preventDefault(); setDragging(true) }}
        onDragLeave={()=>setDragging(false)}
        onDrop={e=>{ e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files[0]) }}
        style={{ border:`2px dashed ${dragging?T.primary:'#CBD5E1'}`, borderRadius:'14px', padding:'52px 24px', textAlign:'center', background:dragging?'#EFF6FF':'#FAFAFA', transition:'all 0.2s', cursor:'pointer', marginBottom:'16px' }}
        onClick={()=>document.getElementById('file-input').click()}>
        <div style={{ fontSize:'36px', marginBottom:'14px' }}>📂</div>
        <div style={{ fontWeight:700, fontSize:'15px', color:T.textPrimary, marginBottom:'6px' }}>
          {file ? file.name : 'Drop file here or click to browse'}
        </div>
        <div style={{ fontSize:'12px', color:T.textMuted }}>Supports .csv, .xlsx, .xls — Max 10MB</div>
        <input id="file-input" type="file" accept=".csv,.xlsx,.xls" style={{ display:'none' }} onChange={e=>setFile(e.target.files[0])}/>
      </div>

      {uploaded ? (
        <div style={{ padding:'16px', borderRadius:'10px', background:'#ECFDF5', border:'1px solid #A7F3D0', display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#059669', display:'flex', alignItems:'center', justifyContent:'center' }}><CheckSquare size={16} color="#fff"/></div>
          <div>
            <div style={{ fontWeight:700, color:'#065F46', fontSize:'13px' }}>Upload Successful</div>
            <div style={{ fontSize:'12px', color:'#047857', marginTop:'2px' }}>{file?.name} has been processed.</div>
          </div>
        </div>
      ) : (
        <button onClick={handleUpload} disabled={uploading}
          style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 24px', borderRadius:'8px', border:'none', background:T.primary, color:'#fff', fontSize:'13px', fontWeight:700, cursor:uploading?'wait':'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 4px 12px rgba(29,78,216,0.3)', transition:'all 0.15s' }}>
          {uploading ? (
            <><svg style={{ width:'15px', height:'15px', animation:'spin 0.8s linear infinite' }} fill="none" viewBox="0 0 24 24"><circle opacity="0.25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path opacity="0.75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Uploading...</>
          ) : <><Upload size={14}/>Upload File</>}
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function PoolTable({ type, toast }) {
  const [pool, setPool] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    AssessmentPool(null, null, type === 'Approver' ? 'Y' : 'N', 0, 50)
      .then(result => {
        const rows = Array.isArray(result?.data) ? result.data : extractCaseRows(result)
        setPool(rows.map(mapPoolRow))
      })
      .catch(() => toast('error', 'Load Failed', `Could not load ${type} pool.`))
      .finally(() => setLoading(false))
  }, [type, toast])

  return (
    <div style={{ padding:'24px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
        <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary }}>{type} Queue</div>
        <span style={{ fontSize:'12px', fontWeight:700, color:T.primary, background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'99px', padding:'3px 10px' }}>{pool.length} in queue</span>
      </div>
      {loading ? (
        <div style={{ padding:'40px', textAlign:'center', color:T.textMuted, fontSize:'13px' }}>Loading pool...</div>
      ) : pool.length === 0 ? (
        <div style={{ padding:'40px', textAlign:'center', color:T.textMuted, fontSize:'13px' }}>No cases in queue.</div>
      ) : (
      <table style={{ width:'100%', borderCollapse:'collapse', background:T.card, borderRadius:'10px', overflow:'hidden', border:`1px solid ${T.border}` }}>
        <thead>
          <tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
            {['Claim ID','Policy ID','Claimant','Type','Priority','Days Open','Status'].map(h=>(
              <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pool.map(item=>(
            <tr key={item.claimId} style={{ borderBottom:`1px solid ${T.borderSubtle}`, transition:'background 0.1s' }}
              onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'} onMouseLeave={e=>e.currentTarget.style.background=''}>
              <td style={{ padding:'11px 14px', fontSize:'12px', fontWeight:700, color:T.primary, fontFamily:'monospace' }}>{item.claimId}</td>
              <td style={{ padding:'11px 14px', fontSize:'12px', color:T.textMuted, fontFamily:'monospace' }}>{item.policyId}</td>
              <td style={{ padding:'11px 14px', fontSize:'13px', fontWeight:600, color:T.textSecondary }}>{item.claimant}</td>
              <td style={{ padding:'11px 14px', fontSize:'12px', color:T.textMuted }}>{item.type}</td>
              <td style={{ padding:'11px 14px' }}>
                <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'6px', background: item.priority==='High'?'#FEF2F2':'#ECFDF5', color: item.priority==='High'?'#DC2626':'#059669' }}>{item.priority}</span>
              </td>
              <td style={{ padding:'11px 14px', fontSize:'12px', fontWeight:700, color: item.daysOpen>10?'#DC2626':T.textMuted }}>{item.daysOpen}d {item.daysOpen>10?'⚠️':''}</td>
              <td style={{ padding:'11px 14px' }}>
                <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'6px', background:'#FFFBEB', color:'#D97706' }}>Pending</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  )
}

export default function AddScreen() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('case-search')

  return (
    <AppLayout>
      <div style={{ padding:'24px', fontFamily:'Inter,sans-serif' }}>
        <div style={{ marginBottom:'24px' }}>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:T.textPrimary, letterSpacing:'-0.02em', margin:'0 0 4px' }}>Add Screen</h1>
          <p style={{ fontSize:'13px', color:T.textMuted, fontWeight:500 }}>Case management, assignment, and pool operations.</p>
        </div>

        <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <TabNav active={activeTab} setActive={setActiveTab}/>

          {activeTab === 'case-search'   && <CaseSearch toast={toast}/>}
          {activeTab === 'assignment'    && <CaseAssignment toast={toast}/>}
          {activeTab === 'uploader'      && <DataUploader toast={toast}/>}
          {activeTab === 'assess-pool'   && <PoolTable type="Assessment" toast={toast}/>}
          {activeTab === 'approver-pool' && <PoolTable type="Approver" toast={toast}/>}
        </div>
      </div>
    </AppLayout>
  )
}
