import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import ProfileView from '../ProfileView/ProfileView';

const Header = ({ username, setAuthenticated, onMenuClick }) => {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header style={{
      height: '60px', background: '#1a3c6e', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      <div className="d-flex align-items-center gap-3">
        <button
          onClick={onMenuClick}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer' }}
        >
          ☰
        </button>
        <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '0.5px' }}>Life Claims</span>
      </div>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowProfile(!showProfile)}
          style={{
            background: '#2d5aa0', border: 'none', borderRadius: '50px',
            color: '#fff', padding: '6px 16px', cursor: 'pointer', fontSize: '14px',
          }}
        >
          👤 {username}
        </button>

        {showProfile && (
          <ProfileView
            setProfileViewtoggle={setShowProfile}
            setAuthenticated={setAuthenticated}
          />
        )}
      </div>
    </header>
  );
};

export default withRouter(Header);
