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
router.post('/encrypt', allinOneController.fnEncryptTest);
router.post('/decrypt', allinOneController.fnDecryptTest);
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
router.get('/getUser', validate.fnAuthenticateToken, allinOneController.fnGetUser);
router.get('/getAllUsers', validate.fnAuthenticateToken, allinOneController.fnGetAllUsers);

//Loan Routes 
router.post('/createLoan', [validate.createLoanVaildate, validate.fnAuthenticateToken, validate.vaildator], allinOneController.fnCreateLoan);
router.get('/getLoan', validate.fnAuthenticateToken, allinOneController.fnGetLoan);

// Email
router.get('/sendOTP', validate.fnAuthenticateToken, allinOneController.fnSendOTP);
router.post('/verifyOTP', validate.fnAuthenticateToken, allinOneController.fnVerifyOTP);

module.exports = router
