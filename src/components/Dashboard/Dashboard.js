import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import dashboardService from '../../services/dashboardService';
import GlassIcon from '../ui/GlassIcon';
import StatusBadge from '../ui/StatusBadge';

const pageSize = 8;

/* Apple Watch–style SVG ring chart */
const RingChart = ({ data, total }) => {
  const SIZE = 200;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 72;
  const SW = 22;
  const circumference = 2 * Math.PI * R;
  let cumFraction = 0;

  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE, margin: '0 auto' }}>
      <svg width={SIZE} height={SIZE}>
        <circle cx={cx} cy={cy} r={R} fill="none"
          stroke="rgba(155,107,255,0.07)" strokeWidth={SW} />
        {data.map((item, i) => {
          const fraction = total > 0 ? item.value / total : 0;
          const dashLen = fraction * circumference;
          const dashOffset = -(cumFraction * circumference);
          cumFraction += fraction;
          return (
            <circle
              key={i} cx={cx} cy={cy} r={R}
              fill="none"
              stroke={item.color}
              strokeWidth={SW}
              strokeDasharray={`${dashLen} ${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90, ${cx}, ${cy})`}
              style={{ filter: `drop-shadow(0 0 8px ${item.color})` }}
            />
          );
        })}
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
          {total > 0 ? total : '—'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginTop: 4 }}>
          {total > 0 ? 'Total' : 'No data'}
        </div>
      </div>
    </div>
  );
};

const formatDate = (str) => {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const displayName = (username) => {
  if (!username) return 'there';
  return username.charAt(0).toUpperCase() + username.slice(1);
};

const RollingNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value || 0;
    if (end === 0) { setDisplay(0); return; }
    const step = Math.max(1, Math.ceil(end / 30));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); return; }
      setDisplay(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}</span>;
};

const buildWeeklyData = (claims) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = days.map((day) => ({ day, claims: 0 }));
  claims.forEach((c) => {
    if (!c.CREATED_AT) return;
    const d = new Date(c.CREATED_AT);
    if (Number.isNaN(d.getTime())) return;
    const diff = (Date.now() - d.getTime()) / 86400000;
    if (diff <= 7) counts[d.getDay()].claims += 1;
  });
  const ordered = [...counts.slice(1), counts[0]];
  return ordered;
};

const GlassTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card glass-card--sm" style={{ padding: '12px 16px', pointerEvents: 'none' }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
        {payload[0].value} claims
      </div>
    </div>
  );
};

