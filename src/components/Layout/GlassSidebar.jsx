import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import ProfileView from '../ProfileView/ProfileView';

const NavItem = ({ to, label, icon, onNavigate }) => (
  <NavLink
    to={to}
    onClick={onNavigate}
    className="glass-nav-item"
    activeClassName="glass-nav-item--active"
    exact={to === '/dashboard'}
  >
    <span className="glass-nav-item__icon">{icon}</span>
    {label}
  </NavLink>
);

const GlassSidebar = ({ role, username, setAuthenticated, onNavigate }) => {
  const [showProfile, setShowProfile] = useState(false);
  const rolesArr = Array.isArray(role) ? role : [role];
  const initials = (username || 'U').slice(0, 2).toUpperCase();
  const displayRole = rolesArr.filter(Boolean).join(', ') || 'User';

  return (
    <aside className="glass-sidebar glass-card glass-card--static">
      <div className="glass-sidebar__brand">
        <div className="glass-sidebar__logo">🛡️</div>
        <div>
          <div className="glass-sidebar__title">Life Claims</div>
          <div className="glass-sidebar__subtitle">Protection Portal</div>
        </div>
      </div>

      <nav className="glass-sidebar__nav">
        <NavItem to="/dashboard" label="Dashboard" icon="📊" onNavigate={onNavigate} />
        <NavItem to="/claim-search" label="Claim Search" icon="🔍" onNavigate={onNavigate} />
        {rolesArr.includes('Pre Assessor') && (
          <>
            <NavItem to="/policy-search" label="Policy Search" icon="📋" onNavigate={onNavigate} />
            <NavItem to="/registration" label="Register Claim" icon="📝" onNavigate={onNavigate} />
          </>
        )}
        {(rolesArr.includes('Assessor') || rolesArr.includes('Verifier')) && (
          <>
            <NavItem to="/assessor-pool" label="Pool Selection" icon="🎯" onNavigate={onNavigate} />
            <NavItem to="/my-task" label="My Tasks" icon="✅" onNavigate={onNavigate} />
            <NavItem to="/add-screen" label="Add Screen" icon="➕" onNavigate={onNavigate} />
          </>
        )}
        {rolesArr.includes('admin') && (
          <>
            <NavItem to="/user-manager" label="User Management" icon="👥" onNavigate={onNavigate} />
            <NavItem to="/admin" label="Admin Panel" icon="⚙️" onNavigate={onNavigate} />
          </>
        )}
      </nav>

      <div className="glass-sidebar__help">
        <div className="glass-sidebar__help-title">Need Help?</div>
        <div className="glass-sidebar__help-text">Our support team is here for you</div>
        <a href="mailto:claimssupport@dhdigital.co.in" className="glass-btn glass-btn--primary glass-btn--sm">
          Contact Support
        </a>
      </div>

      <div style={{ position: 'relative' }}>
        <div className="glass-sidebar__user" onClick={() => setShowProfile(!showProfile)}>
          <div className="glass-sidebar__avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="glass-sidebar__user-name">{username}</div>
            <div className="glass-sidebar__user-role">{displayRole}</div>
          </div>
        </div>
        {showProfile && (
          <div className="profile-dropdown">
            <ProfileView
              setProfileViewtoggle={setShowProfile}
              setAuthenticated={setAuthenticated}
            />
          </div>
        )}
      </div>
    </aside>
  );
};

export default GlassSidebar;
