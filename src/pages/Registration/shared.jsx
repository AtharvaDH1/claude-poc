import React, { useState } from 'react'
/* Shared UI primitives for Registration tabs */
export const T = {
  primary:'#1D4ED8', primaryHover:'#1E40AF',
  card:'#FFFFFF', border:'#E2E8F0', borderSubtle:'#F1F5F9',
  textPrimary:'#0F172A', textSecondary:'#334155', textMuted:'#64748B', textSubtle:'#94A3B8',
  success:'#059669', warning:'#D97706', danger:'#DC2626',
}

export const Label = ({ children, required }) => (
  <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:T.textSecondary, marginBottom:'5px' }}>
    {children}{required && <span style={{ color:T.danger, marginLeft:'2px' }}>*</span>}
  </label>
)

export const inp = (focused, err, readOnly) => ({
  width:'100%', height:'38px', padding:'0 10px',
  border:`1.5px solid ${err?'#FCA5A5':focused?T.primary:T.border}`,
  borderRadius:'7px',
  background: readOnly?'#F8FAFC': err?'#FFF5F5': focused?'#fff':'#FAFAFA',
  fontSize:'13px', fontWeight:500, color: readOnly?T.textMuted:T.textPrimary,
  fontFamily:'Inter,sans-serif', outline:'none',
  boxShadow: focused&&!readOnly ? `0 0 0 3px rgba(29,78,216,0.1)`:err?'0 0 0 3px rgba(239,68,68,0.08)':'none',
  transition:'all 0.15s ease', boxSizing:'border-box',
})

export function Field({ label, required, children, half, full, error }) {
  return (
    <div style={{ gridColumn: full?'1/-1': half?undefined:'auto' }}>
      {label && <Label required={required}>{label}</Label>}
      {children}
      {error && <div style={{ fontSize:'11px', color:T.danger, marginTop:'3px', fontWeight:600 }}>{error}</div>}
    </div>
  )
}

export function Input({ value, onChange, placeholder, type='text', readOnly=false, error, onFocus, onBlur, maxLength }) {
  const [focused, setFocused] = React.useState(false)
  return (
    <input type={type} value={value||''} onChange={onChange} placeholder={placeholder} readOnly={readOnly} maxLength={maxLength}
      style={inp(focused, error, readOnly)}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
    />
  )
}

export function Select({ value, onChange, options, readOnly=false, error }) {
  const [focused, setFocused] = React.useState(false)
  return (
    <select value={value||''} onChange={onChange} disabled={readOnly}
      style={{ ...inp(focused, error, readOnly), cursor: readOnly?'default':'pointer', appearance:'auto' }}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}>
      <option value=''>-- Select --</option>
      {options.map(o => typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>
      )}
    </select>
  )
}

export function Textarea({ value, onChange, placeholder, rows=3, readOnly=false }) {
  const [focused, setFocused] = React.useState(false)
  return (
    <textarea value={value||''} onChange={onChange} placeholder={placeholder} rows={rows} readOnly={readOnly}
      style={{ ...inp(focused, false, readOnly), height:'auto', padding:'8px 10px', resize:'vertical' }}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
    />
  )
}

export function SectionHeader({ title, subtitle, open, onToggle, done }) {
  return (
    <button onClick={onToggle} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', background: open?'#EFF6FF':'#FAFAFA', border:'none', cursor:'pointer', borderBottom:`1px solid ${T.border}`, fontFamily:'Inter,sans-serif', transition:'background 0.15s' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'20px', height:'20px', borderRadius:'50%', background: done?T.success:open?T.primary:'#E2E8F0', color:'#fff', fontSize:'10px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {done ? '✓' : open ? '●' : '○'}
        </div>
        <div style={{ textAlign:'left' }}>
          <div style={{ fontSize:'13px', fontWeight:700, color: open?T.primary:T.textPrimary }}>{title}</div>
          {subtitle && <div style={{ fontSize:'11px', color:T.textMuted, marginTop:'1px' }}>{subtitle}</div>}
        </div>
      </div>
      <span style={{ color:T.textMuted, fontSize:'18px', lineHeight:1 }}>{open ? '▲' : '▼'}</span>
    </button>
  )
}

export function Grid({ cols=2, children }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:'14px' }}>
      {children}
    </div>
  )
}

export function SubTabNav({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', gap:'4px', background:'#F8FAFC', border:`1px solid ${T.border}`, borderRadius:'8px', padding:'3px', marginBottom:'20px', width:'fit-content' }}>
      {tabs.map(t => (
        <button key={t} onClick={()=>onChange(t)}
          style={{ padding:'6px 16px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:700, fontFamily:'Inter,sans-serif', transition:'all 0.15s', background:active===t?T.primary:'transparent', color:active===t?'#fff':T.textSubtle, boxShadow:active===t?'0 2px 6px rgba(29,78,216,0.25)':'none' }}>
          {t}
        </button>
      ))}
    </div>
  )
}

export function Btn({ children, onClick, variant='primary', size='md', disabled=false, type='button', icon }) {
  const bg = { primary:T.primary, secondary:'#F8FAFC', success:T.success, danger:T.danger }[variant]
  const col = variant==='secondary' ? T.textSecondary : '#fff'
  const brd = variant==='secondary' ? T.border : 'transparent'
  const pad = size==='sm' ? '6px 14px' : size==='lg' ? '12px 28px' : '9px 20px'
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ display:'flex', alignItems:'center', gap:'7px', padding:pad, borderRadius:'8px', border:`1px solid ${brd}`, background: disabled?'#CBD5E1':bg, color: disabled?'#94A3B8':col, fontSize:'13px', fontWeight:700, cursor:disabled?'not-allowed':'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s', whiteSpace:'nowrap', boxShadow: variant==='primary'&&!disabled?'0 4px 12px rgba(29,78,216,0.25)':variant==='success'&&!disabled?'0 4px 12px rgba(5,150,105,0.25)':variant==='danger'&&!disabled?'0 4px 12px rgba(220,38,38,0.2)':'none' }}
      onMouseEnter={e=>{ if(!disabled&&variant!=='secondary') { e.currentTarget.style.filter='brightness(0.9)'; e.currentTarget.style.transform='translateY(-1px)' } }}
      onMouseLeave={e=>{ e.currentTarget.style.filter=''; e.currentTarget.style.transform='' }}>
      {children}
    </button>
  )
}

export function InfoCard({ children, type='info' }) {
  const styles = { info:{ bg:'#EFF6FF', border:'#BFDBFE', color:'#1E40AF' }, warning:{ bg:'#FFFBEB', border:'#FDE68A', color:'#92400E' }, success:{ bg:'#ECFDF5', border:'#A7F3D0', color:'#065F46' }, danger:{ bg:'#FEF2F2', border:'#FECACA', color:'#991B1B' } }
  const s = styles[type]
  return <div style={{ padding:'12px 14px', borderRadius:'8px', background:s.bg, border:`1px solid ${s.border}`, color:s.color, fontSize:'13px', fontWeight:500, lineHeight:1.5 }}>{children}</div>
}

