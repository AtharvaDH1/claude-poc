const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware');
const attachmentController = require('../controllers/attachmentsController')


router.get('/:mailId', authMiddleware.authenticate, attachmentController.getAllAttachments);

router.patch('/:mailId', authMiddleware.authenticate, attachmentController.patchAttachments)

module.exports = router 