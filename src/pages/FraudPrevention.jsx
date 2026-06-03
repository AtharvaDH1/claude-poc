import { useState, useEffect } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useToast } from '../components/Toast'
import api from '../services/api'
import { Search, Shield, AlertTriangle, CheckCircle, Plus, Trash2, X } from 'lucide-react'

const T = { primary:'#1D4ED8', card:'#fff', border:'#E2E8F0', borderSubtle:'#F1F5F9', textPrimary:'#0F172A', textSecondary:'#334155', textMuted:'#64748B', textSubtle:'#94A3B8' }

const RULE_CATEGORIES = [
  { id:'RuleTwo',   label:'Rule II',        desc:'Policy age < 2 years at time of claim',              color:'#DC2626', bg:'#FEF2F2' },
  { id:'RuleThree', label:'Rule III',       desc:'Death within 90 days of policy issuance',            color:'#D97706', bg:'#FFFBEB' },
  { id:'RuleFour',  label:'Rule IV',        desc:'Multiple claims on same life assured',               color:'#7C3AED', bg:'#F5F3FF' },
  { id:'Custom',    label:'Custom Rules',   desc:'Organisation-specific fraud prevention rules',       color:'#1D4ED8', bg:'#EFF6FF' },
]

const DEFAULT_RULES = [
  { id:1, rule:'Policy age < 2 years at time of claim event', category:'RuleTwo',   active:true,  severity:'High',   action:'Investigate' },
  { id:2, rule:'Death within 90 days of policy issuance date', category:'RuleThree', active:true, severity:'High',   action:'Investigate' },
  { id:3, rule:'Multiple life insurance claims on same person', category:'RuleFour', active:true,  severity:'Medium', action:'Monitor' },
  { id:4, rule:'Advisor has prior repudiation history',         category:'RuleFour', active:true,  severity:'High',   action:'Escalate' },
  { id:5, rule:'Agent mobile matches claimant mobile',          category:'Custom',   active:true,  severity:'High',   action:'Investigate' },
  { id:6, rule:'Pincode classified as high-risk area',          category:'Custom',   active:true,  severity:'Medium', action:'Monitor' },
  { id:7, rule:'Bank account opened within 30 days of claim',   category:'Custom',   active:false, severity:'Low',    action:'Flag' },
  { id:8, rule:'Death certificate from unrecognised authority', category:'RuleTwo',  active:true,  severity:'High',   action:'Investigate' },
]

const SEV_COLORS = {
  High:   { bg:'#FEF2F2', color:'#DC2626', border:'#FECACA' },
  Medium: { bg:'#FFFBEB', color:'#D97706', border:'#FDE68A' },
  Low:    { bg:'#EFF6FF', color:'#1D4ED8', border:'#BFDBFE' },
}

