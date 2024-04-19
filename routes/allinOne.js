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
router.post('/addAdmin', [validate.adminAddVaildate, validate.vaildator], allinOneController.fnAddAdmin);
router.post('/login', [validate.loginVaildate, validate.vaildator], allinOneController.fnLogin);
//Dashboard
router.get('/dashboard', validate.fnAuthenticateToken, ((req, res) => {
    res.send("Dashboard");
}));
//User Routes
router.post('/addUser', [validate.userAddVaildate, validate.fnAuthenticateToken, validate.vaildator], allinOneController.fnAddUser);
router.post('/editUser', validate.fnAuthenticateToken, allinOneController.fnEditUser);
router.post('/getUser', validate.fnAuthenticateToken, allinOneController.fnGetUser);

//Loan Routes
router.post('/CreateLoan', [validate.createLoanVaildate, validate.fnAuthenticateToken, validate.vaildator], allinOneController.fnCreateLoan);

// Email
router.get('/sendOTP', validate.fnAuthenticateToken, allinOneController.fnSendOTP);
router.post('/verifyOTP', validate.fnAuthenticateToken, allinOneController.fnVerifyOTP);

module.exports = router
