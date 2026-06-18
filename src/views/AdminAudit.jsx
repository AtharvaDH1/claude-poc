import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';

const PAGE_SIZE = 10;

const AdminAudit = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickRange, setQuickRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setCurrentPage(1);
    const params = {};
    if (quickRange === 'today') params.from = new Date().toISOString().split('T')[0];
    if (quickRange === 'week') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      params.from = d.toISOString().split('T')[0];
    }
    adminService.getAuditEvents(params)
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [quickRange]);

  const totalPages = Math.ceil(events.length / PAGE_SIZE);
  const paginated = events.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const formatDuration = (loginAt, logoutAt) => {
    if (!loginAt || !logoutAt) return '—';
    const mins = Math.floor((new Date(logoutAt) - new Date(loginAt)) / 60000);
    return `${mins} min`;
  };

  return (
    <div>
      <h5 className="fw-bold mb-4" style={{ color: '#1a3c6e' }}>Audit Log</h5>

      {/* Filters */}
      <div className="d-flex gap-2 mb-4">
        {[['all', 'All Time'], ['week', 'This Week'], ['today', 'Today']].map(([k, l]) => (
          <button key={k} className={`btn btn-sm ${quickRange === k ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setQuickRange(k)}>{l}</button>
        ))}
        <span className="ms-auto text-muted small align-self-center">{events.length} records</span>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>
      ) : (
        <>
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table className="table table-hover mb-0" style={{ fontSize: '13px' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Login At</th>
                  <th>Logout At</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-muted py-4">No audit events found.</td></tr>
                ) : paginated.map((e, i) => (
                  <tr key={i}>
                    <td className="fw-semibold">{e.user || e.username || '—'}</td>
                    <td><span className="badge bg-secondary">{e.role || '—'}</span></td>
                    <td>{e.loginAt ? new Date(e.loginAt).toLocaleString('en-IN') : '—'}</td>
                    <td>{e.logoutAt ? new Date(e.logoutAt).toLocaleString('en-IN') : '—'}</td>
                    <td>{formatDuration(e.loginAt, e.logoutAt)}</td>
                    <td>
                      {e.logoutAt
                        ? <span className="badge bg-success">Logged Out</span>
                        : <span className="badge bg-warning text-dark">Active</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-3">
              <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>‹</button>
              <span className="small">Page {currentPage} of {totalPages}</span>
              <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminAudit;
