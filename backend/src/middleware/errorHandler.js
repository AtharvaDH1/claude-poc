const logger = require('../config/logger')

const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.path} — ${err.message}`, err)
  const status  = err.status || err.statusCode || 500
  const message = err.message || 'Internal server error'
  const detail  = process.env.EXPOSE_ERROR_DETAIL === 'true' ? err.stack : undefined
  res.status(status).json({ message, ...(detail && { detail }) })
}

module.exports = errorHandler
