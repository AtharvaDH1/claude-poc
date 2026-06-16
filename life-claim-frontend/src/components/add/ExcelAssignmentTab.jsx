import { useState } from 'react'
import { Upload, CheckSquare } from 'lucide-react'
import { readExcelFileData, CaseAssignmentService, downloadAssignmentTemplate } from '../../services/add/caseAssignmentService'
import { T, PrimaryBtn } from './AddUi'

export default function ExcelAssignmentTab({ toast, embedded = false, onComplete }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState(null)

  const handleUpload = async () => {
    if (!file) return toast('warning', 'No file', 'Select an Excel file first.')
    setUploading(true)
    setResult(null)
    try {
      const processed = await readExcelFileData(file)
      const res = await CaseAssignmentService(processed)
      setResult(res)
      toast('success', 'Assignment complete', res?.message || 'Policy assignments processed.')
      onComplete?.()
    } catch (e) {
      toast('error', 'Upload failed', e?.message || 'Could not process file.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ padding: embedded ? 0 : '24px' }}>
      <div style={{ fontWeight: 700, fontSize: '14px', color: T.textPrimary, marginBottom: '4px' }}>Bulk policy assignment (Excel)</div>
      <div style={{ fontSize: '12px', color: T.textMuted, marginBottom: '16px' }}>
        Upload an Excel file with <strong>POLICY_ID</strong> and <strong>ASSIGNED_TO</strong> columns to assign cases in bulk.
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files[0]) }}
        onClick={() => document.getElementById('assign-file-input')?.click()}
        style={{
          border: `2px dashed ${dragging ? T.primary : '#CBD5E1'}`,
          borderRadius: '14px',
          padding: '40px 24px',
          textAlign: 'center',
          background: dragging ? '#EFF6FF' : '#FAFAFA',
          cursor: 'pointer',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
        <div style={{ fontWeight: 700, fontSize: '14px', color: T.textPrimary }}>{file ? file.name : 'Drop Excel file or click to browse'}</div>
        <div style={{ fontSize: '12px', color: T.textMuted, marginTop: '6px' }}>.xlsx / .xls</div>
        <input id="assign-file-input" type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <PrimaryBtn onClick={handleUpload} disabled={uploading}>
          <Upload size={14} /> {uploading ? 'Processing…' : 'Upload & assign'}
        </PrimaryBtn>
        <button
          type="button"
          onClick={() => downloadAssignmentTemplate()}
          style={{ height: '40px', padding: '0 16px', borderRadius: '8px', border: `1px solid ${T.border}`, background: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', color: T.textSecondary }}
        >
          Download template
        </button>
      </div>

      {result && (
        <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
          <div style={{ fontWeight: 700, color: '#065F46', fontSize: '13px', marginBottom: '8px' }}>{result.message || 'Success'}</div>
          {result.data?.failed?.length > 0 && (
            <div style={{ fontSize: '12px', color: '#991B1B' }}>
              Failed: {result.data.failed.map((f) => `${f.policyId} (${f.reason})`).join('; ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
