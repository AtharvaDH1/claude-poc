const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('AuditLog', {
  id:        { type: DataTypes.INTEGER,    primaryKey: true, autoIncrement: true },
  USERNAME:  { type: DataTypes.STRING(100) },
  LOGIN_AT:  { type: DataTypes.DATE },
  LOGOUT_AT: { type: DataTypes.DATE },
  roles:     { type: DataTypes.JSON },
  ipAddress: { type: DataTypes.STRING(50) },
  userAgent: { type: DataTypes.STRING(500) },
  action:    { type: DataTypes.STRING(100) },
  session_id:{ type: DataTypes.STRING(255) },
}, { tableName: 'user_login_audit', timestamps: false, freezeTableName: true })
