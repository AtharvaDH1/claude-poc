const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Policy = sequelize.define('Policy', {
  policy_id:          { type: DataTypes.STRING(20), primaryKey: true },
  holder_name:        { type: DataTypes.STRING(100), allowNull: false },
  product_code:       { type: DataTypes.STRING(20) },
  product_name:       { type: DataTypes.STRING(100) },
  sum_assured:        { type: DataTypes.DECIMAL(15,2) },
  issue_date:         { type: DataTypes.DATEONLY },
  risk_commencement_date: { type: DataTypes.DATEONLY },
  paid_to_date:       { type: DataTypes.DATEONLY },
  premium_status:     { type: DataTypes.STRING(20) },
  premium_frequency:  { type: DataTypes.STRING(20) },
  term:               { type: DataTypes.INTEGER },
  prem_paid_yrs:      { type: DataTypes.INTEGER },
  total_premium_paid: { type: DataTypes.DECIMAL(15,2) },
  current_sa:         { type: DataTypes.DECIMAL(15,2) },
  original_sa:        { type: DataTypes.DECIMAL(15,2) },
  cash_value:         { type: DataTypes.DECIMAL(15,2) },
  maturity_value:     { type: DataTypes.DECIMAL(15,2) },
  advisor_code:       { type: DataTypes.STRING(30) },
  advisor_status:     { type: DataTypes.STRING(20) },
  uw_decision:        { type: DataTypes.STRING(30) },
  sales_channel:      { type: DataTypes.STRING(30) },
  ekit_printed:       { type: DataTypes.ENUM('Yes','No'), defaultValue: 'No' },
  claim_status:       { type: DataTypes.STRING(20) },
  dob:                { type: DataTypes.DATEONLY },
  type:               { type: DataTypes.STRING(30) },
  status:             { type: DataTypes.ENUM('Active','Matured','Lapsed'), defaultValue: 'Active' },
  agent:              { type: DataTypes.STRING(100) },
  clients:            { type: DataTypes.JSON },
  riders:             { type: DataTypes.JSON },
  agent_repudiation:  { type: DataTypes.JSON },
}, { tableName: 'policies', underscored: true })

module.exports = Policy
