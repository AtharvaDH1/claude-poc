import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import adminService from '../services/adminService'
import { AlertTriangle, Clock, Users, FileText, ClipboardList } from 'lucide-react'
import IntegrationsPanel from '../components/admin/IntegrationsPanel'
import LegacyRoutesPanel from '../components/admin/LegacyRoutesPanel'

const T = {
  primary: '#1D4ED8',
  card: '#fff',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textMuted: '#64748B',
}

const SLA_VIEWS = [
  { view: 'slaBreached', label: 'SLA breached (>3 days)', color: '#DC2626', icon: AlertTriangle },
  { view: 'slaAtRisk', label: 'SLA at risk (1–3 days)', color: '#D97706', icon: Clock },
  { view: 'openByRole', label: 'Open by role', color: T.primary, icon: Users },
  { view: 'rejected30d', label: 'Rejected (30 days)', color: '#64748B', icon: FileText },
]

export default function AdminOverview() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService.getSummary().then(setSummary).finally(() => setLoading(false))
  }, [])

  const s = summary || {}
  const rejectionPct = s.quality?.rejectionRate30d != null
    ? `${Math.round(s.quality.rejectionRate30d * 100)}%`
    : '—'

  return (
    <AppLayout pageTitle="Admin overview" pageSubtitle="Platform KPIs and SLA drill-downs">
      <div style={{ padding: '24px', fontFamily: 'Inter,sans-serif' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px', color: T.textPrimary }}>Admin overview</h1>
          <p style={{ fontSize: '13px', color: T.textMuted, margin: 0 }}>
            Live data from <code>GET /api/admin/summary</code> · pending SLA uses a fixed 3-day rule (J4).
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: T.textMuted }}>Loading summary…</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Total claims', value: s.totalClaims },
                { label: 'Pending', value: s.pending, color: '#D97706' },
                { label: 'Approved', value: s.approved, color: '#059669' },
                { label: 'Rejected', value: s.rejected, color: '#DC2626' },
                { label: 'Registered (7d)', value: s.registeredThisWeek },
                { label: 'Today registered', value: s.today?.registered },
                { label: 'Today closed', value: s.today?.closed },
                { label: 'Rejection rate (30d)', value: rejectionPct, color: '#7C3AED' },
              ].map((k) => (
                <div key={k.label} style={{ background: T.card, borderRadius: '10px', padding: '14px', border: `1px solid ${T.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: k.color || T.primary }}>{k.value ?? 0}</div>
                  <div style={{ fontSize: '11px', color: T.textMuted, marginTop: '4px', fontWeight: 600 }}>{k.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Pre Assessor open', value: s.workload?.preAssessorOpen },
                { label: 'Assessor open', value: s.workload?.assessorOpen },
                { label: 'Verifier open', value: s.workload?.verifierOpen },
              ].map((w) => (
                <div key={w.label} style={{ background: '#F8FAFC', borderRadius: '10px', padding: '14px', border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: T.textPrimary }}>{w.value ?? 0}</div>
                  <div style={{ fontSize: '12px', color: T.textMuted }}>{w.label}</div>
                </div>
              ))}
            </div>

            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px', color: T.textPrimary }}>SLA & workload drill-down</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              {SLA_VIEWS.map(({ view, label, color, icon: Icon }) => {
                const count = view === 'slaBreached' ? s.sla?.breached
                  : view === 'slaAtRisk' ? s.sla?.atRisk
                  : view === 'rejected30d' ? (s.rejected30dClaims?.length ?? s.quality?.last30Rejected)
                  : (s.openByRoleClaims?.length ?? s.pending)
                return (
                  <button
                    key={view}
                    type="button"
                    onClick={() => navigate(`/admin/claim-search?view=${view}`)}
                    style={{
                      textAlign: 'left',
                      padding: '16px',
                      borderRadius: '12px',
                      border: `1px solid ${T.border}`,
                      background: T.card,
                      cursor: 'pointer',
                      fontFamily: 'Inter,sans-serif',
                      transition: 'box-shadow 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <Icon size={18} style={{ color }} />
                      <span style={{ fontWeight: 700, fontSize: '13px', color: T.textPrimary }}>{label}</span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color }}>{count ?? 0}</div>
                    <div style={{ fontSize: '11px', color: T.textMuted, marginTop: '6px' }}>View list →</div>
                  </button>
                )
              })}
            </div>

            <IntegrationsPanel />
            <LegacyRoutesPanel />

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
              <Link
                to="/audit-log"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', background: '#EFF6FF', color: T.primary, fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}
              >
                <ClipboardList size={16} /> Login session audit
              </Link>
              <Link
                to="/user-management"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: `1px solid ${T.border}`, color: T.textMuted, fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}
              >
                User CRUD (main app)
              </Link>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
