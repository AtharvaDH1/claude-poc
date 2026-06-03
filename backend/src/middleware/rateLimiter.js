const rateLimit = require('express-rate-limit')

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: parseInt(process.env.RATE_LIMIT_API_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Try again later.' },
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Try again later.' },
})

module.exports = { apiLimiter, authLimiter, loginLimiter }
