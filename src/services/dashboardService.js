import ApiWrapper from '../util/ApiWrapper';
import { getClaimByUsername } from './claimsServices';

const PENDING_STATUSES = ['pending', 'in progress', '', 'pending assessor action', 'pending verifier action', 'pending assessor allocation'];
const APPROVED_STATUSES = ['approved', 'approve', 'pending verifier allocation', 'payout completed'];
const REJECTED_STATUSES = ['rejected', 'reject', 'verifier rejected', 'assessor rejected', 'payout rejected'];

const getRoleStatuses = (roles) => {
  const rolesArr = Array.isArray(roles) ? roles : [roles];
  if (rolesArr.includes('Assessor')) {
    return {
      pending: ['pending assessor action'],
      approved: ['approved', 'pending verifier allocation'],
      rejected: ['rejected', 'assessor rejected', 'payout rejected'],
    };
  }
  if (rolesArr.includes('Verifier')) {
    return {
      pending: ['pending verifier action'],
      approved: ['payout completed', 'approved'],
      rejected: ['verifier rejected', 'payout rejected', 'rejected'],
    };
  }
  return { pending: PENDING_STATUSES, approved: APPROVED_STATUSES, rejected: REJECTED_STATUSES };
};

export const getRecentClaims = async (username, limit = 1000) => {
  const claims = await getClaimByUsername(username);
  const sorted = [...claims].sort((a, b) => {
    const da = a.MODIFIED_AT || a.CREATED_AT || '';
    const db = b.MODIFIED_AT || b.CREATED_AT || '';
    return db.localeCompare(da);
  });
  return sorted.slice(0, limit);
};

export const getDashboardStats = (claims, roles) => {
  const { pending, approved, rejected } = getRoleStatuses(roles);
  const total = claims.length;
  const pendingCount = claims.filter((c) => pending.includes((c.STATUS || '').toLowerCase())).length;
  const approvedCount = claims.filter((c) => approved.includes((c.STATUS || '').toLowerCase())).length;
  const rejectedCount = claims.filter((c) => rejected.includes((c.STATUS || '').toLowerCase())).length;
  return { total, pending: pendingCount, approved: approvedCount, rejected: rejectedCount };
};

export const getRecentActivities = async () => {
  try {
    return await ApiWrapper.fetchWithToken('dashboard/activities');
  } catch {
    return [];
  }
};

const dashboardService = { getRecentClaims, getDashboardStats, getRecentActivities };
export default dashboardService;
