const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('StatusHistory', {
  ID:           { type: DataTypes.INTEGER,    primaryKey: true, autoIncrement: true },
  CLAIM_NUMBER: { type: DataTypes.STRING(50), allowNull: false },
  POLICY_NUMBER:{ type: DataTypes.STRING(50) },
  STATUS:       { type: DataTypes.STRING(50) },
  MODIFIED_BY:  { type: DataTypes.STRING(100) },
  MODIFIED_ON:  { type: DataTypes.DATE },
  CREATED_ON:   { type: DataTypes.DATE },
  CREATED_BY:   { type: DataTypes.STRING(20) },
  DECISION:     { type: DataTypes.STRING(255) },
  REMARKS:      { type: DataTypes.STRING(255) },
}, { tableName: 'STATUS_HISTORY', timestamps: false, freezeTableName: true })
