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
const adminSchema = require('../utils/schema/admins_model');
const userSchema = require('../utils/schema/users_model');
const otpSchema = require('../utils/schema/otp_model');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const nodeMailer = require("nodemailer");

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
        const hashedPassword = await bcrypt.hash(req.body.P, 10);
        req.body.MU = constants.maxUser[req.body.MU];

        //Adding User in Admin Schema
        const admin = await mongoOps.fnFindOneAndUpdate(adminSchema, { E: req.body.E, N: req.body.N }, { ...req.body, P: hashedPassword }, { new: true, upsert: true });
        // Remove Extra Data Before inserting User Schema
        delete req.body.TU;
        delete req.body.MU;

        req.body.BID = parseInt(admin.BID);//Adding Bussiness ID

        //Adding User in User Schema
        await mongoOps.fnFindOneAndUpdate(userSchema, { E: req.body.E, N: req.body.N }, { ...req.body, P: hashedPassword }, { new: true, upsert: true, lean: true });
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.error('fnAddAdmin', error)
        if (error.code === 11000) return httpResponse.fnConflict(res);//DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};

//Login for any Users in DMS
const fnLogin = async (req, res) => {
    try {
        req.body = helper.fnParseJSON(req.body)
        const user = await mongoOps.fnFindOne(userSchema, { E: req.body.E })
        if (!user) return httpResponse.fnUnauthorized(res);

        const isPasswordValid = await bcrypt.compare(req.body.P, user.P);
        if (!isPasswordValid) return httpResponse.fnPreConitionFailed(res);
        // if (!user.EV) return httpResponse.fnConflict(res);
        else {
            const token = await jwt.sign({
                E: user.E,
                N: user.N,
                BID: user.BID,
                EV: user.EV || 0,
            }, constants.SECRET_KEY);

            //Update TKN in MongoDB Testing only
            await mongoOps.fnFindOneAndUpdate(userSchema, { E: user.E, BID: user.BID, }, { TKN: token })
            return httpResponse.fnSuccess(res, user);

        }
    } catch (error) {
        logger.error('fnLoginAdmin', error)
        return httpResponse.fnBadRequest(res);
    }

}

//Adding BasicUser in DMS
const fnAddUser = async (req, res) => {
    try {

        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        // if (!req.currentUserData.EV) return httpResponse.fnConflict(res);
        req.body = helper.fnParseJSON(req.body)
        const hashedPassword = await bcrypt.hash(req.body.P, 10);
        req.body.BID = parseInt(req.currentUserData.BID);
        //Update Total User
        await mongoOps.fnFindOneAndUpdate(adminSchema, { BID: req.currentUserData.BID, E: req.currentUserData.E }, { $inc: { TU: 1 } });
        // Add User
        await mongoOps.fnFindOneAndUpdate(userSchema, { E: req.body.E, N: req.body.N, BID: req.currentUserData.BID }, { ...req.body, P: hashedPassword }, { new: true, upsert: true, lean: true })
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.error('fnAddUser', error)
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};

//Edit BasicUser in DMS
const fnEditUser = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        // if (!req.currentUserData.EV) return httpResponse.fnConflict(res);
        req.body = helper.fnParseJSON(req.body)
        const hashedPassword = await bcrypt.hash(req.body.P, 10);
        req.body.BID = parseInt(req.currentUserData.BID);
        // Edit User
        await mongoOps.fnFindOneAndUpdate(userSchema, { R: req.body.R, N: req.body.N, BID: req.currentUserData.BID }, { ...req.body, P: hashedPassword })
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.error('fnEditUser', error)
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);
    }

}

//Get BasicUser in DMS
const fnGetUser = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        // if (!req.currentUserData.EV) return httpResponse.fnConflict(res);
        req.body = helper.fnParseJSON(req.body);
        if (!ObjectID(req.body._id)) return httpResponse.fnUnauthorized(res);
        const user = await mongoOps.fnFindOne(userSchema, { _id: ObjectID(req.body._id), BID: req.currentUserData.BID });
        if (!user) return httpResponse.fnPreConitionFailed(res);
        return httpResponse.fnSuccess(res, user);
    } catch (error) {
        logger.error('fnGetUser', error)
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);
    }

}

const fnSendOTP = async (req, res) => {
    try {
        const email = req.query.email;//"varungokte.codium@gmail.com"//
        const otp = helper.fnRandomNumber(1000, 9999); // Generate a 6-digit OTP
        await mongoOps.fnFindOneAndUpdate(otpSchema, { E: email }, { E: email, otp }, { new: true, upsert: true, lean: true })

        // Send OTP via email
        await _sendEmail({
            to: email,
            subject: 'Email Verification for ERP',
            message: `<h1>Your OTP for ERP</h1>
            <p>Dear User,</p>
            <p>Your OTP is: <strong>${otp}</strong></p>
            <p>Please use this OTP to complete your action on our platform.</p>
            <p>Thank you!</p>`,
        });

        return httpResponse.fnSuccess(res, 'OTP sent successfully');
    } catch (error) {
        logger.error('fnSendOTP', error);
        return httpResponse.fnBadRequest(res);

    }
};

const fnVerifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.query;

        const existingOTP = await mongoOps.fnFindOneAndDelete(otpSchema, { E: email, otp })//await Otps.findOneAndDelete({ email, otp });

        if (existingOTP) {
            await mongoOps.fnFindOneAndUpdate(userSchema, { E: req.body.E }, { EV: 1 })
            return httpResponse.fnSuccess(res, 'OTP verification successful');// OTP is Valid
        }
        else return httpResponse.fnPreConitionFailed(res);// OTP is Invalid
    } catch (error) {
        logger.error('fnVerifyOTP ', error);
        return httpResponse.fnBadRequest(res);
    }
};

module.exports = {
    fnTestApp,
    fnAddAdmin,
    fnLogin,
    fnAddUser,
    fnEditUser,
    fnSendOTP,
    fnVerifyOTP,
    fnGetUser
}

const _sendEmail = async (options) => {
    const transporter = nodeMailer.createTransport({
        host: process.env.SMPT_HOST,
        port: process.env.SMPT_PORT,
        secure: false, // Use SSL
        auth: {
            user: process.env.SMPT_MAIL,
            pass: process.env.SMPT_APP_PASS,
        },

    });

    const mailOptions = {
        from: process.env.SMPT_MAIL,
        to: options.to,
        subject: options.subject,
        html: options.message,
    };

    return await transporter.sendMail(mailOptions);
}