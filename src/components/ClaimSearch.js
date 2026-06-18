import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import claimSearch from '../services/claimSearchService';
import StatusBadge from './ui/StatusBadge';

const ClaimSearch = () => {
  const [claimNo, setClaimNo] = useState('');
  const [claimResults, setClaimResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!claimNo.trim()) { setErrorMessage('Please enter a claim number.'); return; }
    setErrorMessage('');
    setLoading(true);
    try {
      const results = await claimSearch.claimSearchNumber(claimNo.trim());
      setClaimResults(Array.isArray(results) ? results : [results].filter(Boolean));
    } catch (err) {
      setErrorMessage('Search failed. Please try again.');
      setClaimResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Claim Search</h1>
        <p>Find and track claims across your protection portfolio.</p>
      </div>

      <div className="glass-card glass-card--static" style={{ padding: 24, maxWidth: 640, marginBottom: 24 }}>
        <form onSubmit={handleSearch} className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Enter claim number (e.g. LC260000001)"
            value={claimNo}
            onChange={(e) => { setClaimNo(e.target.value); setErrorMessage(''); }}
          />
          <button className="glass-btn glass-btn--primary px-4" type="submit" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm" /> : 'Search'}
          </button>
        </form>
        {errorMessage && <div className="login-alert login-alert--danger" style={{ marginTop: 12, marginBottom: 0 }}>{errorMessage}</div>}
      </div>

      {claimResults.length > 0 && (
        <div className="glass-card glass-card--static claims-section">
          {claimResults.map((c, i) => (
            <div key={i} className="claim-row" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr 100px' }}>
              <span className="claim-row__id">{c.CLAIM_NUMBER}</span>
              <span className="claim-row__muted">{c.POLICY_NO || c.POLICY_NUMBER || '—'}</span>
              <span><StatusBadge status={c.STATUS} /></span>
              <span className="claim-row__muted">{c.CREATED_AT ? new Date(c.CREATED_AT).toLocaleDateString('en-IN') : '—'}</span>
              <Link
                to={{ pathname: `/registration-fetch/${c.CLAIM_NUMBER}`, state: { from: 'claimSearch' } }}
                className="glass-btn glass-btn--sm glass-btn--ghost"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClaimSearch;
