const bcrypt = require('bcrypt')
const { User } = require('../models')
const logger = require('../config/logger')

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10

// GET /api/user  (admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'current_session_id'] },
      order: [['id', 'ASC']],
    })
    return res.json(users)
  } catch (err) { next(err) }
}

// GET /api/user/:id
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { username: req.params.id },
      attributes: { exclude: ['password', 'current_session_id'] },
    })
    if (!user) return res.status(404).json({ message: 'User not found.' })
    return res.json(user)
  } catch (err) { next(err) }
}

// POST /api/user  (admin only)
exports.createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phoneNumber, username, password, roles, createdBy } = req.body
    if (!username || !password || !firstName || !lastName || !email)
      return res.status(400).json({ message: 'username, password, firstName, lastName and email are required.' })

    const existing = await User.findOne({ where: { username } })
    if (existing) return res.status(409).json({ message: 'Username already exists.' })

    const hashed = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await User.create({
      username,
      first_Name: firstName,
      last_Name:  lastName,
      email,
      phoneNumber: phoneNumber || '',
      password:   hashed,
      roles:      Array.isArray(roles) ? roles : [roles || 'Pre Assessor'],
      active:     true,
      created_On: new Date(),
      created_By: createdBy || req.user?.username || 'admin',
    })
    logger.info(`User created: ${username} by ${req.user?.username}`)
    return res.status(201).json({ userid: user.id, message: 'User created.' })
  } catch (err) { next(err) }
}

// PUT /api/user/:id  (admin only)
exports.updateUser = async (req, res, next) => {
  try {
    const { email, phoneNumber, password, active, roles, first_Name, last_Name } = req.body
    const updates = {}
    if (email)       updates.email       = email
    if (phoneNumber) updates.phoneNumber = phoneNumber
    if (first_Name)  updates.first_Name  = first_Name
    if (last_Name)   updates.last_Name   = last_Name
    if (active !== undefined) updates.active = active
    if (roles)       updates.roles       = Array.isArray(roles) ? roles : [roles]
    if (password)    updates.password    = await bcrypt.hash(password, SALT_ROUNDS)

    await User.update(updates, { where: { username: req.params.id } })
    return res.json({ msg: 'updated' })
  } catch (err) { next(err) }
}

// DELETE /api/user/:id  (admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    await User.destroy({ where: { username: req.params.id } })
    return res.status(204).send()
  } catch (err) { next(err) }
}
