import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { AssessmentPool, closeCasesAsExclusion, moveCasesToBeReferred } from '../../../services/add/AssessmentPool'
import { T, PrimaryBtn } from '../AddUi'
import { mapPoolRow, openCasePath, POOL_SEARCH_ATTRIBUTES, normalizePolicyNumber } from '../addCaseMappers'

const PAGE_SIZE = 5

const EXCLUSION_COLUMNS = [
  { key: 'caseId', label: 'Case Id' },
  { key: 'applicationNo', label: 'App No' },
  { key: 'policyId', label: 'Policy No' },
  { key: 'krn', label: 'KRN' },
  { key: 'source', label: 'Source' },
  { key: 'referralDate', label: 'Referral' },
  { key: 'status', label: 'Case Status' },
  { key: 'exclusionType', label: 'Exclusion' },
  { key: 'irisStatus', label: 'IRIS' },
  { key: 'daysOpen', label: 'SCN Aging' },
  { key: 'productCode', label: 'Product' },
  { key: 'policyStatus', label: 'Policy Status' },
  { key: 'baseSa', label: 'Base SA' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'pincode', label: 'Pin' },
  { key: 'triggerDate', label: 'Trigger' },
]

export default function AssessmentPoolTab({ toast }) {
  const navigate = useNavigate()
  const [subTab, setSubTab] = useState('Y')
  const [attribute, setAttribute] = useState('')
  const [value, setValue] = useState('')
  const [exclusionPage, setExclusionPage] = useState(0)
  const [nonExclusionPage, setNonExclusionPage] = useState(0)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)

  const isExclusionTab = subTab === 'Y'
  const page = isExclusionTab ? exclusionPage : nonExclusionPage
  const setPage = isExclusionTab ? setExclusionPage : setNonExclusionPage

  const resolveSearchValue = () => {
    if (!value.trim()) return null
    if (attribute === 'policy_number') return normalizePolicyNumber(value.trim())
    return value.trim()
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const searchValue = resolveSearchValue()
      const res = await AssessmentPool(
        attribute || null,
        searchValue,
        subTab,
        page * PAGE_SIZE,
        PAGE_SIZE,
      )
      const list = Array.isArray(res?.data) ? res.data : []
      const mapped = list.map(mapPoolRow)
      const seen = new Set()
      const unique = mapped.filter((r) => {
        if (!r.caseId || seen.has(r.caseId)) return false
        seen.add(r.caseId)
        return true
      })
      setRows(unique)
      setTotal(res?.totalCount ?? unique.length)
      setSelected([])
    } catch (e) {
      toast('error', 'Pool load failed', e?.message || 'Could not load assessment pool.')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [attribute, value, subTab, page, toast])

  useEffect(() => { load() }, [load])

  const toggle = (id) => {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  const goCase = (r) => {
    const path = openCasePath(r.caseId)
    if (!path) return
    navigate(path, { state: { case: { caseId: r.caseId, policyNumber: r.policyId, krn: r.krn, status: r.status } } })
  }

  const bulkAction = async (fn, msg) => {
    if (!selected.length) return toast('warning', 'Select cases', 'Check at least one row.')
    setBusy(true)
    try {
      await fn()
      toast('success', 'Done', msg)
      await load()
    } catch (e) {
      toast('error', 'Failed', e?.message || 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleMoveReferred = async () => {
    await bulkAction(async () => {
      await moveCasesToBeReferred(selected)
    }, `Moved ${selected.length} case(s) to be referred.`)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div style={{ padding: '24px' }}>
      <p style={{ fontSize: '12px', color: T.textMuted, marginBottom: '16px', lineHeight: 1.5 }}>
        Work queue for exclusion and non-exclusion cases. Cases appear after data entry upload. Double-click or View to open a case.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { id: 'Y', label: 'Exclusion Cases' },
          { id: 'N', label: 'Non-Exclusion Cases' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setSubTab(t.id); setSelected([]) }}
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
        <select
          value={attribute}
          onChange={(e) => setAttribute(e.target.value)}
          style={{ height: '40px', padding: '0 12px', borderRadius: '8px', border: `1px solid ${T.border}`, fontSize: '13px', fontFamily: 'Inter,sans-serif' }}
        >
          {POOL_SEARCH_ATTRIBUTES.map((a) => (
            <option key={a.id || 'all'} value={a.id}>{a.label}</option>
          ))}
        </select>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={attribute ? 'Filter value' : 'Optional — leave empty to list all'}
          style={{ flex: 1, minWidth: '140px', height: '40px', padding: '0 12px', borderRadius: '8px', border: `1px solid ${T.border}`, fontFamily: 'Inter,sans-serif', fontSize: '13px' }}
        />
        <PrimaryBtn
          onClick={() => {
            const onFirstPage = page === 0
            if (isExclusionTab) setExclusionPage(0)
            else setNonExclusionPage(0)
            if (onFirstPage) load()
          }}
          disabled={loading}
        >
          Search
        </PrimaryBtn>
      </div>

      {isExclusionTab && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <PrimaryBtn
            disabled={busy || !selected.length}
            variant="danger"
            onClick={() => bulkAction(() => closeCasesAsExclusion(selected, 'UI', ''), `Closed ${selected.length} case(s) as exclusion.`)}
          >
            Close case as exclusion
          </PrimaryBtn>
          <PrimaryBtn disabled={busy || !selected.length} variant="secondary" onClick={handleMoveReferred}>
            Move case to be referred
          </PrimaryBtn>
        </div>
      )}

      <div style={{ fontSize: '12px', color: T.textMuted, marginBottom: '10px' }}>
        {total} in pool · page {page + 1}/{totalPages} · {PAGE_SIZE} per page
      </div>

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: T.textMuted }}>Loading pool…</div>
      ) : rows.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: T.textMuted }}>
          No cases in this pool. Upload via Data Entry Uploader and wait for Life Asia enrichment.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '1100px', borderCollapse: 'collapse', border: `1px solid ${T.border}`, borderRadius: '10px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {isExclusionTab && <th style={{ padding: '10px', width: 36 }} />}
                {EXCLUSION_COLUMNS.map((c) => (
                  <th key={c.key} style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textAlign: 'left', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                    {c.label}
                  </th>
                ))}
                <th style={{ padding: '10px 12px', width: 72 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.caseId}
                  onDoubleClick={() => goCase(r)}
                  style={{ borderTop: `1px solid ${T.borderSubtle}`, cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
                >
                  {isExclusionTab && (
                    <td style={{ padding: '10px' }} onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.includes(r.caseId)} onChange={() => toggle(r.caseId)} aria-label={`Select case ${r.caseId}`} />
                    </td>
                  )}
                  {EXCLUSION_COLUMNS.map((c) => (
                    <td
                      key={c.key}
                      style={{
                        padding: '10px 12px',
                        fontSize: '12px',
                        fontFamily: c.key === 'caseId' ? 'monospace' : 'inherit',
                        fontWeight: c.key === 'caseId' ? 700 : 400,
                        color: c.key === 'caseId' ? T.primary : T.textSecondary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r[c.key] ?? '—'}
                    </td>
                  ))}
                  <td style={{ padding: '10px 12px' }} onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => goCase(r)} style={{ border: 'none', background: 'none', color: T.primary, fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
        <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${T.border}`, background: '#fff', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.5 : 1 }}>
          <ChevronLeft size={16} />
        </button>
        <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${T.border}`, background: '#fff', cursor: page + 1 >= totalPages ? 'default' : 'pointer', opacity: page + 1 >= totalPages ? 0.5 : 1 }}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
