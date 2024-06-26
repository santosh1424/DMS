'use strict'
/**
 * 
 * server.js:Starting Point of Sever 
 * Developer:Santosh Dubey
 * Codium Technology
 * 
 */
const reqEnv = ['PORT', 'CODE_VERSION', 'NODE_ENV'];
reqEnv.forEach(element => {
    if (!process.env[element]) throw new Error(`Missing Environment ${element}`)
});
module.exports = {

    PORT: process.env.PORT,
    CODE_VERSION: process.env.CODE_VERSION,
    NODE_ENV: process.env.NODE_ENV,
    LOCAL_IP: process.env.LOCAL_IP || "",
    UNDER_MAINTENANCE_MODE: process.env.UNDER_MAINTENANCE_MODE,
    MONGODB_URI: process.env.MONGODB_URI,
    REDIS_URI: process.env.REDIS_URI,
    SECRET_KEY: process.env.SECRET_KEY,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    //EMAIL
    SMPT_HOST: process.env.SMPT_HOST,
    SMPT_PORT: process.env.SMPT_PORT,
    SMPT_MAIL: process.env.SMPT_MAIL,
    SMPT_APP_PASS: process.env.SMPT_APP_PASS,
    ...require('./erp_constants')
}

