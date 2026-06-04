import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import AppLayout from '../layouts/AppLayout'
import { searchClaims } from '../services/claimsService'
import { Search, Eye, X, Clock, CheckCircle, XCircle, ChevronDown } from 'lucide-react'

const T = {
  primary: '#1D4ED8', primaryHover: '#1E40AF',
  pageBg: '#F1F5F9', card: '#FFFFFF',
  border: '#E2E8F0', borderSubtle: '#F1F5F9',
  textPrimary: '#0F172A', textSecondary: '#334155',
  textMuted: '#64748B', textSubtle: '#94A3B8',
}

const fmt = n => new Intl.NumberFormat('en-IN').format(n)
const fmtRs = n => `₹${n >= 1e7 ? (n/1e7).toFixed(1)+'Cr' : n >= 1e5 ? (n/1e5).toFixed(1)+'L' : fmt(n)}`

const STATUS_STYLES = {
  Pending:  { bg:'#FFFBEB', border:'#FDE68A', color:'#92400E', Icon: Clock        },
  Approved: { bg:'#ECFDF5', border:'#A7F3D0', color:'#065F46', Icon: CheckCircle  },
  Rejected: { bg:'#FEF2F2', border:'#FECACA', color:'#991B1B', Icon: XCircle      },
}

const PRIORITY_STYLES = {
  High:   { bg:'#FEF2F2', color:'#DC2626' },
  Normal: { bg:'#F8FAFC', color:'#64748B' },
  Low:    { bg:'#ECFDF5', color:'#059669' },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.Pending
  const Icon = s.Icon
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:s.bg, border:`1px solid ${s.border}`, color:s.color, fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'99px' }}>
      <Icon size={10} />{status}
    </span>
  )
}

