'use strict'
/**
 * 
 * vaildator: Vaildation for Routers 
 * Developer:Santosh Dubey
 * Codium Technology
 * 
 */
const _ = require('lodash');
const httpResponse = require('../utils/httpResponse');
const { check, vaildationResult } = require('express-validator')

const vaildator = (req, res, next) => {
    const vaildationError = vaildationResult(req).mapped();
    if (_.keys(vaildationError).length > 0) return httpResponse.fnPreConitionFailed(res);
    next()
}

const fnAuthenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return httpResponse.fnUnauthorized(res);

    // Verify token
    jwt.verify(token, constants.SECRETKEY, (err, decoded) => {
        if (err) return httpResponse.fnPreConitionFailed(res)
        //add decoded token in request
        req.body.token = decoded;
        next();
    });
}


module.exports = {
    fnAuthenticateToken,
    vaildator
}