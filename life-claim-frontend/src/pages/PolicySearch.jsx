import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import AppLayout from '../layouts/AppLayout'
import { historySearch } from '../services/historySearchService'
import { Search, FileText, Plus, X, CheckCircle, Clock } from 'lucide-react'

const T = {
  primary: '#1D4ED8', primaryHover: '#1E40AF',
  pageBg: '#F1F5F9', card: '#FFFFFF',
  border: '#E2E8F0', borderSubtle: '#F1F5F9',
  textPrimary: '#0F172A', textSecondary: '#334155',
  textMuted: '#64748B', textSubtle: '#94A3B8',
}

const fmt = n => new Intl.NumberFormat('en-IN').format(n)
const fmtRs = n => `₹${n >= 1e7 ? (n/1e7).toFixed(1)+'Cr' : n >= 1e5 ? (n/1e5).toFixed(1)+'L' : fmt(n)}`

function StatusBadge({ status }) {
  const map = {
    Active:  { bg:'#ECFDF5', border:'#A7F3D0', color:'#065F46', Icon: CheckCircle },
    Matured: { bg:'#EFF6FF', border:'#BFDBFE', color:'#1E40AF', Icon: Clock       },
    Lapsed:  { bg:'#FEF2F2', border:'#FECACA', color:'#991B1B', Icon: X           },
  }
  const s = map[status] || map.Active
  const Icon = s.Icon
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:s.bg, border:`1px solid ${s.border}`, color:s.color, fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'99px' }}>
      <Icon size={10} />{status}
    </span>
  )
}

