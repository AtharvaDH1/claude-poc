require('dotenv').config()
const app      = require('./app')
const { sequelize } = require('./models')
const logger   = require('./config/logger')
const fs       = require('fs')
const path     = require('path')

const PORT = parseInt(process.env.PORT) || 3009
const HOST = process.env.HOST || '0.0.0.0'

// ── Ensure logs directory exists ─────────────────────────
const logsDir = path.join(__dirname, '../logs')
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })

async function start() {
  // ── Test DB connection (no sync — schema already exists) ─
  try {
    await sequelize.authenticate()
    logger.info(`✅ Database connected: ${process.env.DB_DATABASE} @ ${process.env.DB_HOST}`)
  } catch (err) {
    logger.error(`❌ Database connection failed: ${err.message}`)
    logger.warn('⚠️  Backend starting without DB. Some endpoints will fail.')
  }

  // ── Start HTTP server ─────────────────────────────────
  const server = app.listen(PORT, HOST, () => {
    logger.info('═══════════════════════════════════════════')
    logger.info('  Life Claims POC Backend')
    logger.info(`  URL    : http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`)
    logger.info(`  DB     : ${process.env.DB_DATABASE} @ ${process.env.DB_HOST}`)
    logger.info(`  Env    : ${process.env.NODE_ENV || 'development'}`)
    logger.info(`  Health : http://localhost:${PORT}/api/health`)
    logger.info('═══════════════════════════════════════════')
  })

  // ── Graceful shutdown ────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down...`)
    server.close(async () => {
      await sequelize.close().catch(() => {})
      logger.info('Server closed.')
      process.exit(0)
    })
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))
}

start()
