import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import claimsService from '../services/claimsServices';

const pageSize = 10;

const formatDate = (str) => str ? new Date(str).toLocaleDateString('en-IN') : '—';
const getStatusBadge = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('approved')) return <span className="badge bg-success">{status}</span>;
  if (s.includes('rejected')) return <span className="badge bg-danger">{status}</span>;
  return <span className="badge bg-warning text-dark">{status || '—'}</span>;
};

const MyTask = () => {
  const loggedUser = sessionStorage.getItem('loggedUser') || '';
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('All');
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [claimNumber, setClaimNumber] = useState('');

  useEffect(() => {
    setLoading(true);
    claimsService.getClaimByUsername(loggedUser)
      .then((claims) => {
        setData(Array.isArray(claims) ? claims : []);
        setFilteredData(Array.isArray(claims) ? claims : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loggedUser]);

  useEffect(() => {
    if (filter === 'All') { setFilteredData(data); }
    else { setFilteredData(data.filter((d) => (d.role || '').includes(filter))); }
    setCurrentPage(1);
  }, [filter, data]);

  const handleClaimSearch = () => {
    if (!claimNumber.trim()) { setFilteredData(data); return; }
    setFilteredData(data.filter((d) => (d.CLAIM_NUMBER || '').toLowerCase().includes(claimNumber.toLowerCase())));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginated = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>;

  return (
    <div>
      <h5 className="fw-bold mb-4" style={{ color: '#1a3c6e' }}>My Tasks</h5>

      {/* Filters */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {['All', 'Assessor', 'Verifier'].map((r) => (
          <button
            key={r}
            className={`btn btn-sm ${filter === r ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFilter(r)}
          >{r}</button>
        ))}
        <div className="d-flex gap-2 ms-auto">
          <input
            className="form-control form-control-sm"
            placeholder="Search claim no..."
            value={claimNumber}
            onChange={(e) => setClaimNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleClaimSearch()}
            style={{ width: '200px' }}
          />
          <button className="btn btn-sm btn-outline-primary" onClick={handleClaimSearch}>Search</button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table className="table table-hover mb-0" style={{ fontSize: '13px' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th>Claim Number</th>
              <th>Policy No</th>
              <th>Status</th>
              <th>Role</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-muted py-4">No tasks found.</td></tr>
            ) : paginated.map((c, i) => (
              <tr key={i}>
                <td className="fw-semibold">{c.CLAIM_NUMBER || '—'}</td>
                <td>{c.POLICY_NO || c.POLICY_NUMBER || '—'}</td>
                <td>{getStatusBadge(c.STATUS)}</td>
                <td><span className="badge bg-info text-dark">{c.role || '—'}</span></td>
                <td>{formatDate(c.CREATED_AT)}</td>
                <td>
                  <Link to={`/registration-fetch/${c.CLAIM_NUMBER}`} className="btn btn-outline-primary btn-sm py-0 px-2">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="d-flex justify-content-center gap-2 py-2 border-top">
            <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>‹</button>
            <span className="small">Page {currentPage} of {totalPages}</span>
            <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>›</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTask;
