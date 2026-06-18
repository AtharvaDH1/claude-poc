import ApiWrapper from '../util/ApiWrapper';
import { API_URL } from '../util/config';

export const getSummary = () => ApiWrapper.fetchWithToken('admin/summary');

export const getRecentClaims = ({ limit = 50, view = 'all' } = {}) =>
  ApiWrapper.fetchWithToken(`admin/claims/recent?limit=${limit}&view=${view}`);

export const getReportSummary = ({ range, from, to } = {}) => {
  const params = new URLSearchParams({ ...(range && { range }), ...(from && { from }), ...(to && { to }) });
  return ApiWrapper.fetchWithToken(`admin/reports/summary?${params}`);
};

export const getAuditEvents = ({ user, from, to, limit } = {}) => {
  const params = new URLSearchParams({
    ...(user && { user }),
    ...(from && { from }),
    ...(to && { to }),
    ...(limit && { limit }),
  });
  return ApiWrapper.fetchWithToken(`admin/audit?${params}`);
};

export const assignClaim = ({ claimNumber, assignee, role }) => {
  const token = localStorage.getItem('token');
  return fetch(`${API_URL}/api/admin/claims/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    credentials: 'include',
    body: JSON.stringify({ claimNumber, assignee, role }),
  }).then((r) => r.json());
};

export const getTrackedUsersStatus = () => ApiWrapper.fetchWithToken('admin/audit/tracked-users');

export const forceLogoutTrackedUser = (username) =>
  ApiWrapper.fetchWithToken('admin/audit/force-logout', { method: 'POST', body: JSON.stringify({ username }) });

const adminService = { getSummary, getRecentClaims, getReportSummary, getAuditEvents, assignClaim, getTrackedUsersStatus, forceLogoutTrackedUser };
export default adminService;