export default function ClaimSearch() {
  const navigate = useNavigate()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [searched, setSearched] = useState(false)
  const [results, setResults] = useState([])
  const [hovRow, setHovRow] = useState(null)
  const [priorityOpen, setPriorityOpen] = useState(false)

  const doSearch = async () => {
    setSearched(true)
    try {
      const data = await searchClaims({ q: query, status: statusFilter !== 'All' ? statusFilter : undefined })
      const claims = (data.claims || data || []).map(c => ({
        id:       c.CLAIM_NUMBER || c.id,
        policy:   c.POLICY_ID    || c.policy    || '',
        claimant: c.CREATED_BY   || c.claimant  || 'Unknown',
        type:     c.CLAIM_TYPE   || c.type      || 'Death Claim',
        status:   c.CLAIM_STATUS || c.status    || 'Pending',
        priority: c.priority     || 'Normal',
        amount:   c.amount       || 0,
        created:  (c.CREATED_AT  || c.created   || '').toString().split('T')[0],
        daysOpen: c.daysOpen     || 0,
      }))
      const filtered = priorityFilter !== 'All' ? claims.filter(c => c.priority === priorityFilter) : claims
      setResults(filtered)
      if (filtered.length === 0) toast('info','No Results','No claims match your search criteria.')
    } catch {
      setResults([])
      toast('error', 'Search Failed', 'Could not search claims.')
    }
  }

  const handleKeyDown = e => { if (e.key === 'Enter') doSearch() }

  const handleView = (claim) => {
    navigate(`/claim-view/${claim.id}`)
  }

  return (
    <AppLayout pageTitle="Claim Search">
      <div style={{ padding:'24px', fontFamily:'Inter,sans-serif' }}>

        {/* Page header */}
        <div style={{ marginBottom:'24px' }}>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:T.textPrimary, letterSpacing:'-0.02em', margin:0 }}>Claim Search</h1>
          <p style={{ fontSize:'13px', color:T.textMuted, marginTop:'4px', fontWeight:500 }}>Search and manage existing claims.</p>
        </div>

        {/* Search bar */}
        <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', padding:'24px', marginBottom:'20px' }}>
          <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary, marginBottom:'16px' }}>Search Claims</div>
          <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
            {/* Search input */}
            <div style={{ flex:1, minWidth:'280px', display:'flex', alignItems:'center', gap:'8px', padding:'0 14px', height:'42px', borderRadius:'8px', background:'#F8FAFC', border:`1.5px solid ${T.border}`, transition:'border-color 0.2s' }}
              onFocusCapture={e => e.currentTarget.style.borderColor = T.primary}
              onBlurCapture={e => e.currentTarget.style.borderColor = T.border}>
              <Search size={15} style={{ color:T.textSubtle, flexShrink:0 }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by claim ID, policy number, or claimant name..."
                style={{ background:'none', border:'none', outline:'none', flex:1, fontSize:'13px', color:T.textPrimary, fontWeight:500, fontFamily:'Inter,sans-serif' }}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ background:'none', border:'none', cursor:'pointer', color:T.textSubtle, display:'flex', padding:0 }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status filter pills */}
            <div style={{ display:'flex', gap:'4px', background:'#F8FAFC', border:`1px solid ${T.border}`, borderRadius:'8px', padding:'3px', alignSelf:'center' }}>
              {['All','Pending','Approved','Rejected'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  style={{ padding:'6px 12px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:700, fontFamily:'Inter,sans-serif', transition:'all 0.15s', background: statusFilter===s ? T.primary : 'transparent', color: statusFilter===s ? '#fff' : T.textSubtle, boxShadow: statusFilter===s ? '0 2px 6px rgba(29,78,216,0.25)' : 'none' }}>
                  {s}
                </button>
              ))}
            </div>

            {/* Priority dropdown */}
            <div style={{ position:'relative' }}>
              <button
                onClick={() => setPriorityOpen(p => !p)}
                style={{ display:'flex', alignItems:'center', gap:'8px', padding:'0 14px', height:'42px', borderRadius:'8px', border:`1.5px solid ${T.border}`, background:'#F8FAFC', fontSize:'13px', fontWeight:600, color:T.textSecondary, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.primary}
                onMouseLeave={e => { if (!priorityOpen) e.currentTarget.style.borderColor = T.border }}>
                Priority: {priorityFilter}
                <ChevronDown size={13} style={{ color:T.textSubtle, transform: priorityOpen?'rotate(180deg)':'', transition:'transform 0.2s' }} />
              </button>
              {priorityOpen && (
                <div style={{ position:'absolute', top:'48px', right:0, background:T.card, border:`1px solid ${T.border}`, borderRadius:'10px', boxShadow:'0 8px 24px rgba(0,0,0,0.1)', zIndex:10, minWidth:'130px', overflow:'hidden' }}>
                  {['All','High','Normal','Low'].map(p => (
                    <button key={p} onClick={() => { setPriorityFilter(p); setPriorityOpen(false) }}
                      style={{ width:'100%', padding:'9px 14px', border:'none', background: priorityFilter===p ? '#F0F6FF' : 'transparent', fontSize:'13px', fontWeight: priorityFilter===p ? 700 : 500, color: priorityFilter===p ? T.primary : T.textSecondary, cursor:'pointer', textAlign:'left', fontFamily:'Inter,sans-serif', transition:'background 0.1s' }}
                      onMouseEnter={e => { if (priorityFilter!==p) e.currentTarget.style.background='#F8FAFC' }}
                      onMouseLeave={e => { if (priorityFilter!==p) e.currentTarget.style.background='transparent' }}>
                      {p}
                    </button>
                  ))}
                </div>
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
        </div>

        {/* Results table */}
        {!searched ? (
          <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', padding:'60px 24px', textAlign:'center' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Search size={24} style={{ color:T.primary }} />
            </div>
            <div style={{ fontWeight:700, fontSize:'16px', color:T.textPrimary, marginBottom:'8px' }}>Search for Claims</div>
            <div style={{ fontSize:'13px', color:T.textMuted, maxWidth:'360px', margin:'0 auto', lineHeight:1.6 }}>
              Enter a claim ID, policy number, or claimant name to find existing claims.
            </div>
          </div>
        ) : (
          <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:`1px solid ${T.borderSubtle}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary }}>Search Results</div>
                <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'2px', fontWeight:500 }}>{results.length} claim{results.length!==1?'s':''} found</div>
              </div>
            </div>
            {results.length === 0 ? (
              <div style={{ padding:'60px 24px', textAlign:'center' }}>
                <div style={{ fontSize:'36px', marginBottom:'12px' }}>🔍</div>
                <div style={{ fontWeight:700, fontSize:'14px', color:T.textMuted }}>No claims found</div>
                <div style={{ fontSize:'13px', color:T.textSubtle, marginTop:'4px' }}>Try adjusting your search or filters.</div>
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#FAFAFA', borderBottom:`2px solid ${T.border}` }}>
                      {['Claim ID','Policy ID','Claimant','Type','Status','Priority','Amount','Created','Action'].map(h => (
                        <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:700, color:T.textSubtle, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((c, i) => {
                      const pr = PRIORITY_STYLES[c.priority] || PRIORITY_STYLES.Normal
                      const overdue = c.daysOpen > 10
                      return (
                        <tr key={c.id}
                          style={{ borderBottom:`1px solid ${T.borderSubtle}`, background: hovRow===i ? '#F8FAFC':'transparent', transition:'background 0.1s' }}
                          onMouseEnter={() => setHovRow(i)}
                          onMouseLeave={() => setHovRow(null)}>
                          <td style={{ padding:'12px 16px' }}>
                            <div style={{ fontSize:'12px', fontWeight:700, color:T.primary, fontFamily:'monospace' }}>{c.id}</div>
                            <div style={{ fontSize:'11px', color:T.textSubtle, marginTop:'2px' }}>Open {c.daysOpen}d {overdue ? '⚠️':''}</div>
                          </td>
                          <td style={{ padding:'12px 16px', fontSize:'12px', fontWeight:600, color:T.textMuted, fontFamily:'monospace' }}>{c.policy}</td>
                          <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:600, color:T.textSecondary }}>{c.claimant}</td>
                          <td style={{ padding:'12px 16px', fontSize:'12px', color:T.textMuted, fontWeight:500, whiteSpace:'nowrap' }}>{c.type}</td>
                          <td style={{ padding:'12px 16px' }}><StatusBadge status={c.status} /></td>
                          <td style={{ padding:'12px 16px' }}>
                            <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'6px', background:pr.bg, color:pr.color }}>{c.priority}</span>
                          </td>
                          <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:700, color:T.textSecondary, whiteSpace:'nowrap' }}>{fmtRs(c.amount)}</td>
                          <td style={{ padding:'12px 16px', fontSize:'12px', color:T.textMuted, fontWeight:500 }}>{c.created}</td>
                          <td style={{ padding:'12px 16px' }}>
                            <button
                              onClick={() => handleView(c)}
                              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'7px', border:`1px solid ${T.border}`, background:'#F8FAFC', color:T.textSecondary, fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s', whiteSpace:'nowrap' }}
                              onMouseEnter={e => { e.currentTarget.style.background='#EFF6FF'; e.currentTarget.style.color=T.primary; e.currentTarget.style.borderColor=T.primary+'60' }}
                              onMouseLeave={e => { e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.color=T.textSecondary; e.currentTarget.style.borderColor=T.border }}>
                              <Eye size={12} /> View Claim
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
