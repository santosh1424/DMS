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
const Redis = require('ioredis');
const socketIO = require('socket.io');

global.constants = require('./constants/sever_constant');
global.logger = require('./config/logger_config');
global.helper = require('./utils/helper');
global.mongoOps = require('./utils/mongoOps');
global.redisOps = require('./utils/redisOps');
global.redisKeys = require('./utils/schema/redis/redisKeys');
global.redisClient = new Redis(constants.REDIS_URI);//Redis Connection
global.redisSubscriber = new Redis(constants.REDIS_URI);//Redis Connection
// global.aes = require('./utils/aes');
const { fnDbConnection } = require('./config/database_config');
const { fnMaintenancesCheck } = require('./middleware/vaildator');
const { fnConfigureSocketIO } = require('./config/socketConfig');
(async (err) => {
    if (err) logger.warn(err);
    try {
        const app = express();

        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        app.use(cors());
        // Use maintenance middleware for all routes
        app.use(fnMaintenancesCheck);

        app.get('/health', (req, res) => res.sendStatus(200).end());
        app.use(require('./routes'));


        const http = require('http').Server(app);
        // Set keepAliveTimeout and headersTimeout to 10 minutes (650000 milliseconds)
        http.keepAliveTimeout = 650000;
        http.headersTimeout = 650000;
        const fnListenServer = async (http) => {
            await http.listen(constants.PORT, constants.LOCAL_IP, async () => {
                try {
                    await fnDbConnection(constants.MONGODB_URI);//MongoDB Connection
                    const io = socketIO(http, {
                        reconnection: true,// Enable reconnection
                        reconnectionDelay: 1000, // Delay between reconnection attempts (in milliseconds)
                        // reconnectionAttempts: 3, // Number of reconnection attempts
                        cors: {
                            origin: ["http://localhost:5173", "http://192.168.1.9:3000", "http://localhost:3000"]//Frontend ip
                        }
                    });
                    await fnConfigureSocketIO(io);//Socket Connection
                    logger.info('Server is Up and Running', http.address());
                } catch (error) {
                    logger.warn(`fnListenServer`, error);
                    return process.exit(1);
                }
            });
        }
        await fnListenServer(http);

    } catch (error) {
        // Graceful Restart if error occurs
        return await helper.fnGracefulRestart(error);
    }
    return null;
})();

