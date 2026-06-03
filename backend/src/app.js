require('dotenv').config()
const express      = require('express')
const helmet       = require('helmet')
const cors         = require('cors')
const cookieParser = require('cookie-parser')
const session      = require('express-session')
const { apiLimiter } = require('./middleware/rateLimiter')
const errorHandler = require('./middleware/errorHandler')
const routes       = require('./routes/index')
const logger       = require('./config/logger')

const app = express()

// ── Security headers ──────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", 'https://www.google.com', 'https://www.gstatic.com'],
      frameSrc:   ["'self'", 'https://www.recaptcha.net', 'https://recaptcha.google.com'],
      imgSrc:     ["'self'", 'data:'],
    },
  },
}))

// ── Cache control ─────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  next()
})

// ── Path traversal prevention ─────────────────────────────
app.use((req, res, next) => {
  const url = decodeURIComponent(req.url)
  if (/\.\.[/\\]|%2e%2e/i.test(url)) return res.status(400).json({ message: 'Invalid request path.' })
  next()
})

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',').map(o => o.trim()).filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    logger.warn(`CORS blocked: ${origin}`)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
}))

// ── Body parsing ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// ── Session ───────────────────────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || 'poc-session-secret',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly:  true,
    sameSite:  'lax',
    secure:    process.env.USE_HTTPS === 'true',
    maxAge:    (parseInt(process.env.SESSION_IDLE_TIMEOUT_MINUTES) || 5) * 60 * 1000,
    path:      '/api',
  },
}))

// ── Rate limiting ─────────────────────────────────────────
app.use('/api', apiLimiter)

// ── Routes ────────────────────────────────────────────────
app.use('/api', routes)

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }))

// ── Error handler ─────────────────────────────────────────
app.use(errorHandler)

module.exports = app
