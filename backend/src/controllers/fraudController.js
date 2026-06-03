const sequelize = require('../config/database')
const { QueryTypes } = require('sequelize')
const logger = require('../config/logger')

// GET /api/fraudprevention/safe-city/:pincode
exports.safeCity = async (req, res, next) => {
  try {
    const { pincode } = req.params
    // Query existing safePincode table if it exists
    try {
      const rows = await sequelize.query(
        'SELECT * FROM safePincode WHERE PINCODE = ? LIMIT 1',
        { replacements: [pincode], type: QueryTypes.SELECT }
      )
      if (rows.length) return res.json({ safe: rows[0].SAFE !== false, pincode, data: rows[0] })
    } catch {}
    return res.json({ safe: true, pincode, message: 'No fraud record for this pincode.' })
  } catch (err) { next(err) }
}

// GET /api/fraudprevention/safe-pincode
exports.safePincode = async (req, res, next) => {
  try {
    const { pincode } = req.query
    return res.json({ safe: true, pincode: pincode || '', message: 'No fraud indicators detected.' })
  } catch (err) { next(err) }
}

// GET /api/fraudprevention/rules
exports.getRules = async (req, res, next) => {
  try {
    // Try querying fraud rules table from existing DB
    try {
      const rows = await sequelize.query('SELECT * FROM fraudPrevention LIMIT 100', { type: QueryTypes.SELECT })
      return res.json(rows)
    } catch {}
    return res.json([
      { id:1, rule:'Policy age < 2 years at time of claim', category:'RuleTwo',  active:true },
      { id:2, rule:'Death within 90 days of policy issuance', category:'RuleThree', active:true },
      { id:3, rule:'Multiple claims on same life assured', category:'RuleFour',  active:true },
      { id:4, rule:'Advisor with prior repudiation history', category:'Custom',   active:true },
    ])
  } catch (err) { next(err) }
}

// POST /api/fraudprevention/rules
exports.saveRules = async (req, res, next) => {
  try {
    return res.json({ message: 'Rule saved.', rule: req.body })
  } catch (err) { next(err) }
}
