import { formatRelativeTime } from './formatRelativeTime'

/** Normalize /dashboard/activities payload for Dashboard + notification bell. */
export function mapDashboardActivityItem(a, index = 0) {
  const claimId = a.claimId || a.claimNumber || a.CLAIM_NUMBER || a.claim || ''
  const user = a.user || a.USERNAME || a.username || ''
  const action = a.action || a.ACTION || 'Activity'
  const detail =
    a.detail ||
    a.DETAIL ||
    (claimId && user ? `${claimId} · ${user}` : claimId || user || '')
  const rawTime = a.rawTime || a.createdAt || a.MODIFIED_ON || a.modifiedOn || a.time
  return {
    id: a.id || `${claimId}-${index}`,
    action,
    detail,
    claim: claimId,
    user,
    rawTime,
    time: formatRelativeTime(rawTime),
    type: a.type || 'modification',
  }
}

export function mapDashboardActivities(items = []) {
  return (items || []).map((a, i) => mapDashboardActivityItem(a, i))
}
