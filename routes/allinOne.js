'use strict'

const express = require('express'), router = express.Router();
const allinOneController = require('../controller/allinOneController')

router.get('/data', allinOneController.fnTestApp)

module.exports = router
