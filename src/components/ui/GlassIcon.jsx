import React from 'react';

const GlassIcon = ({ variant = 'lavender', size = 'md', children, style }) => (
  <div
    className={`glass-icon glass-icon--${variant}${size === 'sm' ? ' glass-icon--sm' : ''}`}
    style={style}
  >
    {children}
  </div>
);

export default GlassIcon;
