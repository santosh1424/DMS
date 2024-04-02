'use strict'

const express = require('express'), router = express.Router();

const apiRouterPath = `/api/${constants.CODE_VERSION}`;
router.use(`${apiRouterPath}/allAPI`, require('./allinOne.js'))

module.exports = router;