const T = {
  primary: '#1D4ED8',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textMuted: '#64748B',
}

/** Centered success dialog — same pattern as registration claim submit. */
export default function ClaimSuccessModal({
  open,
  title,
  message,
  claimNo,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}) {
  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '20px',
          width: 'min(460px, 94vw)',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#059669,#047857)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(5,150,105,0.4)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M5 14L11 20L23 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 900, color: T.textPrimary, letterSpacing: '-0.02em', marginBottom: '8px' }}>
          {title}
        </div>
        <div style={{ fontSize: '14px', color: T.textMuted, marginBottom: '20px', lineHeight: 1.55 }}>
          {message}
        </div>
        {claimNo && (
          <div
            style={{
              padding: '16px 20px',
              background: '#ECFDF5',
              borderRadius: '12px',
              border: '1px solid #A7F3D0',
              marginBottom: '24px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Claim Number
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#065F46', fontFamily: 'monospace' }}>
              {claimNo}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          {secondaryLabel && onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: '10px',
                border: `1px solid ${T.border}`,
                background: '#F8FAFC',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                color: T.textMuted,
                fontFamily: 'Inter,sans-serif',
              }}
            >
              {secondaryLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onPrimary}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: '10px',
              border: 'none',
              background: T.primary,
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Inter,sans-serif',
              boxShadow: '0 4px 12px rgba(29,78,216,0.3)',
            }}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
