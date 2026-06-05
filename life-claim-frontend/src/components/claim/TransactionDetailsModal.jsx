import { useState, useEffect } from 'react'
import { useToast } from '../Toast'
import { getTransactionDetailsLA, saveTransactionDetailsLA, getTransactionApiDBDetails } from '../../services/transactionDetailsLAService'

const T = { primary: '#1D4ED8', card: '#fff', border: '#E2E8F0', textPrimary: '#0F172A', textMuted: '#64748B' }

export default function TransactionDetailsModal({ open, onClose, policyId, txnDate }) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [remarks, setRemarks] = useState('')
  const [dbRows, setDbRows] = useState(null)
  const [tab, setTab] = useState('live')

  useEffect(() => {
    if (!open || !policyId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const date = txnDate || new Date().toISOString().split('T')[0]
      try {
        const [data, db] = await Promise.all([
          getTransactionDetailsLA(policyId, date),
          getTransactionApiDBDetails(policyId, date).catch(() => null),
        ])
        if (cancelled) return
        const list = Array.isArray(data) ? data : data?.transactions || data?.data || []
        setRows(list)
        setDbRows(db)
      } catch {
        if (!cancelled) toast('error', 'Load failed', 'Could not load transaction details.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [open, policyId, txnDate, toast])

  if (!open) return null

  const handleSave = async () => {
    try {
      await saveTransactionDetailsLA(policyId, txnDate, { remarks, rows })
      toast('success', 'Saved', 'Transaction details saved.')
      onClose()
    } catch (e) {
      toast('error', 'Save failed', e?.message || 'Could not save.')
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: T.card, borderRadius: '16px', width: 'min(640px, 94vw)', maxHeight: '80vh', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px' }}>Transaction details</div>
            <div style={{ fontSize: '12px', color: T.textMuted }}>Policy {policyId}</div>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ display: 'flex', gap: '8px', padding: '0 22px', borderBottom: `1px solid ${T.border}` }}>
          {['live', 'database'].map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{ padding: '10px 12px', border: 'none', borderBottom: tab === t ? `2px solid ${T.primary}` : '2px solid transparent', background: 'transparent', fontWeight: tab === t ? 700 : 500, color: tab === t ? T.primary : T.textMuted, fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', marginBottom: '-1px', textTransform: 'capitalize' }}>
              {t === 'live' ? 'Txn API' : 'DB cache'}
            </button>
          ))}
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', maxHeight: '50vh' }}>
          {loading ? (
            <div style={{ color: T.textMuted, fontSize: '13px' }}>Loading…</div>
          ) : tab === 'database' ? (
            <pre style={{ fontSize: '11px', background: '#F8FAFC', padding: '12px', borderRadius: '8px', overflow: 'auto' }}>
              {dbRows ? JSON.stringify(dbRows, null, 2) : 'No DB transaction cache.'}
            </pre>
          ) : rows.length === 0 ? (
            <div style={{ color: T.textMuted, fontSize: '13px' }}>No transaction rows returned (txn API may be offline).</div>
          ) : (
            <pre style={{ fontSize: '11px', background: '#F8FAFC', padding: '12px', borderRadius: '8px', overflow: 'auto' }}>
              {JSON.stringify(rows, null, 2)}
            </pre>
          )}
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginTop: '12px', marginBottom: '6px' }}>Remarks</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${T.border}`, fontFamily: 'Inter,sans-serif' }}
          />
        </div>
        <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: '8px', border: `1px solid ${T.border}`, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Close</button>
          <button type="button" onClick={handleSave} style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: T.primary, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Save</button>
        </div>
      </div>
    </div>
  )
}
