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
    if (_.keys(vaildationError).length > 0) return httpResponse.fnPreConditionFailed(res);
    next()
}

const fnAuthenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        let data = authHeader && authHeader.split(' ')[1];

        if (!data) return httpResponse.fnUnauthorized(res);
        data = await aes.fnDecryptAES(data);
        // Verify token
        jwt.verify(data.TKN, constants.SECRET_KEY, (err, decoded) => {
            if (err) return httpResponse.fnConflict(res);
            //add decoded token in request
            req.currentUserData = decoded || null;
            next();
        });
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
const teamMembersAddVaildate = [
    // check("N", "Name is Required").not().isEmpty().trim(),
    // check("R", "Role is Required").not().isEmpty().trim(),
    // check("E", "Email is Required").not().isEmpty().trim(),
    check("_loanId", "loanId is Required").not().isEmpty().trim(),
    // check("AID", "AID is Required").not().isEmpty().trim(),
    // check("BID", "BID is Required").not().isEmpty().trim(),
];
const roleVaildate = [
    check("N", "Name is Required").not().isEmpty().trim(),
    check("P", "Permission is Required").not().isEmpty().trim()
];
const ratingVaildate = [
    check("A", "Agency is Required").not().isEmpty().isInt(),
    check("T", "Type is Required").not().isEmpty().isInt(),
    check("DT", "Date is Required").not().isEmpty().trim(),
    check("O", "Outlook is Required").not().isEmpty().trim(),
    check("L", "Link is Required").not().isEmpty().trim(),
    check("R", "Rating is Required").not().isEmpty().trim(),
    check("_loanId", "loanId is Required").not().isEmpty().trim(),
];
const createLoanVaildate = [
    check("_loanId", "loanId is Required").not().isEmpty().trim(),
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
const createContactVaildate = [
    //CT CE CN _loanId
    check("AID", "AID is Required").not().isEmpty().trim(),
    // check("CE", "CE is Required").not().isEmpty().trim(),
    // check("CN", "CN is Required").not().isEmpty().trim()
    // check("_loanId", "_loanId is Required").not().isEmpty().trim(), 
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
    createContactVaildate,
    roleVaildate,
    ratingVaildate,
    teamMembersAddVaildate,
    fnMaintenancesCheck
}