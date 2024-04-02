'use strict'

const _ = require('lodash');

const fnStringlyJSON = (data) => JSON.stringify(data);
const fnParseJSON = (data) => _fnRecuringJSONPrase(data);


module.exports = {
    fnStringlyJSON,
    fnParseJSON
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