import { WS } from './workspaceUi'

/** Read-only acuity decision from registration (claims table). */
export default function AcuityDecisionPanel({ acuity, inline = false }) {
  if (!acuity) return null

  const final = acuity.finalAcuityDecision || acuity.final || 'NOT FLAGGED'
  const claimant = acuity.claimantAcuityDecision || acuity.claimant || 'NOT FLAGGED'
  const payee = acuity.payeeAcuityDecision || acuity.payee || 'NOT FLAGGED'
  const flagged = final === 'FLAGGED'

  if (inline) {
    const chip = (label, value) => (
      <span style={{ fontSize: '11px', fontWeight: 600, color: WS.textMuted }}>
        {label}:{' '}
        <span style={{ color: value === 'FLAGGED' ? '#B45309' : WS.textSecondary, fontWeight: 700 }}>{value}</span>
      </span>
    )
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        padding: '6px 12px',
        borderRadius: '8px',
        background: flagged ? '#FFFBEB' : '#F8FAFC',
        border: `1px solid ${flagged ? '#FDE68A' : WS.border}`,
      }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: flagged ? '#B45309' : WS.textPrimary }}>Accuity</span>
        {chip('Claimant', claimant)}
        <span style={{ color: '#E2E8F0' }}>|</span>
        {chip('Payee', payee)}
        <span style={{ color: '#E2E8F0' }}>|</span>
        <span style={{ fontSize: '11px', fontWeight: 800, color: flagged ? '#92400E' : '#065F46' }}>Final: {final}</span>
      </div>
    )
  }

  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: '10px',
      background: flagged ? '#FFFBEB' : '#F8FAFC',
      border: `1px solid ${flagged ? '#FDE68A' : WS.border}`,
      marginBottom: '12px',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 800, color: flagged ? '#B45309' : WS.textPrimary, marginBottom: '6px' }}>
        Accuity decision
      </div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: WS.textSecondary, lineHeight: 1.5 }}>
        Claimant: {claimant} · Payee: {payee} ·{' '}
        <span style={{ fontWeight: 800, color: flagged ? '#92400E' : '#065F46' }}>Final: {final}</span>
      </div>
    </div>
  )
}
