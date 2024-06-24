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
const userSchema = require('../utils/schema/mongo/users_model');
const ObjectId = require('mongoose').Types.ObjectId;
const multer = require('multer');
const { fnAllInStorage } = require('../config/file_config');

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
            if (!data.TKN) return httpResponse.fnPreConditionFailed(res);
            if (err) return httpResponse.fnConflict(res);
            //add decoded token in request
            req.currentUserData = decoded || null;
            if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
            next();
        });
    } catch (error) {
        return logger.warn('fnAuthenticateToken', error);
    }

}
const fnFileData = async (req, res, next) => {
    try {
        const uploadMiddleware = multer({ storage: fnAllInStorage }).array('file');

        uploadMiddleware(req, res, (err) => {
            if (err) {
                logger.warn('Error uploading files:', err);
                return httpResponse.fnConflict(res);
            }

            if (!req.files || req.files.length === 0) {
                logger.warn('No files uploaded');
                // return res.status(400).json({ error: 'No files uploaded' });
                return next();
            }

            // logger.debug('Uploaded files:', req.files);
            next();
        });
        return null;
    } catch (error) {
        return logger.warn('fnFileData', error);
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

const fnTD = (req, res, next) => {
    try {
    } catch (error) {
        return logger.warn('fnTD', error);
    }
}
const uploadDocsVaildate = [
    check("N", "Document Name is Required").not().isEmpty().isInt(),
];

// const fnCheckPermission = async (req, res, next) => {
//     try {
//         const _loanId = req.query._loanId;
//         const BID = req.currentUserData.BID;
//         const E = req.currentUserData.E;
//         let data = await mongoOps.fnFindOne(teamSchema, { BID, _id: new ObjectId(_loanId), "M.E": E }, {
//             M: {
//                 $filter: {
//                     input: "$M",
//                     as: "member",
//                     cond: { $eq: ["$$member.E", E] }
//                 },

//             },
//             _id: 0 // Exclude the default _id field from the result
//         })
//         // logger.debug('fnCheckPermission', data.M[0].P)
//         // if (_loanId)
//         return next();
//     } catch (error) {
//         return logger.warn('fnDecryptBody', error);
//     }
// }

const fnGetPermission = async (req, res, next) => {
    try {
        const _id = req.query._id;
        const aPremission = await mongoOps.fnFindOne(userSchema, { _id: new ObjectId(_id) }, { _id: 0, UP: 1 })
        req.currentUserData.UP = aPremission.UP;
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
const addDocsDetails = [
    check("_loanId", "loanId is Required").not().isEmpty().trim(),
    check("N", "Name is Required").not().isEmpty().trim(),
    check("P", "Priority is Required").not().isEmpty().trim(),
    check("SD", "StartDate is Required").not().isEmpty().trim(),
    check("ED", "EndDate is Required").not().isEmpty().trim(),
];

const addPaymentDetails = [
    check('_loanId', 'Loan ID is required').notEmpty().trim(),
    check('F', 'Frequency is required').notEmpty().trim().isIn(['Daily', 'Weekly', 'Monthly', 'Yearly']),
    check('P', 'Principal is required').notEmpty().trim().isNumeric(),
    check('SD', 'Start Date is required').notEmpty().trim().isISO8601(),
    check('ED', 'End Date is required').notEmpty().trim().isISO8601(),
    check('T', 'Type is required').notEmpty().trim().isIn(['fixed', 'manual']),
    check('I', 'Interest is required').notEmpty().trim().isNumeric(),
    check('H', 'Holiday option is required').notEmpty().trim().isIn(['Subsequent', 'Precedent']),
    check('GS', 'General settings are required').notEmpty()
];
const editDocsDetails = [
    check("_id", "_id is Required").not().isEmpty().trim(),
];
const userAddVaildate = [
    check("N", "Name is Required").not().isEmpty().trim(),
    check("R", "Role is Required").not().isEmpty().trim(),
    check("Z", "Zone is Required").not().isEmpty().trim(),
    check("E", "Email is Required").not().isEmpty().trim(),
    check("UP", "User Premission is Required").not().isEmpty().trim(),
    check("P", "Password is Required").not().isEmpty().trim(),
];
const teamAddVaildate = [
    check("N", "Name is Required").not().isEmpty().trim(),
    check("L", "Lead is Required").not().isEmpty(),
    check("TD", "TD is Required").not().isEmpty(),
    check("CD", "CD is Required").not().isEmpty(),
    check("C", "C is Required").not().isEmpty(),
    check("CS", "CS is Required").not().isEmpty(),
    check("CP", "CP is Required").not().isEmpty(),
    // check("_loanId", "loanId is Required").not().isEmpty().trim(),
];
const roleVaildate = [
    check("N", "Name is Required").not().isEmpty().trim(),
    check("P", "Permission is Required").not().isEmpty().trim()
];
const mstVaildate = [
    check("N", "Name is Required").not().isEmpty().trim(),
    check("V", "Value is Required").not().isEmpty().trim()
];
const ratingVaildate = [
    check("A", "Agency is Required").not().isEmpty().trim(),
    check("T", "Type is Required").not().isEmpty().trim(),
    check("DT", "Date is Required").not().isEmpty().trim(),
    check("O", "Outlook is Required").not().isEmpty().trim(),
    check("L", "Link is Required").not().isEmpty().trim(),
    check("V", "Value is Required").not().isEmpty().trim(),
    check("_loanId", "loanId is Required").not().isEmpty().trim(),
];
const createLoanVaildate = [
    check("_loanId", "loanId is Required").not().isEmpty().trim(),
    check("AID", "AID is Required").not().isEmpty().trim(),
    // check("Z", "Z is Required").not().isEmpty().isInt(),
    // check("CN", "CN is Required").not().isEmpty().trim(),
    // check("PN", "PN is Required").not().isEmpty().trim(),
    // check("GN", "GN is Required").not().isEmpty().trim(),
    // check("I", "I is Required").not().isEmpty().isInt(),
    // check("SA", "SA is Required").not().isEmpty().isInt(),
    // check("HA", "HA is Required").not().isEmpty().isInt(),
    // check("PS", "PS is Required").not().isEmpty().isInt(),
    // check("T", "T is Required").not().isEmpty().isInt(),
    // check("ST", "ST is Required").not().isEmpty().isInt(),
    // check("SD", "SD is Required").not().isEmpty().trim(),
    // check("CD", "CD is Required").not().isEmpty().trim()
];
const createContactVaildate = [
    //CT CE CN _loanId
    check("CE", "CE is Required").not().isEmpty().trim(),
    check("_loanId", "loan Id is Required").not().isEmpty().trim()
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
    teamAddVaildate,
    fnMaintenancesCheck,
    // fnCheckPermission
    fnGetPermission,
    fnTD,
    fnFileData,
    uploadDocsVaildate,
    addDocsDetails,
    mstVaildate,
    editDocsDetails,
    addPaymentDetails
}