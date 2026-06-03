const { Claim, StatusHistory, IntimationDetail, ClaimantDetail } = require('../models')
const { Op } = require('sequelize')
const logger = require('../config/logger')

const ADMIN_ROLES = ['admin', 'Admin', 'ROLE_ADMIN']
const OP_ROLES    = ['Pre Assessor', 'Assessor', 'Verifier']

// POST /api/claims/claimByUsername
exports.getClaimByUsername = async (req, res, next) => {
  try {
    const { username } = req.body
    const reqUser  = req.user?.username
    const reqRoles = req.user?.roles || []
    const isAdmin  = reqRoles.some(r => ADMIN_ROLES.includes(r))
    const target   = isAdmin ? (username || reqUser) : reqUser

    const claims = await Claim.findAll({
      where: {
        [Op.or]: [
          { CREATED_BY:          target },
          { ASSIGNED_TO:         target },
          { ASSESSMENT_USERNAME: target },
          { APPROVER_USERNAME:   target },
          { MODIFIED_BY:         target },
        ],
      },
      order: [['CREATED_AT', 'DESC']],
    })
    return res.json(claims)
  } catch (err) { next(err) }
}

// GET /api/claim-search
exports.searchClaims = async (req, res, next) => {
  try {
    const { q, status, priority, page = 1, limit = 20 } = req.query
    const where = {}
    if (q)      { where[Op.or] = [{ CLAIM_NUMBER: { [Op.like]: `%${q}%` } }, { POLICY_ID: { [Op.like]: `%${q}%` } }] }
    if (status) { where.CLAIM_STATUS = status }

    const { rows: claims, count } = await Claim.findAndCountAll({
      where,
      order: [['CREATED_AT', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    })
    return res.json({ claims, total: count, page: parseInt(page), pages: Math.ceil(count / limit) })
  } catch (err) { next(err) }
}

// GET /api/claims/:claimNumber
exports.getClaimByNumber = async (req, res, next) => {
  try {
    const claim = await Claim.findOne({ where: { CLAIM_NUMBER: req.params.claimNumber } })
    if (!claim) return res.status(404).json({ message: 'Claim not found.' })
    const intimation = await IntimationDetail.findOne({ where: { CLAIM_ID: req.params.claimNumber } }).catch(() => null)
    const claimants  = await ClaimantDetail.findAll({ where: { CLAIM_ID: req.params.claimNumber } }).catch(() => [])
    return res.json({ ...claim.toJSON(), intimation, claimants })
  } catch (err) { next(err) }
}

// POST /api/register-claim
exports.registerClaim = async (req, res, next) => {
  try {
    const { policyData } = req.body
    const username = req.user?.username
    const year = new Date().getFullYear()
    const seq  = Math.floor(Math.random() * 9000) + 1000
    const claimNumber = `CLM-${year}-${seq}`

    // 1. Create main claim record
    const claim = await Claim.create({
      POLICY_ID:    policyData.policyId,
      CLAIM_NUMBER: claimNumber,
      CLAIM_TYPE:   policyData.claimType,
      PORTFOLIO:    policyData.portfolio || 'Individual',
      CLAIM_STATUS: 'Pending',
      CLAIM_ACTIVITY_STATUS: 'Registered',
      CREATED_BY:   username,
      CREATED_AT:   new Date(),
      MODIFIED_BY:  username,
      MODIFIED_AT:  new Date(),
      DATE_OF_DEATH: policyData.dateOfDeathEvent || null,
      INITIATION_DATE: policyData.intimationDate || new Date(),
    })

    // 2. Intimation details
    if (policyData.intimationDate) {
      await IntimationDetail.create({
        CLAIM_ID:        claimNumber,
        CLAIM_TYPE:      policyData.claimType,
        INTIMATION_DATE: policyData.intimationDate,
        DATE_OF_DEATH_EVENT: policyData.dateOfDeathEvent,
        SOURCE:          policyData.source,
        BOND_TYPE:       policyData.bondType,
        FIR_PM_RECEIVED: policyData.firPmReceived,
        DECLARED_BY_DOCTOR: policyData.declaredByDoctor,
        PLACE_OF_DEATH:  policyData.placeOfDeath,
        CAUSE_CODE:      policyData.causeCode,
        CAUSE_DESCRIPTION: policyData.causeDescription,
        CAUSE_CATEGORY:  policyData.causeCategory,
        DEATH_CERTIFICATE: policyData.deathCertificate,
        DC_REG_NUMBER:   policyData.dcRegNumber,
        DC_ISSUE_STATE:  policyData.dcIssueState,
      }).catch(() => {})
    }

    // 3. Claimant details
    if (policyData.claimants?.length) {
      await ClaimantDetail.create({
        CLAIM_ID:  claimNumber,
        NAME:      policyData.claimants[0]?.name,
        MOBILE_NO: policyData.claimants[0]?.mobileNo,
        EMAIL_ID:  policyData.claimants[0]?.emailId,
        ROLE:      policyData.claimants[0]?.role,
        RELATION:  policyData.claimants[0]?.relation,
        PAN_NO:    policyData.claimants[0]?.panNo,
        CITY:      policyData.claimants[0]?.city,
        STATE:     policyData.claimants[0]?.state,
      }).catch(() => {})
    }

    // 4. Status history
    await StatusHistory.create({
      CLAIM_NUMBER:  claimNumber,
      POLICY_NUMBER: policyData.policyId,
      STATUS:        'Pending',
      CREATED_BY:    username,
      CREATED_ON:    new Date(),
      MODIFIED_BY:   username,
      MODIFIED_ON:   new Date(),
      REMARKS:       'Claim registered',
    }).catch(() => {})

    logger.info(`Claim registered: ${claimNumber} by ${username}`)
    return res.status(201).json({ claimNo: claimNumber, status: 'Registered', message: `Claim ${claimNumber} registered successfully.` })
  } catch (err) { next(err) }
}

// POST /api/claims/changeStatus
exports.changeStatus = async (req, res, next) => {
  try {
    const { claimNumber, status, remarks, decision } = req.body
    const username = req.user?.username

    await Claim.update(
      { CLAIM_STATUS: status, MODIFIED_BY: username, MODIFIED_AT: new Date() },
      { where: { CLAIM_NUMBER: claimNumber } }
    )

    await StatusHistory.create({
      CLAIM_NUMBER: claimNumber,
      STATUS:       status,
      MODIFIED_BY:  username,
      MODIFIED_ON:  new Date(),
      CREATED_ON:   new Date(),
      CREATED_BY:   username,
      DECISION:     decision || '',
      REMARKS:      remarks || '',
    }).catch(() => {})

    return res.json({ message: `Claim ${claimNumber} updated to ${status}.` })
  } catch (err) { next(err) }
}

// POST /api/claims/assignClaim
exports.assignClaim = async (req, res, next) => {
  try {
    const { claimNumber, assignTo, role } = req.body
    const updates = { ASSIGNED_TO: assignTo, MODIFIED_BY: req.user?.username, MODIFIED_AT: new Date() }
    if (role === 'Assessor')  updates.ASSESSMENT_USERNAME = assignTo
    if (role === 'Verifier')  updates.APPROVER_USERNAME   = assignTo
    await Claim.update(updates, { where: { CLAIM_NUMBER: claimNumber } })
    return res.json({ message: `Claim ${claimNumber} assigned to ${assignTo}.` })
  } catch (err) { next(err) }
}
