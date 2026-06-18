import React, { useState } from 'react';
import BackgroundOrbs from './BackgroundOrbs';
import GlassSidebar from './GlassSidebar';
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs';

const AppShell = ({ role, username, setAuthenticated, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      <BackgroundOrbs />

      <button
        type="button"
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      <div
        className={`sidebar-overlay${sidebarOpen ? ' sidebar-overlay--visible' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <div className="app-shell">
        <div className={`app-shell__sidebar${sidebarOpen ? ' app-shell__sidebar--open' : ''}`}>
          <GlassSidebar
            role={role}
            username={username}
            setAuthenticated={setAuthenticated}
            onNavigate={closeSidebar}
          />
        </div>

        <div className="app-shell__main">
          <div className="app-shell__content">
            <Breadcrumbs />
            <div className="page-content">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppShell;
