import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, X } from 'lucide-react'
import { searchCaseTableData } from '../../../services/add/searchCaseData'
import { T } from '../AddUi'
import { CASE_SEARCH_ATTRIBUTES, extractCaseRows, mapCaseRow, openCasePath } from '../addCaseMappers'

export default function CaseSearchTab({ toast }) {
  const navigate = useNavigate()
  const [attribute, setAttribute] = useState('case_status')
  const [value, setValue] = useState('Open')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  const runSearch = async () => {
    if (!value.trim()) {
      toast('warning', 'Search', 'Enter a value to search.')
      return
    }
    setLoading(true)
    try {
      const result = await searchCaseTableData(attribute, value.trim(), 50, 0)
      const rows = extractCaseRows(result)
      setResults(rows.map(mapCaseRow))
      setTotal(result?.totalCount ?? rows.length)
    } catch (e) {
      toast('error', 'Search failed', e?.message || 'Could not search cases.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const goCase = (c) => {
    const path = openCasePath(c.caseId)
    if (!path) return
    navigate(path, { state: { case: c } })
  }

  return (
    <div style={{ padding: '24px' }}>
      <p style={{ fontSize: '12px', color: T.textMuted, marginBottom: '16px', lineHeight: 1.5 }}>
        Search CAPS cases in <code>caps_add_details</code>. Double-click a row or use View to open <strong>/case/:id</strong> (CAPS case id, not CL claim numbers).
      </p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <select
          value={attribute}
          onChange={(e) => setAttribute(e.target.value)}
          style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: `1px solid ${T.border}`, fontFamily: 'Inter,sans-serif', fontSize: '13px' }}
        >
          {CASE_SEARCH_ATTRIBUTES.map((a) => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </select>
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 14px', height: '42px', borderRadius: '8px', background: '#F8FAFC', border: `1.5px solid ${T.border}` }}>
          <Search size={15} style={{ color: T.textSubtle }} />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            placeholder="Search value…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '13px', fontFamily: 'Inter,sans-serif' }}
          />
          {value && (
            <button type="button" onClick={() => setValue('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>
        <button type="button" onClick={runSearch} disabled={loading} style={{ padding: '0 20px', height: '42px', borderRadius: '8px', border: 'none', background: T.primary, color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {total > 0 && <div style={{ fontSize: '12px', color: T.textMuted, marginBottom: '10px' }}>{total} case(s) found</div>}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: T.textMuted }}>Loading…</div>
      ) : results.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: T.textMuted }}>No results — run a search.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${T.border}`, borderRadius: '10px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#FAFAFA', borderBottom: `2px solid ${T.border}` }}>
              {['Case ID', 'Policy', 'KRN', 'Status', 'IRIS', 'Assigned', ''].map((h) => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((c) => (
              <tr
                key={c.caseId}
                onDoubleClick={() => goCase(c)}
                style={{ borderBottom: `1px solid ${T.borderSubtle}`, cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
              >
                <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontWeight: 700, color: T.primary, fontSize: '12px' }}>{c.caseId}</td>
                <td style={{ padding: '11px 14px', fontSize: '12px' }}>{c.policyNumber}</td>
                <td style={{ padding: '11px 14px', fontSize: '12px', color: T.textMuted }}>{c.krn}</td>
                <td style={{ padding: '11px 14px', fontSize: '12px' }}>{c.status}</td>
                <td style={{ padding: '11px 14px', fontSize: '12px', color: T.textMuted }}>{c.irisStatus}</td>
                <td style={{ padding: '11px 14px', fontSize: '12px' }}>{c.assignedTo}</td>
                <td style={{ padding: '11px 14px' }}>
                  <button type="button" onClick={() => goCase(c)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: `1px solid ${T.border}`, background: '#F8FAFC', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                    <Eye size={11} /> View
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
