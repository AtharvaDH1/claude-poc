import {
  CheckCircle,
  XCircle,
  ClipboardList,
  FileText,
  UserCheck,
} from 'lucide-react'

/** Icons + colors for dashboard activity / notification rows. */
export const ACTIVITY_STYLES = {
  approval: { bg: '#ECFDF5', color: '#059669', Icon: CheckCircle },
  approved: { bg: '#ECFDF5', color: '#059669', Icon: CheckCircle },
  rejection: { bg: '#FEF2F2', color: '#DC2626', Icon: XCircle },
  rejected: { bg: '#FEF2F2', color: '#DC2626', Icon: XCircle },
  registration: { bg: '#EFF6FF', color: '#1D4ED8', Icon: FileText },
  modification: { bg: '#FFFBEB', color: '#D97706', Icon: ClipboardList },
  assessment: { bg: '#FFFBEB', color: '#D97706', Icon: ClipboardList },
  document: { bg: '#F0F9FF', color: '#0891B2', Icon: FileText },
  new: { bg: '#EFF6FF', color: '#1D4ED8', Icon: FileText },
  default: { bg: '#F1F5F9', color: '#64748B', Icon: UserCheck },
}

export function getActivityStyle(type) {
  return ACTIVITY_STYLES[type] || ACTIVITY_STYLES.default
}
