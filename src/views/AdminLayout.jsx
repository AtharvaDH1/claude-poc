import React from 'react';
import { Switch, Route, Redirect, NavLink, useHistory } from 'react-router-dom';
import authService from '../services/authService';
import BackgroundOrbs from '../components/Layout/BackgroundOrbs';
import AdminDashboard from './AdminDashboard';
import AdminAudit from './AdminAudit';
import AdminClaimSearch from './AdminClaimSearch';

const navItems = [
  { path: '/admin', label: 'Overview', exact: true, icon: '📊' },
  { path: '/admin/audit', label: 'Audit Log', icon: '🔍' },
  { path: '/admin/claim-search', label: 'Claim Search', icon: '📋' },
];

const AdminLayout = ({ setAuthenticated }) => {
  const history = useHistory();

  const handleExit = () => {
    authService.logout();
    setAuthenticated(false);
    history.push('/login');
  };

  return (
    <>
      <BackgroundOrbs />
      <div className="admin-shell">
        <div className="app-shell__sidebar">
          <aside className="glass-sidebar glass-card glass-card--static">
            <div className="glass-sidebar__brand">
              <div className="glass-sidebar__logo">⚙️</div>
              <div>
                <div className="glass-sidebar__title">Admin Panel</div>
                <div className="glass-sidebar__subtitle">Life Claims</div>
              </div>
            </div>

            <nav className="glass-sidebar__nav">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  exact={item.exact}
                  className="glass-nav-item"
                  activeClassName="glass-nav-item--active"
                >
                  <span className="glass-nav-item__icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div style={{ marginTop: 'auto' }}>
              <button type="button" className="glass-btn w-100" onClick={handleExit}>
                Exit Admin
              </button>
            </div>
          </aside>
        </div>

        <div className="admin-content page-content">
          <Switch>
            <Route exact path="/admin" component={AdminDashboard} />
            <Route path="/admin/audit" component={AdminAudit} />
            <Route path="/admin/claim-search" component={AdminClaimSearch} />
            <Route path="/admin/users"><Redirect to="/admin" /></Route>
            <Route path="/admin/reports"><Redirect to="/admin" /></Route>
          </Switch>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;
