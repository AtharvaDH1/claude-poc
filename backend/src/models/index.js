const sequelize    = require('../config/database')
const User         = require('./User')
const Claim        = require('./Claim')
const StatusHistory= require('./StatusHistory')
const IntimationDetail = require('./IntimationDetail')
const ClaimantDetail   = require('./ClaimantDetail')
const Document     = require('./Document')
const AuditLog     = require('./AuditLog')

module.exports = { sequelize, User, Claim, StatusHistory, IntimationDetail, ClaimantDetail, Document, AuditLog }