export default function PolicySearch() {
  const navigate = useNavigate()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState(false)
  const [results, setResults] = useState([])
  const [hovRow, setHovRow] = useState(null)
  const [loading, setLoading] = useState(false)

  const mapPolicy = (row) => ({
    policyId: row.POLICY_ID || row.policyId || '',
    holderName: row.POLICY_HOLDER_NAME || row.POLICY_HOLDER || row.holderName || row.NAME || '—',
    dob: row.DATE_OF_BIRTH || row.dob || '—',
    type: row.POLICY_TYPE || row.type || 'Life',
    sumAssured: row.SUM_ASSURED || row.sumAssured || 0,
    startDate: row.POLICY_START_DATE || row.startDate || '—',
    premiumTerm: row.PREMIUM_TERM || row.premiumTerm || '—',
    status: row.POLICY_STATUS || row.status || 'Active',
    agent: row.AGENT_NAME || row.agent || '—',
  })

  const doSearch = async () => {
    if (!query.trim()) {
      toast('warning', 'Enter Search Term', 'Please enter a policy number or holder name.')
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const raw = await historySearch(query.trim(), '')
      const arr = Array.isArray(raw) ? raw : raw ? [raw] : []
      if (!arr.length || arr[0]?.message) {
        setResults([])
        toast('info', 'No Results', `No policies found for "${query}"`)
        return
      }
      setResults(arr.map(mapPolicy).filter(p => p.policyId))
    } catch {
      setResults([])
      toast('error', 'Search Failed', 'Could not load policy data.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = e => { if (e.key === 'Enter') doSearch() }

  const handleRegister = (policy) => {
    navigate('/registration', { state: { policy } })
  }

  return (
    <AppLayout pageTitle="Policy Search">
      <div style={{ padding:'24px', fontFamily:'Inter,sans-serif' }}>

        {/* Page header */}
        <div style={{ marginBottom:'24px' }}>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:T.textPrimary, letterSpacing:'-0.02em', margin:0 }}>
            Policy Search
          </h1>
          <p style={{ fontSize:'13px', color:T.textMuted, marginTop:'4px', fontWeight:500 }}>
            Search for a policy to begin claim registration.
          </p>
        </div>

        {/* Search card */}
        <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', padding:'24px', marginBottom:'20px' }}>
          <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary, marginBottom:'16px' }}>Search Policies</div>
          <div style={{ display:'flex', gap:'12px' }}>
            <div style={{ flex:1, display:'flex', alignItems:'center', gap:'8px', padding:'0 14px', height:'42px', borderRadius:'8px', background:'#F8FAFC', border:`1.5px solid ${T.border}`, transition:'border-color 0.2s' }}
              onFocusCapture={e => e.currentTarget.style.borderColor = T.primary}
              onBlurCapture={e => e.currentTarget.style.borderColor = T.border}>
              <Search size={15} style={{ color:T.textSubtle, flexShrink:0 }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by policy number (e.g. POL-78432) or holder name..."
                style={{ background:'none', border:'none', outline:'none', flex:1, fontSize:'13px', color:T.textPrimary, fontWeight:500, fontFamily:'Inter,sans-serif' }}
              />
              {query && (
                <button onClick={() => { setQuery(''); setSearched(false); setResults([]) }}
                  style={{ background:'none', border:'none', cursor:'pointer', color:T.textSubtle, display:'flex', padding:0 }}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={doSearch}
              style={{ padding:'0 24px', height:'42px', borderRadius:'8px', border:'none', background:T.primary, color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', gap:'8px', boxShadow:'0 4px 12px rgba(29,78,216,0.3)', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background=T.primaryHover; e.currentTarget.style.transform='translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background=T.primary; e.currentTarget.style.transform='' }}>
              <Search size={14} /> Search
            </button>
          </div>
          <p style={{ fontSize:'12px', color:T.textSubtle, marginTop:'10px', fontWeight:500 }}>
            Tip: You can search partial policy IDs or partial names
          </p>
        </div>

        {/* Results */}
        {!searched ? (
          <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', padding:'60px 24px', textAlign:'center' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <FileText size={24} style={{ color:T.primary }} />
            </div>
            <div style={{ fontWeight:700, fontSize:'16px', color:T.textPrimary, marginBottom:'8px' }}>Search for a Policy</div>
            <div style={{ fontSize:'13px', color:T.textMuted, maxWidth:'360px', margin:'0 auto', lineHeight:1.6 }}>
              Enter a policy number or the policy holder's name to find their policy details and register a new claim.
            </div>
          </div>
        ) : results.length === 0 ? (
          <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', padding:'60px 24px', textAlign:'center' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>🔍</div>
            <div style={{ fontWeight:700, fontSize:'16px', color:T.textPrimary, marginBottom:'8px' }}>No Policies Found</div>
            <div style={{ fontSize:'13px', color:T.textMuted }}>No results for "<strong>{query}</strong>". Try a different search term.</div>
            <button
              onClick={() => { setQuery(''); setSearched(false) }}
              style={{ marginTop:'20px', padding:'9px 20px', borderRadius:'8px', border:`1px solid ${T.border}`, background:T.card, fontSize:'13px', fontWeight:600, color:T.textSecondary, cursor:'pointer', fontFamily:'Inter,sans-serif' }}
              onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background=T.card}>
              Clear Search
            </button>
          </div>
        ) : (
          <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>
            {/* Table header */}
            <div style={{ padding:'16px 20px', borderBottom:`1px solid ${T.borderSubtle}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary }}>Search Results</div>
                <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'2px', fontWeight:500 }}>
                  {results.length} {results.length === 1 ? 'policy' : 'policies'} found
                </div>
              </div>
            </div>

            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
                    {['Policy ID', 'Holder Name', 'Date of Birth', 'Type', 'Sum Assured', 'Start Date', 'Premium Term', 'Status', 'Action'].map(h => (
                      <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((p, i) => (
                    <tr
                      key={p.policyId}
                      style={{ borderBottom:`1px solid ${T.borderSubtle}`, background: hovRow===i ? '#F8FAFC' : 'transparent', transition:'background 0.1s', cursor:'default' }}
                      onMouseEnter={() => setHovRow(i)}
                      onMouseLeave={() => setHovRow(null)}
                    >
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ fontSize:'12px', fontWeight:700, color:T.primary, fontFamily:'monospace' }}>{p.policyId}</span>
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ fontSize:'13px', fontWeight:600, color:T.textSecondary }}>{p.holderName}</div>
                        <div style={{ fontSize:'11px', color:T.textSubtle, marginTop:'2px' }}>Agent: {p.agent}</div>
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:'12px', color:T.textMuted, fontWeight:500 }}>{p.dob}</td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'6px', background:'#EFF6FF', color:'#1E40AF' }}>{p.type}</span>
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:700, color:T.textSecondary, whiteSpace:'nowrap' }}>{fmtRs(p.sumAssured)}</td>
                      <td style={{ padding:'12px 16px', fontSize:'12px', color:T.textMuted, fontWeight:500 }}>{p.startDate}</td>
                      <td style={{ padding:'12px 16px', fontSize:'12px', color:T.textMuted, fontWeight:500 }}>{p.premiumTerm}</td>
                      <td style={{ padding:'12px 16px' }}><StatusBadge status={p.status} /></td>
                      <td style={{ padding:'12px 16px' }}>
                        <button
                          onClick={() => handleRegister(p)}
                          style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'7px', border:'none', background:T.primary, color:'#fff', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s', whiteSpace:'nowrap' }}
                          onMouseEnter={e => { e.currentTarget.style.background=T.primaryHover; e.currentTarget.style.transform='translateY(-1px)' }}
                          onMouseLeave={e => { e.currentTarget.style.background=T.primary; e.currentTarget.style.transform='' }}>
                          <Plus size={12} /> Register Claim
                        </button>
                      </td>
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
