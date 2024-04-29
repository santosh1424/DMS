'use strict'
/**
 * Developer:Santosh Dubey
 * Codium Technology
 * 
 */
const _ = require('lodash');

const fnStringlyJSON = async (data) => await JSON.stringify(data);
const fnParseJSON = async (data) => await _fnRecuringJSONPrase(data);

const fnGracefulRestart = (err = "") => {
    logger.warn("Graceful Restart: ", err);
    return process.exit(1);
}
const fnRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const fnRandomAlphaNumeric = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
};
module.exports = {
    fnStringlyJSON,
    fnParseJSON,
    fnGracefulRestart,
    fnRandomNumber,
    fnRandomAlphaNumeric
}

const _fnRecuringJSONPrase = async (data) => {
    try {
        if (typeof (data) == 'string') return await _fnRecuringJSONPrase(JSON.parse(data))
        else if (typeof (data) == 'object') return await data;
    } catch (error) {
        return false;
    }
    return false;
}