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

router.get('/data', allinOneController.fnTestApp);
router.post('/addAdmin', allinOneController.fnAddAdmin);
router.post('/loginAdmin', allinOneController.fnLoginAdmin);

module.exports = router
