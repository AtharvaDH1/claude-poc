import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye } from 'lucide-react'
import { searchCaseTableData } from '../../../services/add/searchCaseData'
import ExcelAssignmentTab from '../ExcelAssignmentTab'
import { T } from '../AddUi'
import { CASE_SEARCH_ATTRIBUTES, extractCaseRows, mapCaseRow, openCasePath } from '../addCaseMappers'

export default function CaseAssignmentTab({ toast }) {
  const navigate = useNavigate()
  const [attribute, setAttribute] = useState('assigned_to')
  const [value, setValue] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const runSearch = async () => {
    setLoading(true)
    try {
      if (!value.trim()) {
        toast('warning', 'Search', 'Enter a filter value.')
        setLoading(false)
        return
      }
      const result = await searchCaseTableData(attribute, value.trim(), 50, 0)
      setRows(extractCaseRows(result).map(mapCaseRow))
    } catch (e) {
      toast('error', 'Search failed', e?.message || 'Could not load cases.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>Search cases</div>
        <p style={{ fontSize: '12px', color: T.textMuted, marginBottom: '12px' }}>
          Uses the same API as Case Search (<code>POST /case-search/search</code>). Assign To dropdown in legacy UI is not wired; use bulk Excel below.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <select value={attribute} onChange={(e) => setAttribute(e.target.value)} style={{ height: '40px', padding: '0 12px', borderRadius: '8px', border: `1px solid ${T.border}`, fontSize: '13px', fontFamily: 'Inter,sans-serif' }}>
            {CASE_SEARCH_ATTRIBUTES.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
            <option value="assigned_to">Assigned to</option>
          </select>
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Filter value (empty = all)" style={{ flex: 1, minWidth: '160px', height: '40px', padding: '0 12px', borderRadius: '8px', border: `1px solid ${T.border}`, fontFamily: 'Inter,sans-serif', fontSize: '13px' }} />
          <button type="button" onClick={runSearch} disabled={loading} style={{ height: '40px', padding: '0 18px', borderRadius: '8px', border: 'none', background: T.primary, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            <Search size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            {loading ? '…' : 'Search'}
          </button>
        </div>
        {rows.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${T.border}`, borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Case ID', 'Policy', 'Assigned', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.caseId} style={{ borderTop: `1px solid ${T.borderSubtle}` }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: T.primary, fontSize: '12px' }}>{c.caseId}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px' }}>{c.policyNumber}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px' }}>{c.assignedTo}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px' }}>{c.status}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <button type="button" onClick={() => { const p = openCasePath(c.caseId); if (p) navigate(p, { state: { case: c } }) }} style={{ border: 'none', background: 'none', color: T.primary, fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '24px' }}>
        <ExcelAssignmentTab toast={toast} embedded />
      </div>
    </div>
  )
}
