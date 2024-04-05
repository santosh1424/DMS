'use strict'
/**
 * Developer:Santosh Dubey
 * Codium Technology
 * 
 */
const _ = require('lodash');

const fnStringlyJSON = (data) => JSON.stringify(data);
const fnParseJSON = (data) => _fnRecuringJSONPrase(data);

const fnGracefulRestart = (err = "") => {
    logger.error("Graceful Restart: ", err);
    return process.exit(1);
}
const fnRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

module.exports = {
    fnStringlyJSON,
    fnParseJSON,
    fnGracefulRestart,
    fnRandomNumber
}

const _fnRecuringJSONPrase = (data) => {
    try {
        if (typeof (data) == 'string') return _fnRecuringJSONPrase(JSON.parse(data))
        else if (typeof (data) == 'object') return data;
    } catch (error) {
        return false;
    }
    return false;
}