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
const { fnDbConnection } = require('./config/database_config');


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
        // Set keepAliveTimeout and headersTimeout to 10 minutes (650000 milliseconds)
        http.keepAliveTimeout = 650000;
        http.headersTimeout = 650000;
        const fnListenServer = (async (http) => {
            await http.listen(constants.PORT, constants.LOCAL_IP, async () => {
                try {
                    //MongoDB Connection
                    await fnDbConnection(constants.MONGODB_URI);
                    logger.info('Server is Up and Running', http.address());
                } catch (error) {
                    logger.error(`fnListenServer`, error);
                    return process.exit(1);
                }
            })
        })
        await fnListenServer(http)


    } catch (error) {
        return helper.fnGracefulRestart(logger.error(`Sever ERR ${error}`));
    }
    return null;
}

)();
