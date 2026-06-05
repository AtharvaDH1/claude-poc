/** Hover card for claim number (Pool / My Task / Dashboard pattern). */
const T = {
  primary: '#1D4ED8',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
}

function statusStyle(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('pending assessor')) return { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' }
  if (s.includes('pending verifier')) return { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF' }
  if (s.includes('approved') || s.includes('accept')) return { bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46' }
  if (s.includes('reject')) return { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B' }
  return { bg: '#F8FAFC', border: T.border, color: T.textMuted }
}

export default function ClaimHoverPreview({ claim, x, y }) {
  if (!claim) return null
  const sc = statusStyle(claim.status)
  const left = x + 280 > (typeof window !== 'undefined' ? window.innerWidth : 1200) ? x - 296 : x + 18
  const top = Math.max(8, Math.min(y - 60, (typeof window !== 'undefined' ? window.innerHeight : 800) - 280))

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        width: '278px',
        zIndex: 9999,
        background: '#fff',
        borderRadius: '14px',
        padding: '16px 18px',
        border: `1px solid ${T.border}`,
        boxShadow: '0 20px 48px rgba(0,0,0,0.14)',
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '13px', color: T.primary, fontFamily: 'monospace' }}>{claim.claimId}</div>
          <div style={{ fontSize: '12px', color: T.textMuted, marginTop: '2px' }}>Policy {claim.policyId || '—'}</div>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '99px', background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>
          {claim.status || '—'}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
        {[['Role', claim.role], ['Created', claim.createdOn], ['By', claim.createdBy], ['Type', claim.claimType]].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.textSubtle, textTransform: 'uppercase' }}>{k}</div>
            <div style={{ fontWeight: 600, color: T.textSecondary, marginTop: '2px' }}>{v || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
