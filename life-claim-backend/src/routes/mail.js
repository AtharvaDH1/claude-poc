const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware');
const mailsController = require('../controllers/mailsController')

router.get('/', authMiddleware.authenticate, mailsController.getAllMails)

router.get('/count', authMiddleware.authenticate,  mailsController.getMailsCount) //not used yet

router.get('/:id',authMiddleware.authenticate,  mailsController.getMailById) //not used yet

module.exports = router