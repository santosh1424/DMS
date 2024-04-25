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

module.exports = {
    fnStringlyJSON,
    fnParseJSON,
    fnGracefulRestart,
    fnRandomNumber
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