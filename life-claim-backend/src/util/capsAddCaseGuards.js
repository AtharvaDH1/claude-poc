const CapsAddDetails = require('../models/add/CapsAddDetails');

function isFinalizedApproverStatus(caseStatus) {
  const status = String(caseStatus || '').toLowerCase();
  return status.includes('approved by approver') || status.includes('rejected by approver');
}

async function getCaseRow(caseId) {
  const id = Number(caseId);
  if (!Number.isFinite(id)) return null;
  return CapsAddDetails.findOne({
    where: { case_id: id },
    attributes: ['case_id', 'case_status'],
    raw: true,
  });
}

/** Block assessor edits after approver has finalized the case. */
async function assertCaseEditable(caseId) {
  const row = await getCaseRow(caseId);
  if (!row) {
    const err = new Error('Case not found');
    err.statusCode = 404;
    throw err;
  }
  if (isFinalizedApproverStatus(row.case_status)) {
    const err = new Error('This case has already been decided by an approver and cannot be changed.');
    err.statusCode = 409;
    throw err;
  }
  return row;
}

/** Block duplicate approver approve/reject on the same case. */
async function assertCasePendingApprover(caseId) {
  const row = await getCaseRow(caseId);
  if (!row) {
    const err = new Error('Case not found');
    err.statusCode = 404;
    throw err;
  }
  if (isFinalizedApproverStatus(row.case_status)) {
    const err = new Error(`Case ${caseId} has already been approved or rejected by an approver.`);
    err.statusCode = 409;
    throw err;
  }
  return row;
}

module.exports = {
  isFinalizedApproverStatus,
  assertCaseEditable,
  assertCasePendingApprover,
};
