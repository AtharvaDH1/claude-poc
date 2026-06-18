import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import GlassIcon from '../components/ui/GlassIcon';

const PIPELINE_STAGES = ['Registered', 'Pending Assessor', 'Pending Verifier', 'Approved', 'Rejected'];
const PIPELINE_COLORS = ['#9B6BFF', '#f59e0b', '#6FA8FF', '#8EF7D4', '#F6A9FF'];

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass-loading">
        <div className="glass-spinner" />
      </div>
    );
  }

  const kpis = [
    { label: 'Total Claims', value: summary?.totalClaims || 0, variant: 'lavender', icon: '📋' },
    { label: 'Active Users', value: summary?.activeUsers || 0, variant: 'mint', icon: '👥' },
    { label: 'Pending SLA', value: summary?.pendingSla || 0, variant: 'sky', icon: '⏰' },
    { label: 'Resolved Today', value: summary?.resolvedToday || 0, variant: 'pink', icon: '✅' },
  ];

  return (
    <div>
      <div className="dashboard-hero">
        <h1>Admin Overview</h1>
        <p>System health and claims pipeline at a glance.</p>
      </div>

      <div className="stat-grid">
        {kpis.map((k) => (
          <div key={k.label} className="glass-card stat-card glass-card--static">
            <div className="stat-card__label">{k.label}</div>
            <div className="stat-card__value">{k.value}</div>
            <div className="stat-card__icon-wrap">
              <GlassIcon variant={k.variant} size="sm">{k.icon}</GlassIcon>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card chart-card glass-card--static" style={{ marginBottom: 20 }}>
        <h3 className="chart-card__title">Claims Pipeline</h3>
        <p className="chart-card__subtitle">Current stage distribution</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {PIPELINE_STAGES.map((stage, i) => {
            const count = summary?.pipeline?.[stage] || 0;
            return (
              <div
                key={stage}
                style={{
                  textAlign: 'center', padding: 16, borderRadius: 20,
                  background: `rgba(${i === 0 ? '155,107,255' : i === 1 ? '245,158,11' : i === 2 ? '111,168,255' : i === 3 ? '142,247,212' : '246,169,255'}, 0.1)`,
                  border: `1px solid ${PIPELINE_COLORS[i]}30`,
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 700, color: PIPELINE_COLORS[i] }}>{count}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{stage}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="glass-card panel-card glass-card--static">
          <h3 className="panel-card__title">SLA Status</h3>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#DC2626' }}>{summary?.slaBreached || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Breached (&gt;3 days)</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#B45309' }}>{summary?.slaAtRisk || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>At Risk (1–3 days)</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#047857' }}>{summary?.slaOnTrack || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>On Track</div>
            </div>
          </div>
        </div>

        <div className="glass-card panel-card glass-card--static">
          <h3 className="panel-card__title">Quick Actions</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href="/admin/audit" className="glass-btn glass-btn--sm">View Audit Log</a>
            <a href="/admin/claim-search" className="glass-btn glass-btn--sm glass-btn--ghost">Search Claims</a>
            <a href="/user-manager" className="glass-btn glass-btn--sm glass-btn--primary">Manage Users</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
