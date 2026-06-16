import { useState } from 'react'
import { Upload, CheckSquare } from 'lucide-react'
import {
  ExcelUploaderService,
  isAllowedDataEntryFile,
  downloadDataEntryTemplate,
} from '../../../services/add/DataEntryUploadService'
import { T, PrimaryBtn } from '../AddUi'

const TEMPLATE_COLS = 'POLICY_NUMBER, SOURCE, REFERRAL_DATE, REMARKS'
const MAX_BYTES = 10 * 1024 * 1024

export default function DataEntryUploaderTab({ toast }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)

  const validateAndSetFile = (next) => {
    if (!next) return
    setFileError('')
    if (!isAllowedDataEntryFile(next)) {
      setFile(null)
      setFileError('Please select a valid Excel file (.xls, .xlsx) or CSV file.')
      toast('warning', 'Invalid file', 'Use .xls, .xlsx, or .csv')
      return
    }
    if (next.size > MAX_BYTES) {
      setFile(null)
      setFileError('File size must be less than 10 MB.')
      toast('warning', 'File too large', 'Maximum size is 10 MB.')
      return
    }
    setFile(next)
    setResult(null)
  }

  const handleUpload = async () => {
    if (!file) {
      toast('warning', 'No file', 'Select or drop a file first.')
      return
    }
    setUploading(true)
    setResult(null)
    try {
      const res = await ExcelUploaderService(file)
      const count = Array.isArray(res?.data) ? res.data.length : 0
      setResult(res)
      toast('success', 'Upload accepted', `Successfully uploaded ${count} record(s).`)
      setFile(null)
    } catch (e) {
      toast('error', 'Upload failed', e?.message || 'Could not process file.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontWeight: 700, fontSize: '14px', color: T.textPrimary, marginBottom: '4px' }}>Data Entry Uploader</div>
      <div style={{ fontSize: '12px', color: T.textMuted, marginBottom: '16px', lineHeight: 1.5 }}>
        Upload Excel or CSV with columns: <strong>{TEMPLATE_COLS}</strong>. Policy enrichment and exclusion rules run automatically after upload.
      </div>

      <button
        type="button"
        onClick={() => downloadDataEntryTemplate()}
        style={{ marginBottom: '16px', padding: '8px 14px', borderRadius: '8px', border: `1px solid ${T.border}`, background: '#F8FAFC', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
      >
        Download template (.xlsx)
      </button>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); validateAndSetFile(e.dataTransfer.files[0]) }}
        onClick={() => document.getElementById('caps-data-entry-input')?.click()}
        style={{ border: `2px dashed ${dragging ? T.primary : '#CBD5E1'}`, borderRadius: '14px', padding: '48px 24px', textAlign: 'center', background: dragging ? '#EFF6FF' : '#FAFAFA', cursor: 'pointer', marginBottom: '12px' }}
      >
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>📂</div>
        <div style={{ fontWeight: 700, fontSize: '14px' }}>{file ? file.name : 'Drop .csv / .xlsx / .xls here'}</div>
        <div style={{ fontSize: '12px', color: T.textMuted, marginTop: '6px' }}>Max 10 MB · success means raw staging only; check Case Search after enrichment completes</div>
        <input
          id="caps-data-entry-input"
          type="file"
          accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          style={{ display: 'none' }}
          onChange={(e) => validateAndSetFile(e.target.files[0])}
        />
      </div>

      {fileError && (
        <div style={{ fontSize: '13px', color: '#B91C1C', marginBottom: '12px', fontWeight: 600 }}>{fileError}</div>
      )}

      <PrimaryBtn onClick={handleUpload} disabled={uploading || !file}>
        <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload and process data'}
      </PrimaryBtn>

      {result && (
        <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <CheckSquare size={18} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', color: '#065F46', fontWeight: 700, marginBottom: '6px' }}>
                {result.message}
              </div>
              <div style={{ fontSize: '12px', color: '#047857', lineHeight: 1.5 }}>
                The system will automatically fetch policy details from Life Asia and apply exclusion rules.
                New cases appear in <strong>Case Search</strong> and <strong>Assessment Pool</strong> after background processing finishes.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
