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
    NODE_ENV: process.env.NODE_ENV
}

