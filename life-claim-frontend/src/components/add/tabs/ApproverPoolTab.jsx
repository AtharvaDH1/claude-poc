import DecisionQueueTab from '../DecisionQueueTab'

/** Section I7 — Approver pool (search + bulk approve/reject). */
export default function ApproverPoolTab({ toast }) {
  return <DecisionQueueTab toast={toast} mode="approver" />
}
