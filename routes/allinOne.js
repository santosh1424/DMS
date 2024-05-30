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
router.post('/addAdmin', [validate.fnDecryptBody, validate.adminAddVaildate, validate.vaildator], allinOneController.fnAddAdmin);
router.post('/login', [validate.fnDecryptBody, validate.loginVaildate, validate.vaildator], allinOneController.fnLogin);
//Dashboard
router.get('/dashboard', validate.fnAuthenticateToken, ((req, res) => {
    res.send("Dashboard");
}));
//User Routes
router.post('/addUser', [validate.fnDecryptBody, validate.userAddVaildate, validate.fnAuthenticateToken, validate.vaildator], allinOneController.fnAddUser);
router.post('/editUser', validate.fnDecryptBody, validate.fnAuthenticateToken, allinOneController.fnEditUser);
router.get('/getUser', validate.fnAuthenticateToken, allinOneController.fnGetUser);
router.get('/listUser', validate.fnAuthenticateToken, allinOneController.fnListUser);

//Loan Routes 
router.post('/createAID', validate.fnDecryptBody, validate.fnAuthenticateToken, allinOneController.fnCreateAID);
router.post('/createLoan', validate.fnDecryptBody, [validate.createLoanVaildate, validate.fnAuthenticateToken, validate.vaildator], allinOneController.fnCreateLoan);
router.get('/listLoan', validate.fnAuthenticateToken, allinOneController.fnListLoan);
router.get('/getLoan', validate.fnAuthenticateToken, allinOneController.fnGetLoan);

//Teams
router.post('/addMember', [validate.fnDecryptBody, validate.teamMembersAddVaildate, validate.fnAuthenticateToken, validate.vaildator], allinOneController.fnAddTeamMember);
router.get('/getTeam', validate.fnAuthenticateToken, allinOneController.fnGetTeam);
router.get('/suggestion', validate.fnAuthenticateToken, allinOneController.fnSuggestion);

//Roles
router.post('/addRole', [validate.fnDecryptBody, validate.roleVaildate, validate.fnAuthenticateToken, validate.vaildator], allinOneController.fnAddRole);
router.get('/listRole', validate.fnAuthenticateToken, allinOneController.fnListRole);

//Rating
router.post('/addRating', [validate.fnDecryptBody, validate.ratingVaildate, validate.fnAuthenticateToken, validate.vaildator], allinOneController.fnAddRating);
router.get('/listRating', validate.fnAuthenticateToken, allinOneController.fnListRating);
//Contact Routes 
router.post('/createContact', validate.fnDecryptBody, [validate.createContactVaildate, validate.fnAuthenticateToken, validate.vaildator], allinOneController.fnCreateContact);
router.get('/listContact', validate.fnAuthenticateToken, allinOneController.fnListContact);
router.get('/getContact', validate.fnAuthenticateToken, allinOneController.fnGetContact);
router.delete('/deleteContact', validate.fnAuthenticateToken, allinOneController.fnDeleteContact);

// Email
router.get('/sendOTP', validate.fnAuthenticateToken, allinOneController.fnSendOTP);
router.post('/verifyOTP', validate.fnDecryptBody, validate.fnAuthenticateToken, allinOneController.fnVerifyOTP);

//Upload
router.get('/listDocs', validate.fnAuthenticateToken, allinOneController.fnListDocs);
router.get('/listDocsDetail', validate.fnAuthenticateToken, allinOneController.fnListDocsDetail);
router.post('/uploadDocs', validate.fnAuthenticateToken, allinOneController.fnUploadTD);//ADD  validate.fnFileData,  validate.fnDecryptBody, [validate.uploadDocsVaildate, validate.vaildator],
router.get('/viewDocs', validate.fnAuthenticateToken, allinOneController.fnViewDocs);
router.delete('/deleteDocs', validate.fnAuthenticateToken, allinOneController.fnDeleteDocs);
router.get('/downloadDocs', validate.fnAuthenticateToken, allinOneController.fnDownloadDocs);
router.post('/updateDocs', validate.fnAuthenticateToken, allinOneController.fnUpdateTD);//EDIT
// router.post('/uploadTD', validate.fnAuthenticateToken, validate.fnFileData, validate.fnDecryptBody, allinOneController.fnUploadTD);
module.exports = router