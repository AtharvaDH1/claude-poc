const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

// Mirrors existing `claims` table — UPPERCASE columns, NO sync
const Claim = sequelize.define('Claim', {
  CLAIM_ID:              { type: DataTypes.INTEGER,    primaryKey: true, autoIncrement: true },
  CASE_ID:               { type: DataTypes.INTEGER },
  POLICY_ID:             { type: DataTypes.STRING(50) },
  CLAIM_NUMBER:          { type: DataTypes.STRING(50) },
  CLAIM_TYPE:            { type: DataTypes.STRING(50) },
  PORTFOLIO:             { type: DataTypes.STRING(50) },
  CLAIM_STATUS:          { type: DataTypes.STRING(50) },
  CLAIM_ACTIVITY_STATUS: { type: DataTypes.STRING(100) },
  ASSIGNED_TO:           { type: DataTypes.STRING(100) },
  CREATED_BY:            { type: DataTypes.STRING(100) },
  CREATED_AT:            { type: DataTypes.DATE },
  MODIFIED_BY:           { type: DataTypes.STRING(100) },
  MODIFIED_AT:           { type: DataTypes.DATE },
  ASSESSMENT_USERNAME:   { type: DataTypes.STRING(100) },
  APPROVER_USERNAME:     { type: DataTypes.STRING(100) },
  INITIATION_DATE:       { type: DataTypes.DATE },
  DATE_OF_DEATH:         { type: DataTypes.DATE },
  DECISION_PRI:          { type: DataTypes.STRING(50) },
  DECISION_SEC:          { type: DataTypes.STRING(50) },
  IS_VERIFIED:           { type: DataTypes.BOOLEAN },
  IS_SAMPLED:            { type: DataTypes.BOOLEAN },
}, {
  tableName:  'claims',
  timestamps: false,
  freezeTableName: true,
})

module.exports = Claim
