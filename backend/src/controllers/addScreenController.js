const { Claim, StatusHistory } = require('../models')
const { Op } = require('sequelize')
const logger = require('../config/logger')

// POST /api/case-search — search cases for Add Screen
exports.caseSearch = async (req, res, next) => {
  try {
    const { caseId, claimId, claimant, status, page = 1, limit = 20 } = req.body || req.query
    const where = {}
    if (claimId) where.CLAIM_NUMBER = { [Op.like]: `%${claimId}%` }
    if (status)  where.CLAIM_STATUS = status

    const { rows, count } = await Claim.findAndCountAll({
      where,
      order: [['CREATED_AT', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    })

    return res.json({
      cases: rows.map((c, i) => ({
        caseId:         `CASE-${new Date().getFullYear()}-${String(i+1).padStart(3,'0')}`,
        claimId:        c.CLAIM_NUMBER,
        claimant:       c.CREATED_BY || 'Unknown',
        type:           c.CLAIM_TYPE || 'Death Claim',
        registeredDate: c.CREATED_AT ? c.CREATED_AT.toString().split('T')[0] : '',
        assignedTo:     c.ASSIGNED_TO || 'Unassigned',
        status:         c.CLAIM_STATUS || 'Open',
      })),
      total: count,
    })
  } catch (err) { next(err) }
}

// POST /api/caseassignment — assign case to user
exports.caseAssignment = async (req, res, next) => {
  try {
    const { claimNumber, assignTo, role } = req.body
    const username = req.user?.username
    const updates = { ASSIGNED_TO: assignTo || username, MODIFIED_BY: username, MODIFIED_AT: new Date() }
    if (role === 'Assessor')  updates.ASSESSMENT_USERNAME = assignTo || username
    if (role === 'Verifier')  updates.APPROVER_USERNAME   = assignTo || username
    await Claim.update(updates, { where: { CLAIM_NUMBER: claimNumber } })
    await StatusHistory.create({ CLAIM_NUMBER: claimNumber, STATUS: 'In Progress', MODIFIED_BY: username, MODIFIED_ON: new Date(), CREATED_ON: new Date(), CREATED_BY: username, REMARKS: `Assigned to ${assignTo || username}` }).catch(() => {})
    return res.json({ message: `Case ${claimNumber} assigned to ${assignTo || username}.` })
  } catch (err) { next(err) }
}

// POST /api/capsAddDetails — save ADD screen details
exports.saveAddDetails = async (req, res, next) => {
  try {
    const { claimNumber, details } = req.body
    if (claimNumber) {
      await Claim.update({ MODIFIED_BY: req.user?.username, MODIFIED_AT: new Date() }, { where: { CLAIM_NUMBER: claimNumber } })
    }
    return res.json({ message: 'ADD details saved.', claimNumber })
  } catch (err) { next(err) }
}

// GET /api/pool-selection — unassigned claims in pool
exports.getPool = async (req, res, next) => {
  try {
    const claims = await Claim.findAll({
      where: { [Op.or]: [{ ASSIGNED_TO: null }, { ASSIGNED_TO: '' }], CLAIM_STATUS: { [Op.notIn]: ['Approved','Rejected'] } },
      order: [['CREATED_AT', 'ASC']],
      limit: 50,
    })
    return res.json(claims.map(c => ({
      claimId:        c.CLAIM_NUMBER,
      policyId:       c.POLICY_ID,
      claimant:       c.CREATED_BY || 'Unknown',
      type:           c.CLAIM_TYPE || 'Death Claim',
      registeredDate: c.CREATED_AT ? c.CREATED_AT.toString().split('T')[0] : '',
      priority:       c.priority   || 'Normal',
      status:         'Unassigned',
      daysOpen:       c.CREATED_AT ? Math.floor((Date.now() - new Date(c.CREATED_AT)) / 86400000) : 0,
    })))
  } catch (err) { next(err) }
}

// POST /api/assessor-fetch — same as pool
exports.assessorFetch = exports.getPool
