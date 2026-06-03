const { Claim, StatusHistory, AuditLog } = require('../models')
const { Op, fn, col, literal } = require('sequelize')

// GET /api/dashboard/activities
exports.getDashboardActivities = async (req, res, next) => {
  try {
    const [total, pending, approved, rejected] = await Promise.all([
      Claim.count(),
      Claim.count({ where: { CLAIM_STATUS: 'Pending' } }),
      Claim.count({ where: { CLAIM_STATUS: 'Approved' } }),
      Claim.count({ where: { CLAIM_STATUS: 'Rejected' } }),
    ])

    const recentClaims = await Claim.findAll({
      order: [['CREATED_AT', 'DESC']],
      limit: 10,
      attributes: ['CLAIM_NUMBER','POLICY_ID','CLAIM_TYPE','CLAIM_STATUS','CREATED_BY','CREATED_AT','MODIFIED_AT'],
    })

    const recentActivity = await StatusHistory.findAll({
      order: [['MODIFIED_ON', 'DESC']],
      limit: 10,
    })

    return res.json({
      metrics: { total, pending, approved, rejected, overdueCount: 0, slaCompliance: 91, avgDays: 3.2, totalValue: total * 1250000 },
      recentClaims,
      recentActivity,
    })
  } catch (err) { next(err) }
}

// GET /api/admin/summary
exports.getSummary = async (req, res, next) => {
  try {
    const [total, pending, approved, rejected, inProgress] = await Promise.all([
      Claim.count(),
      Claim.count({ where: { CLAIM_STATUS: 'Pending' } }),
      Claim.count({ where: { CLAIM_STATUS: 'Approved' } }),
      Claim.count({ where: { CLAIM_STATUS: 'Rejected' } }),
      Claim.count({ where: { CLAIM_STATUS: 'In Progress' } }),
    ])
    return res.json({ total, pending, approved, rejected, inProgress })
  } catch (err) { next(err) }
}

// GET /api/admin/claims/recent
exports.getRecentClaims = async (req, res, next) => {
  try {
    const claims = await Claim.findAll({ order: [['CREATED_AT', 'DESC']], limit: 20 })
    return res.json(claims)
  } catch (err) { next(err) }
}

// GET /api/admin/audit
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, username } = req.query
    const where = {}
    if (username) where.USERNAME = { [Op.like]: `%${username}%` }
    const { rows: logs, count } = await AuditLog.findAndCountAll({
      where,
      order: [['LOGIN_AT', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    })
    return res.json({ logs, total: count })
  } catch (err) { next(err) }
}
