import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { getCaseDetails, refreshLifeAsiaData } from '../../../services/add/AssessmentPool';
import { toast } from 'react-toastify';

const CaseDetails = () => {
  const { id } = useParams();
  const history = useHistory();
  const loggedUser = sessionStorage.getItem('loggedUser') || '';
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCaseDetails(id)
      .then((data) => setCaseData(data))
      .catch(() => toast.error('Failed to load case details.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRefresh = async () => {
    try {
      await refreshLifeAsiaData(id, loggedUser);
      toast.success('Data refreshed.');
    } catch { toast.error('Refresh failed.'); }
  };

  if (loading) return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>;

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => history.goBack()}>← Back</button>
        <h5 className="mb-0 fw-bold" style={{ color: '#1a3c6e' }}>Case Details — {id}</h5>
        <button className="btn btn-outline-primary btn-sm ms-auto" onClick={handleRefresh}>🔄 Refresh Data</button>
      </div>

      {caseData ? (
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '24px' }}>
          <div className="row g-2">
            {Object.entries(caseData).map(([k, v]) => (
              <div key={k} className="col-md-4">
                <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '8px 12px' }}>
                  <div style={{ fontSize: '11px', color: '#888' }}>{k.replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{v?.toString() || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="alert alert-warning">No case data found for ID: {id}</div>
      )}
    </div>
  );
};

export default CaseDetails;