function PincodeChecker() {
  const toast = useToast()
  const [pincode, setPincode] = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)

  const check = async () => {
    if (!pincode || pincode.length < 6) { toast('warning','Invalid','Enter a valid 6-digit pincode.'); return }
    setLoading(true)
    try {
      const res = await api.get(`/fraudprevention/safe-city/${pincode}`)
      setResult(res.data)
    } catch { setResult({ safe: true, pincode, message: 'No fraud record found.' }) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, padding:'20px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ fontWeight:700, fontSize:'14px', color:T.textPrimary, marginBottom:'4px' }}>Safe City / Pincode Check</div>
      <div style={{ fontSize:'12px', color:T.textMuted, marginBottom:'14px' }}>Check if a pincode is flagged as high-risk in the fraud prevention database.</div>
      <div style={{ display:'flex', gap:'10px', marginBottom:'14px' }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:'8px', padding:'0 12px', height:'40px', borderRadius:'8px', background:'#F8FAFC', border:`1.5px solid ${T.border}` }}>
          <Search size={14} style={{ color:T.textSubtle }}/>
          <input value={pincode} onChange={e=>setPincode(e.target.value.replace(/\D/,'').slice(0,6))} placeholder="Enter 6-digit pincode..." maxLength={6}
            style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'13px', color:T.textPrimary, fontWeight:600, fontFamily:'Inter,sans-serif' }}
            onKeyDown={e=>e.key==='Enter'&&check()}/>
        </div>
        <button onClick={check} disabled={loading} style={{ padding:'0 20px', height:'40px', borderRadius:'8px', border:'none', background:T.primary, color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 4px 12px rgba(29,78,216,0.25)' }}>
          {loading ? 'Checking...' : 'Check'}
        </button>
      </div>
      {result && (
        <div style={{ padding:'14px', borderRadius:'10px', background: result.safe?'#ECFDF5':'#FEF2F2', border:`1px solid ${result.safe?'#A7F3D0':'#FECACA'}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            {result.safe ? <CheckCircle size={18} style={{ color:'#059669' }}/> : <AlertTriangle size={18} style={{ color:'#DC2626' }}/>}
            <div>
              <div style={{ fontWeight:700, fontSize:'13px', color: result.safe?'#065F46':'#991B1B' }}>
                Pincode {result.pincode}: {result.safe ? '✓ Safe — No fraud records' : '⚠️ Flagged — High-risk area'}
              </div>
              {result.message && <div style={{ fontSize:'12px', color: result.safe?'#047857':'#B91C1C', marginTop:'2px' }}>{result.message}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FraudPrevention() {
  const toast = useToast()
  const [activeCategory, setActiveCategory] = useState('RuleTwo')
  const [rules, setRules]   = useState(DEFAULT_RULES)
  const [showAdd, setShowAdd] = useState(false)
  const [newRule, setNewRule] = useState({ rule:'', severity:'Medium', action:'Monitor', active:true })

  useEffect(() => {
    api.get('/fraudprevention/rules').then(res => {
      if (res.data?.length) setRules(res.data)
    }).catch(() => {})
  }, [])

  const categoryRules = rules.filter(r => r.category === activeCategory)
  const cat = RULE_CATEGORIES.find(c => c.id === activeCategory)

  const toggleRule = (id) => setRules(p => p.map(r => r.id===id ? {...r, active:!r.active} : r))
  const deleteRule = (id) => { setRules(p => p.filter(r => r.id!==id)); toast('success','Rule Deleted','Rule removed from fraud prevention engine.') }

  const addRule = () => {
    if (!newRule.rule.trim()) { toast('warning','Missing','Enter a rule description.'); return }
    const rule = { ...newRule, id: Date.now(), category: activeCategory }
    setRules(p => [...p, rule])
    api.post('/fraudprevention/rules', rule).catch(() => {})
    toast('success','Rule Added','New fraud prevention rule saved.')
    setShowAdd(false); setNewRule({ rule:'', severity:'Medium', action:'Monitor', active:true })
  }

  const stats = {
    total:  rules.length,
    active: rules.filter(r => r.active).length,
    high:   rules.filter(r => r.severity === 'High' && r.active).length,
  }

  return (
    <AppLayout>
      <div style={{ padding:'24px', fontFamily:'Inter,sans-serif' }}>
        <div style={{ marginBottom:'24px' }}>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:T.textPrimary, letterSpacing:'-0.02em', margin:'0 0 4px' }}>Fraud Prevention</h1>
          <p style={{ fontSize:'13px', color:T.textMuted, fontWeight:500 }}>Manage fraud detection rules and check high-risk pincodes.</p>
        </div>

        {/* Summary */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'20px' }}>
          {[
            { label:'Total Rules',  value:stats.total,  color:T.primary,  bg:'#EFF6FF' },
            { label:'Active Rules', value:stats.active, color:'#059669',  bg:'#ECFDF5' },
            { label:'High Risk',    value:stats.high,   color:'#DC2626',  bg:'#FEF2F2' },
            { label:'Rule Sets',    value:4,            color:'#7C3AED',  bg:'#F5F3FF' },
          ].map(s=>(
            <div key={s.label} style={{ background:T.card, borderRadius:'10px', padding:'16px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:'28px', fontWeight:900, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'4px', fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', gap:'20px' }}>
          {/* Category nav */}
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {RULE_CATEGORIES.map(c=>(
              <button key={c.id} onClick={()=>setActiveCategory(c.id)}
                style={{ padding:'14px 16px', borderRadius:'10px', border:`1.5px solid ${activeCategory===c.id?c.color:T.border}`, background: activeCategory===c.id?c.bg:T.card, cursor:'pointer', textAlign:'left', transition:'all 0.15s', fontFamily:'Inter,sans-serif' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color: activeCategory===c.id?c.color:T.textPrimary }}>{c.label}</div>
                <div style={{ fontSize:'11px', color:T.textMuted, marginTop:'3px', lineHeight:1.4 }}>{c.desc}</div>
                <div style={{ marginTop:'8px', fontSize:'11px', fontWeight:700, color: activeCategory===c.id?c.color:T.textSubtle }}>
                  {rules.filter(r=>r.category===c.id).length} rules
                </div>
              </button>
            ))}
          </div>

          {/* Rules panel */}
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={{ background:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>
              <div style={{ padding:'16px 20px', borderBottom:`1px solid ${T.borderSubtle}`, display:'flex', justifyContent:'space-between', alignItems:'center', background: cat.bg }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:'14px', color:cat.color }}>{cat.label}</div>
                  <div style={{ fontSize:'12px', color:T.textMuted, marginTop:'2px' }}>{categoryRules.length} rules · {categoryRules.filter(r=>r.active).length} active</div>
                </div>
                <button onClick={()=>setShowAdd(true)} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'8px', border:'none', background:T.primary, color:'#fff', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                  <Plus size={13}/> Add Rule
                </button>
              </div>

              {showAdd && (
                <div style={{ padding:'16px 20px', borderBottom:`1px solid ${T.borderSubtle}`, background:'#FAFBFF' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:'10px', alignItems:'end' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:T.textSecondary, marginBottom:'5px' }}>Rule Description *</label>
                      <input value={newRule.rule} onChange={e=>setNewRule(p=>({...p,rule:e.target.value}))} placeholder="Describe the fraud detection rule..."
                        style={{ width:'100%', height:'38px', padding:'0 12px', border:`1.5px solid ${T.border}`, borderRadius:'8px', fontSize:'13px', fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }}/>
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:T.textSecondary, marginBottom:'5px' }}>Severity</label>
                      <select value={newRule.severity} onChange={e=>setNewRule(p=>({...p,severity:e.target.value}))}
                        style={{ height:'38px', padding:'0 10px', border:`1.5px solid ${T.border}`, borderRadius:'8px', fontSize:'13px', fontFamily:'Inter,sans-serif', outline:'none', cursor:'pointer' }}>
                        {['High','Medium','Low'].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div style={{ display:'flex', gap:'8px', alignItems:'flex-end', height:'38px' }}>
                      <button onClick={addRule} style={{ height:'38px', padding:'0 16px', borderRadius:'8px', border:'none', background:'#059669', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Save</button>
                      <button onClick={()=>setShowAdd(false)} style={{ height:'38px', padding:'0 12px', borderRadius:'8px', border:`1px solid ${T.border}`, background:'#F8FAFC', fontSize:'13px', cursor:'pointer', fontFamily:'Inter,sans-serif', color:T.textMuted }}><X size={14}/></button>
                    </div>
                  </div>
                </div>
              )}

              {categoryRules.length === 0 ? (
                <div style={{ padding:'48px', textAlign:'center' }}>
                  <div style={{ fontSize:'32px', marginBottom:'10px' }}>🛡️</div>
                  <div style={{ fontWeight:700, fontSize:'14px', color:T.textMuted }}>No rules in this category</div>
                  <div style={{ fontSize:'12px', color:T.textSubtle, marginTop:'4px' }}>Click "Add Rule" to create your first rule.</div>
                </div>
              ) : (
                <div style={{ padding:'8px' }}>
                  {categoryRules.map(rule=>{
                    const sc = SEV_COLORS[rule.severity]||SEV_COLORS.Low
                    return (
                      <div key={rule.id} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 12px', borderRadius:'10px', background: rule.active?'#fff':'#F8FAFC', marginBottom:'4px', border:`1px solid ${rule.active?T.border:T.borderSubtle}`, transition:'all 0.15s' }}
                        onMouseEnter={e=>e.currentTarget.style.background=rule.active?'#F8FAFF':'#F8FAFC'}
                        onMouseLeave={e=>e.currentTarget.style.background=rule.active?'#fff':'#F8FAFC'}>
                        {/* Toggle */}
                        <button onClick={()=>toggleRule(rule.id)}
                          style={{ width:'38px', height:'22px', borderRadius:'99px', border:'none', cursor:'pointer', flexShrink:0, background:rule.active?'#10B981':'#CBD5E1', position:'relative', transition:'background 0.2s' }}>
                          <div style={{ width:'16px', height:'16px', borderRadius:'50%', background:'#fff', position:'absolute', top:'3px', left: rule.active?'19px':'3px', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
                        </button>
                        {/* Rule text */}
                        <div style={{ flex:1, fontSize:'13px', fontWeight:500, color: rule.active?T.textSecondary:T.textMuted }}>{rule.rule}</div>
                        {/* Severity */}
                        <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'99px', background:sc.bg, border:`1px solid ${sc.border}`, color:sc.color, flexShrink:0 }}>{rule.severity}</span>
                        {/* Action */}
                        <span style={{ fontSize:'11px', fontWeight:600, color:T.textSubtle, flexShrink:0, minWidth:'80px', textAlign:'right' }}>{rule.action}</span>
                        {/* Delete */}
                        <button onClick={()=>deleteRule(rule.id)} style={{ width:'28px', height:'28px', borderRadius:'6px', border:`1px solid ${T.border}`, background:'#F8FAFC', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}
                          onMouseEnter={e=>{ e.currentTarget.style.background='#FEF2F2'; e.currentTarget.style.borderColor='#FECACA' }}
                          onMouseLeave={e=>{ e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.borderColor=T.border }}>
                          <Trash2 size={12} style={{ color:'#EF4444' }}/>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pincode checker */}
            <PincodeChecker/>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
