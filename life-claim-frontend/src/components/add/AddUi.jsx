import { UI_T as T } from '../../ui/theme'

export { T }

export function ROField({ label, value, span }) {
  return (
    <div style={{ gridColumn: span ? '1/-1' : 'auto' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: T.textSecondary, padding: '8px 10px', background: '#F8FAFC', borderRadius: '6px', border: `1px solid ${T.border}`, minHeight: '36px', wordBreak: 'break-word' }}>
        {value != null && value !== '' ? String(value) : '—'}
      </div>
    </div>
  )
}

export function ROGrid({ cols = 3, children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '12px' }}>{children}</div>
}

export function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: '11px', fontWeight: 700, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', paddingBottom: '6px', borderBottom: `2px solid ${T.border}` }}>
      {children}
    </div>
  )
}

export function PrimaryBtn({ children, onClick, disabled, variant = 'primary' }) {
  const bg = variant === 'danger' ? T.danger : variant === 'secondary' ? '#F8FAFC' : T.primary
  const color = variant === 'secondary' ? T.textSecondary : '#fff'
  const border = variant === 'secondary' ? `1px solid ${T.border}` : 'none'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        borderRadius: '8px',
        border,
        background: disabled ? '#CBD5E1' : bg,
        color: disabled ? '#fff' : color,
        fontSize: '12px',
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Inter,sans-serif',
      }}
    >
      {children}
    </button>
  )
}
