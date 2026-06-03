const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

// Mirrors existing `users` table in claims_poc — NO sync
const User = sequelize.define('User', {
  id:                 { type: DataTypes.INTEGER,      primaryKey: true, autoIncrement: true },
  username:           { type: DataTypes.STRING(100),  allowNull: false, unique: true },
  first_Name:         { type: DataTypes.STRING(100),  allowNull: false },
  last_Name:          { type: DataTypes.STRING(100),  allowNull: false },
  email:              { type: DataTypes.STRING(150) },
  phoneNumber:        { type: DataTypes.STRING(20) },
  active:             { type: DataTypes.BOOLEAN,       defaultValue: true },
  created_On:         { type: DataTypes.DATE },
  created_By:         { type: DataTypes.STRING(100) },
  password:           { type: DataTypes.STRING(255),  allowNull: false },
  roles:              { type: DataTypes.JSON },
  failed_attempts:    { type: DataTypes.INTEGER,       defaultValue: 0 },
  lockout_until:      { type: DataTypes.DATE },
  current_session_id: { type: DataTypes.STRING(255) },
}, {
  tableName:  'users',
  timestamps: false,
  freezeTableName: true,
})

module.exports = User