const ActivityFeed = ({ activities }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const timeAgo = (ts) => {
    if (!ts) return '';
    const diff = now - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (!activities.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: 8 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(155,107,255,0.1), rgba(111,168,255,0.1))',
          border: '1px solid rgba(155,107,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>🔔</div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>No activity yet</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
          Updates will appear here as claims are processed
        </span>
      </div>
    );
  }

  return (
    <div>
      {activities.slice(0, 6).map((a, i) => (
        <div key={i} className="activity-item">
          <div className="activity-item__avatar">
            {(a.user || a.username || 'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="activity-item__text">
              {a.message || a.description || 'Activity recorded'}
            </p>
            <span className="activity-item__time">
              {timeAgo(a.timestamp || a.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const TEAM_MEMBERS = [
  { name: 'Claims Team A', score: 92 },
  { name: 'Assessor Pool', score: 87 },
  { name: 'Verifier Unit', score: 78 },
  { name: 'Support Desk', score: 95 },
];

const Dashboard = ({ username, role }) => {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [allClaims, setAllClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('total');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activities, setActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loggedUser = username || sessionStorage.getItem('loggedUser') || '';
  const rolesArr = Array.isArray(role) ? role : [role];

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [claims, acts] = await Promise.all([
        dashboardService.getRecentClaims(loggedUser, 1000),
        dashboardService.getRecentActivities(),
      ]);
      const computedStats = dashboardService.getDashboardStats(claims, role);
      setAllClaims(claims);
      setFilteredClaims(claims);
      setStats(computedStats);
      setActivities(acts || []);
    } catch (e) {
      console.error('Dashboard fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [loggedUser, role]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const applyFilter = (filter) => {
    setCurrentFilter(filter);
    setCurrentPage(1);
    const PENDING = ['pending', 'in progress', '', 'pending assessor action', 'pending verifier action', 'pending assessor allocation'];
    const APPROVED = ['approved', 'approve', 'pending verifier allocation', 'payout completed'];
    const REJECTED = ['rejected', 'reject', 'verifier rejected', 'assessor rejected', 'payout rejected'];
    if (filter === 'total') { setFilteredClaims(allClaims); return; }
    if (filter === 'pending') { setFilteredClaims(allClaims.filter((c) => PENDING.includes((c.STATUS || '').toLowerCase()))); return; }
    if (filter === 'approved') { setFilteredClaims(allClaims.filter((c) => APPROVED.includes((c.STATUS || '').toLowerCase()))); return; }
    if (filter === 'rejected') { setFilteredClaims(allClaims.filter((c) => REJECTED.includes((c.STATUS || '').toLowerCase()))); return; }
  };

  const searched = useMemo(() => {
    if (!searchQuery.trim()) return filteredClaims;
    const q = searchQuery.toLowerCase();
    return filteredClaims.filter((c) =>
      (c.CLAIM_NUMBER || '').toLowerCase().includes(q) ||
      (c.POLICY_NO || c.POLICY_NUMBER || '').toLowerCase().includes(q) ||
      (c.STATUS || '').toLowerCase().includes(q)
    );
  }, [filteredClaims, searchQuery]);

  const totalPages = Math.ceil(searched.length / pageSize);
  const paginated = searched.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const weeklyData = useMemo(() => buildWeeklyData(allClaims), [allClaims]);

  const ringData = [
    { name: 'Approved', value: stats.approved, color: '#8EF7D4' },
    { name: 'Pending', value: stats.pending, color: '#9B6BFF' },
    { name: 'Rejected', value: stats.rejected, color: '#F6A9FF' },
  ].filter((d) => d.value > 0);

  const totalPayout = useMemo(() => {
    return allClaims
      .filter((c) => (c.STATUS || '').toLowerCase().includes('payout'))
      .length * 125000;
  }, [allClaims]);

  const kpiCards = [
    { label: 'Total Claims', value: stats.total, filter: 'total', icon: '📁', variant: 'lavender', trend: '+12%', up: true },
    { label: 'Claims Approved', value: stats.approved, filter: 'approved', icon: '🛡️', variant: 'mint', trend: '+8%', up: true },
    { label: 'Pending Claims', value: stats.pending, filter: 'pending', icon: '⏳', variant: 'sky', trend: '-3%', up: false },
    { label: 'Total Payout', value: totalPayout, filter: null, icon: '💎', variant: 'pink', trend: '+15%', up: true, isCurrency: true },
  ];

  const quickActions = [
    { label: 'File a Claim', icon: '📝', to: rolesArr.includes('Pre Assessor') ? '/registration' : '/claim-search' },
    { label: 'Track Claim', icon: '🔍', to: '/claim-search' },
    { label: 'My Tasks', icon: '✅', to: '/my-task' },
    { label: 'Pool Selection', icon: '🎯', to: '/assessor-pool' },
  ];

  if (loading) {
    return (
      <div className="glass-loading">
        <div className="glass-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="glass-search">
        <span style={{ color: 'var(--text-muted)' }}>🔍</span>
        <input
          type="text"
          placeholder="Search claims, policies, or status..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
        />
        <span className="glass-search__shortcut">⌘ K</span>
      </div>

      <div className="dashboard-hero">
        <h1>{getGreeting()}, {displayName(loggedUser)} 👋</h1>
        <p>Your protection ecosystem is healthy. Managing claims shouldn&apos;t feel complicated.</p>
      </div>

      <div className="stat-grid">
        {kpiCards.map((k) => (
          <div
            key={k.label}
            className={`glass-card stat-card${currentFilter === k.filter ? ' stat-card--active' : ''}`}
            onClick={() => k.filter && applyFilter(k.filter)}
            role={k.filter ? 'button' : undefined}
            tabIndex={k.filter ? 0 : undefined}
            onKeyDown={(e) => k.filter && e.key === 'Enter' && applyFilter(k.filter)}
          >
            <div className="stat-card__label">{k.label}</div>
            <div className="stat-card__value">
              {k.isCurrency ? (
                <>₹<RollingNumber value={Math.round(k.value / 1000)} />K</>
              ) : (
                <RollingNumber value={k.value} />
              )}
            </div>
            <span className={`stat-card__trend stat-card__trend--${k.up ? 'up' : 'down'}`}>
              {k.up ? '↑' : '↓'} {k.trend}
            </span>
            <div className="stat-card__icon-wrap">
              <GlassIcon variant={k.variant} size="sm">{k.icon}</GlassIcon>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-grid__main">
          <div className="charts-row">
            <div className="glass-card chart-card glass-card--static">
              <h3 className="chart-card__title">Claims Overview</h3>
              <p className="chart-card__subtitle">Weekly claim activity</p>
              {weeklyData.some((d) => d.claims > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#9B6BFF" />
                        <stop offset="100%" stopColor="#6FA8FF" />
                      </linearGradient>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9B6BFF" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#6FA8FF" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(155,107,255,0.08)" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                    <Tooltip content={<GlassTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="claims"
                      stroke="url(#lineGradient)"
                      strokeWidth={3}
                      fill="url(#areaGradient)"
                      dot={{ fill: '#9B6BFF', strokeWidth: 2, r: 4, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#9B6BFF', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{
                  height: 220, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(155,107,255,0.1), rgba(111,168,255,0.1))',
                    border: '1px solid rgba(155,107,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>📊</div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>No activity this week</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Chart will populate as claims are registered</span>
                </div>
              )}
            </div>

            <div className="glass-card chart-card glass-card--static">
              <h3 className="chart-card__title">Claims by Status</h3>
              <p className="chart-card__subtitle">Distribution breakdown</p>
              <RingChart data={ringData} total={stats.total} />
              {ringData.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 16 }}>
                  {ringData.map((d) => (
                    <span key={d.name} style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        width: 10, height: 10, borderRadius: '50%', background: d.color,
                        boxShadow: `0 0 6px ${d.color}`, flexShrink: 0,
                      }} />
                      {d.name}
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.value}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card claims-section glass-card--static">
            <div className="claims-section__header">
              <div>
                <h3 className="claims-section__title">Recent Claims</h3>
                <span className="claims-section__count">{searched.length} claims</span>
              </div>
            </div>

            {paginated.length > 0 && (
              <div className="claims-table-header">
                <span>Claim ID</span>
                <span>Policy No</span>
                <span>Type</span>
                <span>Status</span>
                <span>Date</span>
                <span />
              </div>
            )}

            {paginated.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 10 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(155,107,255,0.08), rgba(111,168,255,0.08))',
                  border: '1px solid rgba(155,107,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                }}>🛡️</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>No claims found</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {currentFilter !== 'total' ? 'Try a different filter above' : 'Claims will appear here once registered'}
                </span>
              </div>
            ) : paginated.map((c, i) => (
              <div key={i} className="claim-row">
                <span className="claim-row__id">{c.CLAIM_NUMBER || '—'}</span>
                <span className="claim-row__muted">{c.POLICY_NO || c.POLICY_NUMBER || '—'}</span>
                <span className="claim-row__muted">{c.CLAIM_TYPE || 'Life'}</span>
                <span><StatusBadge status={c.STATUS} /></span>
                <span className="claim-row__muted">{formatDate(c.CREATED_AT)}</span>
                <Link to={`/registration-fetch/${c.CLAIM_NUMBER}`} className="glass-btn glass-btn--sm glass-btn--ghost">
                  View
                </Link>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="glass-pagination">
                <button
                  type="button"
                  className="glass-btn glass-btn--sm glass-btn--ghost"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  ‹
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  className="glass-btn glass-btn--sm glass-btn--ghost"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-grid__side">
          <div className="glass-card panel-card glass-card--static">
            <h3 className="panel-card__title">Activity Feed</h3>
            <ActivityFeed activities={activities} />
          </div>

          <div className="glass-card panel-card glass-card--static">
            <h3 className="panel-card__title">Team Performance</h3>
            {TEAM_MEMBERS.map((m) => (
              <div key={m.name} className="team-member">
                <div className="team-member__info">
                  <span className="team-member__name">{m.name}</span>
                  <span className="team-member__score">{m.score}%</span>
                </div>
                <div className="team-member__bar">
                  <div className="team-member__fill" style={{ width: `${m.score}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card panel-card glass-card--static">
            <h3 className="panel-card__title">Quick Actions</h3>
            <div className="quick-actions">
              {quickActions.map((a) => (
                <Link key={a.label} to={a.to} className="quick-action">
                  <GlassIcon variant="sky" size="sm">{a.icon}</GlassIcon>
                  <span className="quick-action__label">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
