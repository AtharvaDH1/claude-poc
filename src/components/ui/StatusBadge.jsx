import React from 'react';

const getVariant = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('approved') || s.includes('payout completed')) return 'approved';
  if (s.includes('rejected')) return 'rejected';
  if (s.includes('review') || s.includes('verifier') || s.includes('assessor')) return 'review';
  if (s.includes('pending') || s.includes('progress')) return 'pending';
  return 'default';
};

const StatusBadge = ({ status }) => {
  const variant = getVariant(status);
  return <span className={`status-badge status-badge--${variant}`}>{status || 'Unknown'}</span>;
};

export default StatusBadge;
