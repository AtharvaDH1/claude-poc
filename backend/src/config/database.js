require('dotenv').config()
const { Sequelize } = require('sequelize')
const logger = require('./logger')

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    pool:    { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define:  { timestamps: false, freezeTableName: true },
  }
)

module.exports = sequelize
