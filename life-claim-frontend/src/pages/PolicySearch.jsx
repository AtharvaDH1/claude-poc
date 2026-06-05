import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import AppLayout from '../layouts/AppLayout'
import { historySearch } from '../services/historySearchService'
import { Search, FileText, Plus, X, RotateCcw } from 'lucide-react'

const T = {
  primary: '#1D4ED8', primaryHover: '#1E40AF',
  pageBg: '#F1F5F9', card: '#FFFFFF',
  border: '#E2E8F0', borderSubtle: '#F1F5F9',
  textPrimary: '#0F172A', textSecondary: '#334155',
  textMuted: '#64748B', textSubtle: '#94A3B8',
}

const USER_ROLES = [{ value: 'pre-assessor', label: 'Pre-Assessor' }]

function mapClaimRow(row) {
  return {
    claimNumber: row.CLAIM_NUMBER || row.claimNumber || row.claim_no || '—',
    claimType: row.CLAIM_TYPE || row.claimType || '—',
    policyNumber: row.POLICY_ID || row.POLICY_NUMBER || row.policyNumber || '—',
    policyStatus: row.POLICY_STATUS || row.policyStatus || '—',
    claimStatus: row.CLAIM_STATUS || row.claimStatus || row.status || '—',
    createdOn: (row.CREATED_AT || row.createdOn || row.CREATED_ON || '').toString().split('T')[0] || '—',
    createdBy: row.CREATED_BY || row.createdBy || '—',
  }
}

export default function PolicySearch() {
  const navigate = useNavigate()
  const toast = useToast()
  const [userRole, setUserRole] = useState('pre-assessor')
  const [policyNumber, setPolicyNumber] = useState('')
  const [claimNumber, setClaimNumber] = useState('')
  const [caseId, setCaseId] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hovRow, setHovRow] = useState(null)

  const roleOk = Boolean(userRole)
  const canSearch = roleOk && (policyNumber.trim() || claimNumber.trim())
  const canRegister = roleOk

  const doSearch = async () => {
    if (!roleOk) {
      toast('warning', 'Select role', 'Choose User Role before searching.')
      return
    }
    if (!policyNumber.trim() && !claimNumber.trim()) {
      toast('warning', 'Enter criteria', 'Enter a policy number or claim number.')
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const raw = await historySearch(policyNumber.trim(), claimNumber.trim())
      if (!raw || raw.message) {
        setResults([])
        toast('info', 'No records', raw?.message || 'No claims found in history.')
        return
      }
      const arr = Array.isArray(raw) ? raw : [raw]
      setResults(arr.map(mapClaimRow))
    } catch {
      setResults([])
      toast('error', 'Search failed', 'Could not load claim history.')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setUserRole('pre-assessor')
    setPolicyNumber('')
    setClaimNumber('')
    setCaseId('')
    setResults([])
    setSearched(false)
  }

  const goRegister = (policyNo) => {
    navigate('/registration', { state: { policyNumber: policyNo || policyNumber.trim() } })
  }

  return (
    <AppLayout pageTitle="Policy Search">
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
            Policy Search
          </h1>
          <p style={{ fontSize: '13px', color: T.textMuted, marginTop: '4px', fontWeight: 500 }}>
            Search existing claims in the system, then register a new claim against a Life Asia policy.
          </p>
        </div>

        <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '24px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: T.textPrimary, marginBottom: '16px' }}>Search criteria</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: T.textSecondary }}>User role *</span>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                style={{ height: '42px', borderRadius: '8px', border: `1.5px solid ${T.border}`, padding: '0 12px', fontSize: '13px', fontFamily: 'Inter,sans-serif' }}
              >
                <option value="">Select role</option>
                {USER_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: T.textSecondary }}>Policy number</span>
              <input
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                placeholder="Policy ID"
                style={{ height: '42px', borderRadius: '8px', border: `1.5px solid ${T.border}`, padding: '0 12px', fontSize: '13px', fontFamily: 'Inter,sans-serif' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: T.textSecondary }}>Claim number</span>
              <input
                value={claimNumber}
                onChange={(e) => setClaimNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                placeholder="e.g. CL123"
                style={{ height: '42px', borderRadius: '8px', border: `1.5px solid ${T.border}`, padding: '0 12px', fontSize: '13px', fontFamily: 'Inter,sans-serif' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: T.textSecondary }}>Case ID (optional)</span>
              <input
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                placeholder="Not sent to API"
                style={{ height: '42px', borderRadius: '8px', border: `1.5px solid ${T.border}`, padding: '0 12px', fontSize: '13px', fontFamily: 'Inter,sans-serif', background: '#F8FAFC' }}
              />
            </label>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button
              type="button"
              disabled={!canSearch || loading}
              onClick={doSearch}
              style={{ padding: '0 20px', height: '42px', borderRadius: '8px', border: 'none', background: canSearch ? T.primary : '#94A3B8', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: canSearch ? 'pointer' : 'not-allowed', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Search size={14} /> {loading ? 'Searching…' : 'Search history'}
            </button>
            <button
              type="button"
              disabled={!canRegister}
              onClick={() => goRegister(policyNumber.trim())}
              style={{ padding: '0 20px', height: '42px', borderRadius: '8px', border: 'none', background: canRegister ? '#059669' : '#94A3B8', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: canRegister ? 'pointer' : 'not-allowed', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={14} /> Register new claim
            </button>
            <button
              type="button"
              onClick={handleClear}
              style={{ padding: '0 16px', height: '42px', borderRadius: '8px', border: `1px solid ${T.border}`, background: '#fff', fontSize: '13px', fontWeight: 600, color: T.textSecondary, cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} /> Clear
            </button>
          </div>
          <p style={{ fontSize: '11px', color: T.textSubtle, marginTop: '12px' }}>
            History search queries MySQL claims only. Life Asia policy fetch happens on the registration form.
          </p>
        </div>

        {!searched ? (
          <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '48px 24px', textAlign: 'center' }}>
            <FileText size={32} style={{ color: T.primary, marginBottom: '12px' }} />
            <div style={{ fontWeight: 700, fontSize: '15px', color: T.textPrimary }}>Search claim history</div>
            <div style={{ fontSize: '13px', color: T.textMuted, marginTop: '8px' }}>Or use Register new claim to start without a prior search.</div>
          </div>
        ) : results.length === 0 ? (
          <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '40px', textAlign: 'center', color: T.textMuted, fontSize: '13px' }}>
            No matching claims in history.
          </div>
        ) : (
          <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.borderSubtle}`, fontWeight: 700, fontSize: '14px' }}>
              Results ({results.length})
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FAFAFA', borderBottom: `2px solid ${T.border}` }}>
                    {['Claim number', 'Claim type', 'Policy number', 'Policy status', 'Claim status', 'Created on', 'Created by'].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr
                      key={`${row.claimNumber}-${i}`}
                      onMouseEnter={() => setHovRow(i)}
                      onMouseLeave={() => setHovRow(null)}
                      style={{ borderBottom: `1px solid ${T.borderSubtle}`, background: hovRow === i ? '#F8FAFC' : 'transparent' }}
                    >
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: T.primary }}>{row.claimNumber}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px' }}>{row.claimType}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '12px' }}>{row.policyNumber}</td>
                      <td style={{ padding: '12px 14px', fontSize: '12px' }}>{row.policyStatus}</td>
                      <td style={{ padding: '12px 14px', fontSize: '12px' }}>{row.claimStatus}</td>
                      <td style={{ padding: '12px 14px', fontSize: '12px' }}>{row.createdOn}</td>
                      <td style={{ padding: '12px 14px', fontSize: '12px' }}>{row.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
