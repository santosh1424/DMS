'use strict'
/**
 * 
 * index.js:Starting Point of Sever 
 * Developer:Santosh Dubey
 * Codium Technology
 * 
 */

require('dotenv').config();
const express = require('express');

global.constants = require('./constants/sever_constant');
global.logger = require('./config/logger_config');
const app = express();

// Define routes
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Start server
app.listen(constants.PORT, () => {
    logger.info(`Server is listening on port: ${constants.PORT}`);
});
