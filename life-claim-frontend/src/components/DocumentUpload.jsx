import { useState, useRef, useEffect } from 'react'
import { useToast } from './Toast'
import documentService from '../services/documentService'
import fileUploadService from '../services/FileUploadService'

const T = { primary:'#1D4ED8', border:'#E2E8F0', borderSubtle:'#F1F5F9', textPrimary:'#0F172A', textSecondary:'#334155', textMuted:'#64748B', textSubtle:'#94A3B8' }

const FILE_ICONS = { pdf:'📄', jpg:'🖼️', jpeg:'🖼️', png:'🖼️', doc:'📝', docx:'📝', xls:'📊', xlsx:'📊', default:'📎' }
const getIcon = name => FILE_ICONS[name.split('.').pop()?.toLowerCase()] || FILE_ICONS.default
const fmtSize = b => b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(1)}KB` : `${(b/1048576).toFixed(1)}MB`

function mapDoc(row, i) {
  const name = row.FILE_NAME || row.fileName || row.documentName || row.name || `Document ${i + 1}`
  return {
    id: row.ID || row.id || i + 1,
    name,
    size: row.FILE_SIZE || row.fileSize || 0,
    type: row.DOCUMENT_TYPE || row.documentType || row.type || 'Supporting Document',
    status: 'Uploaded',
    uploadedBy: row.UPLOADED_BY || row.uploadedBy || '—',
    uploadedOn: (row.UPLOADED_ON || row.uploadedOn || row.createdAt || '').toString().split('T')[0] || '—',
    url: row.FILE_URL || row.url || '#',
  }
}

export default function DocumentUpload({ claimId, label = 'Claim Documents' }) {
  const toast = useToast()
  const inputRef = useRef(null)
  const [docs, setDocs] = useState([])
  const [documentType, setDocumentType] = useState('Supporting Document')
  const [documentTypes, setDocumentTypes] = useState(['Supporting Document'])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    if (!claimId) {
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([
      documentService.getDocumentList().catch(() => []),
      documentService.getUploadedDocumentList(claimId).catch(() => []),
    ]).then(([types, uploaded]) => {
      const typeNames = (types || []).map(t => t.DOCUMENT_TYPE || t.documentType || t.name || t).filter(Boolean)
      if (typeNames.length) {
        setDocumentTypes(typeNames)
        setDocumentType(typeNames[0])
      }
      setDocs((uploaded || []).map(mapDoc))
    }).finally(() => setLoading(false))
  }, [claimId])

  const reloadDocs = async () => {
    const uploaded = await documentService.getUploadedDocumentList(claimId).catch(() => [])
    setDocs((uploaded || []).map(mapDoc))
  }

  const handleFiles = async (files) => {
    if (!claimId) {
      toast('warning', 'Missing Claim', 'Claim number is required to upload documents.')
      return
    }
    const allowed = ['pdf','jpg','jpeg','png','doc','docx','xls','xlsx']
    const valid = Array.from(files).filter(f => allowed.includes(f.name.split('.').pop().toLowerCase()))
    if (valid.length === 0) { toast('error','Invalid File','Only PDF, Word, Excel and image files allowed.'); return }
    if (valid.some(f => f.size > 10*1024*1024)) { toast('warning','File Too Large','Max file size is 10MB.'); return }

    setUploading(true)
    try {
      await fileUploadService.fileUpload({
        claimNo: claimId,
        documentType,
        documentId: documentType,
        files: valid,
      })
      await reloadDocs()
      toast('success', 'Upload Complete', `${valid.length} file(s) uploaded successfully.`)
    } catch {
      toast('error', 'Upload Failed', 'Could not upload document(s).')
    } finally {
      setUploading(false)
    }
  }

  const confirmDelete = () => {
    setDocs(p => p.filter(d => d.id !== deleteId))
    toast('success', 'Deleted', 'Document removed from view.')
    setDeleteId(null)
  }

  return (
    <div style={{ fontFamily:'Inter,sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
        <div>
          <div style={{ fontSize:'14px', fontWeight:700, color:T.textPrimary }}>{label}</div>
          <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'2px' }}>{docs.length} document(s) attached</div>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <select value={documentType} onChange={e => setDocumentType(e.target.value)}
            style={{ height:'36px', padding:'0 10px', border:`1px solid ${T.border}`, borderRadius:'8px', fontSize:'12px', fontFamily:'Inter,sans-serif', color:T.textSecondary }}>
            {documentTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={() => inputRef.current?.click()} disabled={uploading || !claimId}
            style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 16px', borderRadius:'8px', border:'none', background:T.primary, color:'#fff', fontSize:'13px', fontWeight:700, cursor:uploading?'wait':'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s', boxShadow:'0 3px 10px rgba(29,78,216,0.25)' }}>
            {uploading ? '⏳ Uploading...' : '+ Upload Document'}
          </button>
        </div>
        <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" style={{ display:'none' }} onChange={e => handleFiles(e.target.files)}/>
      </div>

      {loading ? (
        <div style={{ padding:'24px', textAlign:'center', color:T.textMuted, fontSize:'13px' }}>Loading documents...</div>
      ) : (
        <>
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
                  {docs.map(d => (
                    <tr key={d.id} style={{ borderBottom:`1px solid ${T.borderSubtle}` }}>
                      <td style={{ padding:'10px 14px', fontSize:'13px', fontWeight:600, color:T.textSecondary }}>
                        <span style={{ marginRight:'8px' }}>{getIcon(d.name)}</span>{d.name}
                      </td>
                      <td style={{ padding:'10px 14px', fontSize:'12px', color:T.textMuted }}>{d.type}</td>
                      <td style={{ padding:'10px 14px', fontSize:'12px', color:T.textMuted }}>{d.size ? fmtSize(Number(d.size)) : '—'}</td>
                      <td style={{ padding:'10px 14px', fontSize:'12px', color:T.textMuted }}>{d.uploadedBy}</td>
                      <td style={{ padding:'10px 14px', fontSize:'12px', color:T.textMuted }}>{d.uploadedOn}</td>
                      <td style={{ padding:'10px 14px' }}>
                        <button onClick={() => setDeleteId(d.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', fontSize:'12px', fontWeight:700 }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {deleteId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:'12px', padding:'24px', width:'320px', boxShadow:'0 20px 48px rgba(0,0,0,0.15)' }}>
            <div style={{ fontWeight:800, fontSize:'15px', marginBottom:'8px' }}>Remove document?</div>
            <div style={{ fontSize:'13px', color:T.textMuted, marginBottom:'20px' }}>This removes the document from the list view only.</div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={() => setDeleteId(null)} style={{ flex:1, padding:'9px', borderRadius:'8px', border:`1px solid ${T.border}`, background:'#F8FAFC', cursor:'pointer', fontWeight:700 }}>Cancel</button>
              <button onClick={confirmDelete} style={{ flex:1, padding:'9px', borderRadius:'8px', border:'none', background:'#DC2626', color:'#fff', cursor:'pointer', fontWeight:700 }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
