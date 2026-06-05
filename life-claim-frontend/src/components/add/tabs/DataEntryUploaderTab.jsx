import { useState } from 'react'
import { Upload, CheckSquare } from 'lucide-react'
import { ExcelUploaderService } from '../../../services/add/DataEntryUploadService'
import { T, PrimaryBtn } from '../AddUi'

const TEMPLATE_COLS = 'POLICY_NUMBER, SOURCE, REFERRAL_DATE, REMARKS'

export default function DataEntryUploaderTab({ toast }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)

  const downloadTemplate = () => {
    const csv = `${TEMPLATE_COLS}\n04027489,DAO,2025-01-15,Sample referral\n`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'caps_data_entry_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleUpload = async () => {
    if (!file) {
      toast('warning', 'No file', 'Select or drop a file first.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast('warning', 'File too large', 'Maximum size is 10 MB.')
      return
    }
    setUploading(true)
    setResult(null)
    try {
      const res = await ExcelUploaderService(file)
      setResult(res)
      toast('success', 'Upload accepted', res?.message || 'Raw rows inserted; enrichment runs in the background.')
    } catch (e) {
      toast('error', 'Upload failed', e?.message || 'Could not process file.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontWeight: 700, fontSize: '14px', color: T.textPrimary, marginBottom: '4px' }}>Data entry uploader</div>
      <div style={{ fontSize: '12px', color: T.textMuted, marginBottom: '16px', lineHeight: 1.5 }}>
        Upload Excel/CSV with columns <strong>{TEMPLATE_COLS}</strong>. API: <code>POST /capsAddDetails/addValue</code> → staging <code>caps_add_raw_data</code>, then async Life Asia enrichment.
      </div>
      <button type="button" onClick={downloadTemplate} style={{ marginBottom: '16px', padding: '8px 14px', borderRadius: '8px', border: `1px solid ${T.border}`, background: '#F8FAFC', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
        Download CSV template
      </button>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files[0]) }}
        onClick={() => document.getElementById('caps-data-entry-input')?.click()}
        style={{ border: `2px dashed ${dragging ? T.primary : '#CBD5E1'}`, borderRadius: '14px', padding: '48px 24px', textAlign: 'center', background: dragging ? '#EFF6FF' : '#FAFAFA', cursor: 'pointer', marginBottom: '16px' }}
      >
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>📂</div>
        <div style={{ fontWeight: 700, fontSize: '14px' }}>{file ? file.name : 'Drop .csv / .xlsx / .xls here'}</div>
        <div style={{ fontSize: '12px', color: T.textMuted, marginTop: '6px' }}>Max 10 MB · success means raw insert only; check Case Search after enrichment</div>
        <input id="caps-data-entry-input" type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
      </div>

      <PrimaryBtn onClick={handleUpload} disabled={uploading}>
        <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload & enqueue enrichment'}
      </PrimaryBtn>

      {result && (
        <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', gap: '10px' }}>
          <CheckSquare size={18} style={{ color: '#059669', flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: '#065F46', fontWeight: 600 }}>{result.message || JSON.stringify(result)}</div>
        </div>
      )}
    </div>
  )
}
