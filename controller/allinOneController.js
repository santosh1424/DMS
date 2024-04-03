'use strict'
/**
 * 
 * allinOneController.js: Controllers for all
 * Developer:Santosh Dubey
 * Codium Technology
 * 
 */
const _ = require('lodash');
const httpResponse = require('../utils/httpResponse');
const admins = require('../utils/schema/admins');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');

const fnTestApp = (req, res) => {
    try {
        const message = 'This is MessagE'
        logger.info(`fnTestApp ${message}`)
        return res.status(200).json({ message });

    } catch (err) {
        return logger.error('fnTestApp', err)

    }

}

//Adding SuperUser in DMS
const fnAddAdmin = async (req, res) => {
    try {
        req.body = helper.fnParseJSON(req.body)
        const query = { E: req.body.E };
        const hashedPassword = await bcrypt.hash(req.body.P, 10);

        await admins.findOneAndUpdate(query, { ...req.body, P: hashedPassword }, {
            new: true,
            upsert: true
        });

        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.error('fnAddAdmin', error)
        if (error.code === 11000) return httpResponse.fnConflict(res);//DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};

const fnLoginAdmin = async (req, res) => {
    try {
        req.body = helper.fnParseJSON(req.body)
        const admin = await admins.findOne({ E: req.body.E });
        if (!admin) return httpResponse.fnUnauthorized(res);

        const isPasswordValid = await bcrypt.compare(req.body.P, admin.P);
        if (!isPasswordValid) return httpResponse.fnUnauthorized(res);
        else {
            admin.token = await jwt.sign({
                E: admin.E,
                N: admin.N
            }, constants.SECRET_KEY);
            return res.status(200).json({ admin });
        }
    } catch (error) {
        logger.error('fnLoginAdmin', error)
        return httpResponse.fnBadRequest(res);
    }

}
module.exports = {
    fnTestApp,
    fnAddAdmin,
    fnLoginAdmin
}