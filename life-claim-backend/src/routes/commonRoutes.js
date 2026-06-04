const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const Email_fax_mobile_SearchController = require('../controllers/email_fax_mobile_SearchController');
const email_fax_contactController = require('../controllers/email_fax_contactController');
const { default: getPolicyDetails } = require('../dataAccess/policyDAO');


router.get('/users', authMiddleware.authenticate, userController.getUsers);
router.post('/user', authMiddleware.authenticate, userController.createUser);
router.put('/user/:id', authMiddleware.authenticate, userController.updateUser);
router.delete('/user/:id', authMiddleware.authenticate,userController.deleteUser);


//Email-Fax-Contact add delete get update
router.get('/searchEmail_fax_contact/:hospitalId', authMiddleware.authenticate, Email_fax_mobile_SearchController.getRecordsforEmail_fax_contact);
router.post('/add-email', authMiddleware.authenticate, email_fax_contactController.addEmailToEntity);
router.post('/add-fax', authMiddleware.authenticate, email_fax_contactController.addFaxToEntity);
router.post('/add-contact', authMiddleware.authenticate, email_fax_contactController.addContactToEntity);
router.put('/updateEmail/:hospitalId', authMiddleware.authenticate, email_fax_contactController.updateEmail);
router.put('/updateFax/:hospitalId', authMiddleware.authenticate, email_fax_contactController.updateFax);
router.put('/updateContact/:hospitalId', authMiddleware.authenticate, email_fax_contactController.updateContact);
router.delete('/delete-email/:hospital_email', authMiddleware.authenticate, email_fax_contactController.deleteEmailFromEntity);
router.delete('/delete-fax/:fax_no', authMiddleware.authenticate, email_fax_contactController.deleteFaxFromEntity);
router.delete('/delete-contact/:hospital_phone', authMiddleware.authenticate, email_fax_contactController.deleteContactFromEntity);

//external




module.exports = router;