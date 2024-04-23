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
const aes = require('../utils/aes');
const { check, validationResult } = require('express-validator')
const jwt = require('jsonwebtoken');

const vaildator = (req, res, next) => {
    const vaildationError = validationResult(req).mapped();
    if (_.keys(vaildationError).length > 0) return httpResponse.fnPreConitionFailed(res);
    next()
}

const fnAuthenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) return httpResponse.fnUnauthorized(res);

        // Verify token
        jwt.verify(token, constants.SECRET_KEY, (err, decoded) => {
            if (err) return httpResponse.fnConflict(res);
            //add decoded token in request
            req.currentUserData = decoded || null;
            next();
        });
        return null;
    } catch (error) {
        return logger.warn('fnAuthenticateToken', error);

    }

}
const fnDecryptBody = async (req, res, next) => {
    try {
        req.body = await aes.fnDecryptAES(req.body.data);   
        return next();
    } catch (error) {
        return logger.warn('fnDecryptBody', error);

    }

}

const adminAddVaildate = [
    check("N", "Name is Required").not().isEmpty().trim(),
    check("E", "Email is Required").not().isEmpty().trim(),
    check("P", "Password is Required").not().isEmpty().trim(),
    check("MU", "MU is Required").not().isEmpty().isInt(),
];
const userAddVaildate = [
    check("N", "Name is Required").not().isEmpty().trim(),
    check("R", "Role is Required").not().isEmpty().trim(),
    check("E", "Email is Required").not().isEmpty().trim(),
    check("P", "Password is Required").not().isEmpty().trim(),
];
const createLoanVaildate = [
    check("AID", "AID is Required").not().isEmpty().trim(),
    check("Z", "Z is Required").not().isEmpty().isInt(),
    check("CN", "CN is Required").not().isEmpty().trim(),
    check("PN", "PN is Required").not().isEmpty().trim(),
    check("GN", "GN is Required").not().isEmpty().trim(),
    check("I", "I is Required").not().isEmpty().isInt(),
    check("SA", "SA is Required").not().isEmpty().isInt(),
    check("HA", "HA is Required").not().isEmpty().isInt(),
    check("PS", "PS is Required").not().isEmpty().isInt(),
    check("T", "T is Required").not().isEmpty().isInt(),
    check("ST", "ST is Required").not().isEmpty().isInt(),
    check("SD", "SD is Required").not().isEmpty().trim(),
    check("CD", "CD is Required").not().isEmpty().trim()
];
const userEditVaildate = [
    check("N", "Name is Required").not().isEmpty().trim(),
    check("R", "Role is Required").not().isEmpty().trim(),
    check("P", "Password is Required").not().isEmpty().trim(),
];
const loginVaildate = [
    check("E", "Email is Required").not().isEmpty().trim(),
    check("P", "Password is Required").not().isEmpty().trim(),
];
//UNDER_MAINTENANCE_MODE
const fnMaintenancesCheck = (req, res, next) => {
    try {
        if (parseInt(constants.UNDER_MAINTENANCE_MODE)) return httpResponse.fnServiceUnavailable(res);
        else next();
    } catch (error) {
        return logger.warn(error);
    }
}
module.exports = {
    vaildator,
    fnAuthenticateToken,
    fnDecryptBody,
    userAddVaildate,
    userEditVaildate,
    adminAddVaildate,
    loginVaildate,
    createLoanVaildate,
    fnMaintenancesCheck
}