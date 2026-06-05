import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { AssessmentPool, closeCasesAsExclusion, moveCasesToBeReferred } from '../../../services/add/AssessmentPool'
import { T, PrimaryBtn } from '../AddUi'
import { mapPoolRow, openCasePath } from '../addCaseMappers'

const PAGE_SIZE = 5
const POOL_ATTRS = [
  { id: '', label: 'No filter' },
  { id: 'policy_number', label: 'Policy number' },
  { id: 'case_id', label: 'Case ID' },
  { id: 'krn', label: 'KRN' },
]

export default function AssessmentPoolTab({ toast }) {
  const navigate = useNavigate()
  const [subTab, setSubTab] = useState('N')
  const [attribute, setAttribute] = useState('')
  const [value, setValue] = useState('')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await AssessmentPool(attribute || null, value || null, subTab, page * PAGE_SIZE, PAGE_SIZE)
      const list = Array.isArray(res?.data) ? res.data : []
      setRows(list.map(mapPoolRow))
      setTotal(res?.totalCount ?? list.length)
      setSelected([])
    } catch (e) {
      toast('error', 'Pool load failed', e?.message || 'Could not load assessment pool.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [attribute, value, subTab, page, toast])

  useEffect(() => { load() }, [load])

  const toggle = (id) => {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  const bulkAction = async (fn, msg) => {
    if (!selected.length) return toast('warning', 'Select cases', 'Check at least one row.')
    setBusy(true)
    try {
      await fn()
      toast('success', 'Done', msg)
      load()
    } catch (e) {
      toast('error', 'Failed', e?.message || 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { id: 'Y', label: 'Exclusion cases' },
          { id: 'N', label: 'Non-exclusion cases' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setSubTab(t.id); setPage(0) }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${subTab === t.id ? T.primary : T.border}`,
              background: subTab === t.id ? '#EFF6FF' : '#fff',
              color: subTab === t.id ? T.primary : T.textMuted,
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'Inter,sans-serif',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <select value={attribute} onChange={(e) => setAttribute(e.target.value)} style={{ height: '40px', padding: '0 12px', borderRadius: '8px', border: `1px solid ${T.border}`, fontSize: '13px', fontFamily: 'Inter,sans-serif' }}>
          {POOL_ATTRS.map((a) => (
            <option key={a.id || 'all'} value={a.id}>{a.label}</option>
          ))}
        </select>
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Filter value" style={{ flex: 1, minWidth: '140px', height: '40px', padding: '0 12px', borderRadius: '8px', border: `1px solid ${T.border}`, fontFamily: 'Inter,sans-serif', fontSize: '13px' }} />
        <PrimaryBtn onClick={() => { setPage(0); load() }} disabled={loading}>Search</PrimaryBtn>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <PrimaryBtn disabled={busy || !selected.length} variant="danger" onClick={() => bulkAction(() => closeCasesAsExclusion(selected, 'UI', ''), `Closed ${selected.length} case(s).`)}>
          Close as exclusion
        </PrimaryBtn>
        <PrimaryBtn disabled={busy || !selected.length} variant="secondary" onClick={() => bulkAction(() => moveCasesToBeReferred(selected), `Moved ${selected.length} to be referred.`)}>
          Move to be referred
        </PrimaryBtn>
        <span style={{ fontSize: '12px', color: T.textMuted, alignSelf: 'center' }}>{total} in pool · page {page + 1}/{totalPages}</span>
      </div>

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: T.textMuted }}>Loading pool…</div>
      ) : rows.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: T.textMuted }}>No cases in this pool.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${T.border}`, borderRadius: '10px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#FAFAFA' }}>
              <th style={{ padding: '10px', width: 36 }} />
              {['Case ID', 'Policy', 'KRN', 'Status', 'Days', ''].map((h) => (
                <th key={h} style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.caseId}
                onDoubleClick={() => { const p = openCasePath(r.caseId); if (p) navigate(p, { state: { case: { caseId: r.caseId, policyNumber: r.policyId, status: r.status } } }) }}
                style={{ borderTop: `1px solid ${T.borderSubtle}`, cursor: 'pointer' }}
              >
                <td style={{ padding: '10px' }}>
                  <input type="checkbox" checked={selected.includes(r.caseId)} onChange={() => toggle(r.caseId)} onClick={(e) => e.stopPropagation()} />
                </td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: T.primary, fontSize: '12px' }}>{r.caseId}</td>
                <td style={{ padding: '10px 12px', fontSize: '12px' }}>{r.policyId}</td>
                <td style={{ padding: '10px 12px', fontSize: '12px', color: T.textMuted }}>{r.krn}</td>
                <td style={{ padding: '10px 12px', fontSize: '12px' }}>{r.status}</td>
                <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 700, color: r.daysOpen > 10 ? '#DC2626' : T.textMuted }}>{r.daysOpen}d</td>
                <td style={{ padding: '10px 12px' }}>
                  <button type="button" onClick={() => { const p = openCasePath(r.caseId); if (p) navigate(p) }} style={{ border: 'none', background: 'none', color: T.primary, fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={12} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
        <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${T.border}`, background: '#fff', cursor: 'pointer' }}>
          <ChevronLeft size={16} />
        </button>
        <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${T.border}`, background: '#fff', cursor: 'pointer' }}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
