'use strict'
/**
 * 
 * index.js: Starting Point of Sever 
 * Developer:Santosh Dubey
 * Codium Technology
 * 
 */

require('dotenv').config();
const express = require('express'), cors = require('cors'), httpResponse = require('./utils/httpResponse');

global.constants = require('./constants/sever_constant');
global.logger = require('./config/logger_config');
global.helper = require('./utils/helper');


(async (err, data) => {
    if (err) logger.error(err);
    try {
        const app = express();

        app.use(express.json({}));
        app.use(express.urlencoded({ extended: true }));

        app.use(cors({}));

        app.get('/health', (req, res) => res.sendStatus(200).end());
        app.use(require('./routes'));


        const http = require('http').Server(app);
        const _fnListenServer = (async (http) => {
            http.listen(constants.PORT, constants.LOCAL_IP, () => {
                logger.info('Server is Up and Running', http.address());
            })
        })
        await _fnListenServer(http)


    } catch (error) {
        return logger.error(`Sever ERR ${error}`);

    }
    return null;
}

)();

const _fnListenServer = (async (http) => {
    http.listen(constants.PORT, constants.LOCAL_IP, () => {
        logger.info('Server is Up and Running', http.address());
    })
})
