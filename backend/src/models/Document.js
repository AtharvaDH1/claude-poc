const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('Document', {
  documentId:     { type: DataTypes.INTEGER,    primaryKey: true, autoIncrement: true },
  claimId:        { type: DataTypes.STRING(100) },
  fileName:       { type: DataTypes.STRING(500) },
  documentType:   { type: DataTypes.STRING(200) },
  AlfrescoFileId: { type: DataTypes.STRING(500) },
  alfrescoRepoId: { type: DataTypes.STRING(500) },
  uploadedOn:     { type: DataTypes.DATE },
  createdby:      { type: DataTypes.STRING(100) },
}, { tableName: 'UploadedDocuments', timestamps: false, freezeTableName: true })
