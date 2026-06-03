import { useState, useRef } from 'react'
import { useToast } from './Toast'

const T = { primary:'#1D4ED8', border:'#E2E8F0', borderSubtle:'#F1F5F9', textPrimary:'#0F172A', textSecondary:'#334155', textMuted:'#64748B', textSubtle:'#94A3B8' }

const FILE_ICONS = { pdf:'📄', jpg:'🖼️', jpeg:'🖼️', png:'🖼️', doc:'📝', docx:'📝', xls:'📊', xlsx:'📊', default:'📎' }
const getIcon = name => FILE_ICONS[name.split('.').pop()?.toLowerCase()] || FILE_ICONS.default
const fmtSize = b => b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(1)}KB` : `${(b/1048576).toFixed(1)}MB`

export default function DocumentUpload({ claimId, label = 'Claim Documents' }) {
  const toast = useToast()
  const inputRef = useRef(null)
  const [docs, setDocs] = useState([
    { id:1, name:'Death_Certificate.pdf', size:245760, type:'Death Certificate', status:'Uploaded', uploadedBy:'Priya Sharma', uploadedOn:'2025-05-28', url:'#' },
    { id:2, name:'Policy_Document.pdf',   size:512000, type:'Policy Document',   status:'Uploaded', uploadedBy:'Priya Sharma', uploadedOn:'2025-05-28', url:'#' },
  ])
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const handleFiles = (files) => {
    const allowed = ['pdf','jpg','jpeg','png','doc','docx','xls','xlsx']
    const valid = Array.from(files).filter(f => allowed.includes(f.name.split('.').pop().toLowerCase()))
    if (valid.length === 0) { toast('error','Invalid File','Only PDF, Word, Excel and image files allowed.'); return }
    if (valid.some(f => f.size > 10*1024*1024)) { toast('warning','File Too Large','Max file size is 10MB.'); return }

    setUploading(true)
    setTimeout(() => {
      const newDocs = valid.map((f, i) => ({
        id: Date.now() + i, name: f.name, size: f.size, type: 'Supporting Document',
        status: 'Uploaded', uploadedBy: 'Current User', uploadedOn: new Date().toISOString().split('T')[0], url: '#',
      }))
      setDocs(p => [...p, ...newDocs])
      setUploading(false)
      toast('success', 'Upload Complete', `${valid.length} file(s) uploaded successfully.`)
    }, 1500)
  }

  const confirmDelete = () => {
    setDocs(p => p.filter(d => d.id !== deleteId))
    toast('success', 'Deleted', 'Document removed.')
    setDeleteId(null)
  }

  return (
    <div style={{ fontFamily:'Inter,sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
        <div>
          <div style={{ fontSize:'14px', fontWeight:700, color:T.textPrimary }}>{label}</div>
          <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'2px' }}>{docs.length} document(s) attached</div>
        </div>
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 16px', borderRadius:'8px', border:'none', background:T.primary, color:'#fff', fontSize:'13px', fontWeight:700, cursor:uploading?'wait':'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s', boxShadow:'0 3px 10px rgba(29,78,216,0.25)' }}>
          {uploading ? '⏳ Uploading...' : '+ Upload Document'}
        </button>
        <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" style={{ display:'none' }} onChange={e => handleFiles(e.target.files)}/>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        style={{ border:`2px dashed ${dragging?T.primary:'#CBD5E1'}`, borderRadius:'10px', padding:'24px', textAlign:'center', background:dragging?'#EFF6FF':'#FAFAFA', cursor:'pointer', transition:'all 0.2s', marginBottom:'16px' }}>
        <div style={{ fontSize:'24px', marginBottom:'8px' }}>📂</div>
        <div style={{ fontSize:'13px', fontWeight:600, color:T.textMuted }}>Drop files here or click to browse</div>
        <div style={{ fontSize:'11px', color:T.textSubtle, marginTop:'4px' }}>PDF, Word, Excel, Images · Max 10MB per file</div>
      </div>

      {/* Document list */}
      {docs.length > 0 && (
        <div style={{ border:`1px solid ${T.border}`, borderRadius:'10px', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
                {['Document','Type','Size','Uploaded By','Date','Action'].map(h => (
                  <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, i) => (
                <tr key={doc.id} style={{ borderBottom:`1px solid ${T.borderSubtle}`, background:i%2===0?'#FAFAFA':'#fff', transition:'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#EFF6FF'} onMouseLeave={e => e.currentTarget.style.background=i%2===0?'#FAFAFA':'#fff'}>
                  <td style={{ padding:'10px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ fontSize:'18px' }}>{getIcon(doc.name)}</span>
                      <a href={doc.url} onClick={e => e.preventDefault()} style={{ fontSize:'13px', fontWeight:600, color:T.primary, textDecoration:'none', cursor:'pointer' }}
                        onMouseEnter={e => e.target.style.textDecoration='underline'} onMouseLeave={e => e.target.style.textDecoration='none'}>
                        {doc.name}
                      </a>
                    </div>
                  </td>
                  <td style={{ padding:'10px 14px' }}><span style={{ fontSize:'11px', fontWeight:700, padding:'2px 8px', borderRadius:'6px', background:'#EFF6FF', color:T.primary }}>{doc.type}</span></td>
                  <td style={{ padding:'10px 14px', fontSize:'12px', color:T.textMuted }}>{fmtSize(doc.size)}</td>
                  <td style={{ padding:'10px 14px', fontSize:'12px', color:T.textMuted }}>{doc.uploadedBy}</td>
                  <td style={{ padding:'10px 14px', fontSize:'12px', color:T.textMuted }}>{doc.uploadedOn}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <div style={{ display:'flex', gap:'6px' }}>
                      <button title="View" style={{ width:'28px', height:'28px', borderRadius:'6px', border:`1px solid ${T.border}`, background:'#F8FAFC', cursor:'pointer', fontSize:'13px', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background='#EFF6FF'; e.currentTarget.style.borderColor='#93C5FD' }} onMouseLeave={e => { e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.borderColor=T.border }}>👁️</button>
                      <button onClick={() => setDeleteId(doc.id)} title="Delete" style={{ width:'28px', height:'28px', borderRadius:'6px', border:`1px solid ${T.border}`, background:'#F8FAFC', cursor:'pointer', fontSize:'13px', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background='#FEF2F2'; e.currentTarget.style.borderColor='#FCA5A5' }} onMouseLeave={e => { e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.borderColor=T.border }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(2px)' }}>
          <div style={{ background:'#fff', borderRadius:'14px', padding:'28px', width:'360px', boxShadow:'0 20px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize:'32px', marginBottom:'12px' }}>🗑️</div>
            <div style={{ fontWeight:800, fontSize:'15px', color:T.textPrimary, marginBottom:'8px' }}>Delete Document?</div>
            <div style={{ fontSize:'13px', color:T.textMuted, marginBottom:'20px', lineHeight:1.6 }}>
              This document will be permanently removed from the claim.
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={() => setDeleteId(null)} style={{ flex:1, padding:'10px', borderRadius:'8px', border:`1px solid ${T.border}`, background:'#F8FAFC', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Cancel</button>
              <button onClick={confirmDelete} style={{ flex:1, padding:'10px', borderRadius:'8px', border:'none', background:'#DC2626', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
