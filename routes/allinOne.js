'use strict'
/**
 * 
 * allinOne.js: API Entry points 
 * Developer:Santosh Dubey
 * Codium Technology
 * 
 */
const express = require('express'), router = express.Router();
const allinOneController = require('../controller/allinOneController');
const validate = require('../middleware/vaildator')

router.get('/data', allinOneController.fnTestApp);
//Admin Routes
router.post('/addAdmin', [validate.addAdminVaildate, validate.vaildator], allinOneController.fnAddAdmin);
router.post('/login', validate.fnAuthenticateToken, allinOneController.fnLogin);
//Dashboard
router.get('/dashboard', validate.fnAuthenticateToken, ((req, res) => {
    res.send("Dashboard");
}));
//User Routes
router.post('/addUser', [validate.addUserVaildate, validate.fnAuthenticateToken, validate.vaildator], allinOneController.fnAddUser);
// Email
router.get('/sendOTP', allinOneController.fnSendOTP);
router.get('/verifyOTP', allinOneController.fnVerifyOTP);

module.exports = router
