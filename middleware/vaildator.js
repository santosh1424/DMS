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
const { check, validationResult } = require('express-validator')
const jwt = require('jsonwebtoken');

const vaildator = (req, res, next) => {
    const vaildationError = validationResult(req).mapped();
    if (_.keys(vaildationError).length > 0) return httpResponse.fnPreConitionFailed(res);
    next()
}

const fnAuthenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return httpResponse.fnUnauthorized(res);

    // Verify token
    jwt.verify(token, constants.SECRET_KEY, (err, decoded) => {
        if (err) return httpResponse.fnConflict(res);
        //add decoded token in request
        req.userToken = decoded;
        logger.info(`req.body ${req.userToken}`);
        next();
    });
}

const addAdminVaildate = [
    check("CN", "Name is Required").not().isEmpty().trim(),
    check("E", "Email is Required").not().isEmpty().trim(),
    check("P", "Password is Required").not().isEmpty().trim(),
    check("TU", "TU is Required").not().isEmpty().isInt(),
    check("MU", "MU is Required").not().isEmpty().isInt(),
];
const addUserVaildate = [
    check("N", "Name is Required").not().isEmpty().trim(),
    check("R", "Role is Required").not().isEmpty().trim(),
    check("E", "Email is Required").not().isEmpty().trim(),
    check("P", "Password is Required").not().isEmpty().trim(),
];
const loginVaildate = [
    check("E", "Email is Required").not().isEmpty().trim(),
    check("P", "Password is Required").not().isEmpty().trim(),
];
module.exports = {
    vaildator,
    fnAuthenticateToken,
    addUserVaildate,
    addAdminVaildate,
    loginVaildate
}