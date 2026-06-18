import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const Breadcrumbs = () => {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);

  if (parts.length === 0 || (parts.length === 1 && parts[0] === 'dashboard')) return null;

  return (
    <nav aria-label="breadcrumb" className="glass-breadcrumb">
      <ol>
        <li><Link to="/dashboard">Home</Link></li>
        {parts.map((part, i) => {
          const path = '/' + parts.slice(0, i + 1).join('/');
          const label = part.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          const isLast = i === parts.length - 1;
          return isLast
            ? <li key={path} className="active">{label}</li>
            : <li key={path}><Link to={path}>{label}</Link></li>;
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
