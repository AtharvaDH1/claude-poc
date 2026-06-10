import { WS, ROField, EditableField } from '../workspaceUi'
import { formatCalcAmountSummary } from '../../../../util/workspaceDisplay'

const fmtRs = (n) => (n ? `₹${Number(n).toLocaleString('en-IN')}` : '—')

export default function DecisionWorkspaceTab({
  claim,
  calcAmt,
  assessorCanEdit,
  verifierCanEdit,
  accessorDecision,
  setAccessorDecision,
  accessorReason,
  setAccessorReason,
  accessorAmount,
  setAccessorAmount,
  verificationStatus,
  setVerificationStatus,
  verificationRemarks,
  setVerificationRemarks,
  submitGuard,
  submitting,
  onSubmit,
}) {
  const calcRows = calcAmt ? formatCalcAmountSummary(calcAmt) : []

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', fontWeight: 800, color: WS.primary, textTransform: 'uppercase', marginBottom: '12px' }}>
          System decision (from registration)
        </div>
        {claim?.sysRecommendation ? (
          <div style={{ padding: '16px', borderRadius: '10px', background: claim.sysRecommendation === 'Approve' ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${claim.sysRecommendation === 'Approve' ? '#A7F3D0' : '#FECACA'}` }}>
            <div style={{ fontSize: '15px', fontWeight: 900, color: claim.sysRecommendation === 'Approve' ? '#065F46' : '#991B1B' }}>
              {claim.sysRecommendation}
            </div>
            <div style={{ fontSize: '12px', marginTop: '6px', color: WS.textMuted }}>
              Payable {fmtRs(claim.sysPayableAmount)} · Risk {claim.sysRiskScore || '—'}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: WS.textMuted }}>No system decision on file.</div>
        )}
      </div>

      {calcRows.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '16px', background: '#F8FAFC', borderRadius: '10px', border: `1px solid ${WS.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: WS.textSubtle, marginBottom: '12px' }}>
            Payable amount breakdown (Transaction API)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
            {calcRows.map((row) => (
              <div key={row.label} style={{ padding: '10px 12px', background: '#fff', borderRadius: '8px', border: `1px solid ${WS.borderSubtle}` }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: WS.textSubtle, textTransform: 'uppercase' }}>{row.label}</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: WS.textPrimary, marginTop: '4px' }}>{row.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {assessorCanEdit && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: WS.primary, textTransform: 'uppercase', marginBottom: '12px' }}>Assessor decision</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <EditableField label="Decision" value={accessorDecision} onChange={setAccessorDecision} disabled={!assessorCanEdit} options={['Approve', 'Reject', 'Refer to Verifier', 'Request More Documents', 'Repudiate']} />
            <EditableField label="Amount" value={accessorAmount} onChange={setAccessorAmount} disabled={!assessorCanEdit} />
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: WS.textSecondary }}>Reason</label>
              <textarea value={accessorReason} onChange={(e) => setAccessorReason(e.target.value)} readOnly={!assessorCanEdit} rows={4} style={{ width: '100%', marginTop: '4px', padding: '10px', border: `1.5px solid ${WS.border}`, borderRadius: '8px', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>
      )}

      {verifierCanEdit && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: WS.primary, textTransform: 'uppercase', marginBottom: '12px' }}>Verification details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <EditableField label="Status" value={verificationStatus} onChange={setVerificationStatus} disabled={!verifierCanEdit} options={['Pending', 'Verified', 'Rejected']} />
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: '11px', fontWeight: 700 }}>Remarks</label>
              <textarea value={verificationRemarks} onChange={(e) => setVerificationRemarks(e.target.value)} rows={3} style={{ width: '100%', marginTop: '4px', padding: '10px', border: `1px solid ${WS.border}`, borderRadius: '8px', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: 800, color: WS.textSubtle, textTransform: 'uppercase', marginBottom: '12px' }}>Summary — submit</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
          <ROField label="Claim" value={claim?.claimId} />
          <ROField label="Policy" value={claim?.policyId} />
          <ROField label="Status" value={claim?.status} />
          <ROField label="Workflow role" value={claim?.claimRole} />
        </div>
        <div style={{ padding: '16px', borderRadius: '10px', background: submitGuard.ok ? '#ECFDF5' : '#FFFBEB', border: `1px solid ${submitGuard.ok ? '#A7F3D0' : '#FDE68A'}` }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: submitGuard.ok ? '#065F46' : '#92400E', marginBottom: submitGuard.ok ? '12px' : 0 }}>{submitGuard.ok ? 'Ready to submit.' : submitGuard.hint}</div>
          {submitGuard.ok && (
            <button type="button" onClick={onSubmit} disabled={submitting} style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#059669', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', fontFamily: 'Inter,sans-serif' }}>
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
