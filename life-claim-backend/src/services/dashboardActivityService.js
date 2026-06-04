const dashboardActivityDao = require('../dataAccess/dashboardActivityDao');

const parseRolesSafe = (rawRoles) => {
  if (Array.isArray(rawRoles)) return rawRoles;
  if (!rawRoles) return [];
  if (typeof rawRoles === 'string') {
    const value = rawRoles.trim();
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') return [parsed];
      return [];
    } catch {
      // Fallback for legacy DB formats like "Assessor,Verifier" or single "Assessor"
      return value.includes(',') ? value.split(',').map((r) => r.trim()).filter(Boolean) : [value];
    }
  }
  return [];
};

const getRecentActivitiesService = async () => {
  try {
    const rows = await dashboardActivityDao.getRecentActivities();
    console.log('Service >> DAO returned rows:', rows.length);
    if (rows.length > 0) {
      console.log('Service >> First row example:', JSON.stringify(rows[0], null, 2));
    }

    // Process rows to create readable activity pulse messages.
    // We:
    // 1) Compute "age" in seconds in Node (Date is always in UTC internally, so no TZ skew).
    // 2) Keep only activities from the last 24h.
    // 3) De‑duplicate by (user, claimId, status) keeping only the most recent entry.
    const now = new Date();
    const ONE_DAY_SECONDS = 24 * 60 * 60;

    const dedupeMap = new Map();

    for (const row of rows) {
      const rowTime = new Date(row.time);
      if (Number.isNaN(rowTime.getTime())) continue;

      const diffSeconds = Math.floor(Math.abs(now.getTime() - rowTime.getTime()) / 1000);
      if (diffSeconds > ONE_DAY_SECONDS) continue; // skip older than 24h

      const key = `${row.user || ""}|${row.claimId || ""}|${row.status || ""}`;
      if (dedupeMap.has(key)) continue; // first row is newest due to ORDER BY DESC

      dedupeMap.set(key, { row, diffSeconds });
    }

    return Array.from(dedupeMap.values()).map(({ row, diffSeconds }) => {
        let action = 'modified';
        let type = 'modification';
        
        const status = (row.status || '').toLowerCase();
        const roles = parseRolesSafe(row.roles);
        
        const isAssessor = roles.includes('Assessor');
        const isVerifier = roles.includes('Verifier');
        const roleLabel = isAssessor ? 'Assessor' : (isVerifier ? 'Verifier' : '');
        
        if (status.includes('assessor rejected') || status.includes('rejected')) {
          action = `${roleLabel} rejected`;
          type = 'rejection';
        } else if (status.includes('pending verifier allocation')) {
          action = `Assessor approved`;
          type = 'approval';
        } else if (status.includes('payout completed')) {
          action = `Verifier approved`;
          type = 'approval';
        } else if (status.includes('pending assessor allocation')) {
          action = `Registered a new`;
          type = 'registration';
        } else if (status.includes('modified')) {
          action = `${roleLabel} modified`;
          type = 'modification';
        }
        
        return {
          user: row.user,
          action: action,
          claimId: row.claimId,
          time: getTimeSinceDetailed(diffSeconds),
          type: type,
          rawTime: row.time
        };
      });
  } catch (error) {
    console.error('Error in dashboard activity service:', error);
    throw error;
  }
};

// Helper function to format time as "Xm ago", "Xh ago" using seconds from DB
function getTimeSinceDetailed(seconds) {
  if (seconds < 0) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

module.exports = {
  getRecentActivitiesService
};
