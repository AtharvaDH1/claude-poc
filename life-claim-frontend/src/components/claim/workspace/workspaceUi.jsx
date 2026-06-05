export const WS = {
  primary: '#1D4ED8',
  card: '#fff',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
}

export function Accordion({ title, subtitle, open, onToggle, children }) {
  return (
    <div style={{ border: `1px solid ${WS.border}`, borderRadius: '10px', marginBottom: '12px', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '14px 18px',
          border: 'none',
          background: open ? '#EFF6FF' : '#FAFAFA',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'Inter,sans-serif',
        }}
      >
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: WS.textPrimary }}>{title}</div>
          {subtitle && <div style={{ fontSize: '11px', color: WS.textMuted, marginTop: '2px' }}>{subtitle}</div>}
        </div>
        <span style={{ fontSize: '18px', color: WS.textSubtle }}>{open ? '−' : '+'}</span>
      </button>
      {open && <div style={{ padding: '18px', borderTop: `1px solid ${WS.borderSubtle}` }}>{children}</div>}
    </div>
  )
}

export function ROField({ label, value, span }) {
  return (
    <div style={{ gridColumn: span ? '1/-1' : 'auto' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: WS.textSubtle, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: WS.textSecondary, padding: '8px 10px', background: '#F8FAFC', borderRadius: '6px', border: `1px solid ${WS.border}`, minHeight: '36px' }}>
        {value ?? '—'}
      </div>
    </div>
  )
}

export function EditableField({ label, value, onChange, disabled, type = 'text', options }) {
  const base = {
    width: '100%',
    height: '38px',
    padding: '0 10px',
    border: `1.5px solid ${WS.border}`,
    borderRadius: '7px',
    background: disabled ? '#F8FAFC' : '#fff',
    fontSize: '13px',
    fontFamily: 'Inter,sans-serif',
    color: disabled ? WS.textMuted : WS.textPrimary,
    boxSizing: 'border-box',
  }
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: WS.textSecondary, marginBottom: '4px', textTransform: 'uppercase' }}>{label}</label>
      {options ? (
        <select value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={{ ...base, cursor: disabled ? 'default' : 'pointer' }}>
          <option value="">—</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} readOnly={disabled} style={base} />
      )}
    </div>
  )
}

export function SimpleTable({ columns, rows, empty = 'No records.' }) {
  if (!rows?.length) return <div style={{ fontSize: '13px', color: WS.textSubtle, padding: '12px' }}>{empty}</div>
  return (
    <div style={{ overflowX: 'auto', border: `1px solid ${WS.border}`, borderRadius: '8px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#FAFAFA', borderBottom: `2px solid ${WS.border}` }}>
            {columns.map((c) => (
              <th key={c.key} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: WS.textSubtle, textTransform: 'uppercase' }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${WS.borderSubtle}` }}>
              {columns.map((c) => (
                <td key={c.key} style={{ padding: '9px 12px', fontSize: '12px', color: WS.textSecondary }}>{row[c.key] ?? '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
