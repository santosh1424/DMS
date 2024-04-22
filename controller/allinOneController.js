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
const adminSchema = require('../utils/schema/mongo/admins_model');
const userSchema = require('../utils/schema/mongo/users_model');
const loanSchema = require('../utils/schema/mongo/loans_model');
const contactsSchema = require('../utils/schema/mongo/contacts_model');
// const otpSchema = require('../utils/schema/mongo/otp_model');
const redisKeys = require('../utils/schema/redis/redisKeys');
const redisSchema = require('../utils/schema/redis/model/allinOne_schema')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const nodeMailer = require("nodemailer");

const fnTestApp = (req, res) => {
    try {
        const message = 'This is MessagE'
        logger.info(`fnTestApp ${message}`)
        return res.status(200).json({ message });

    } catch (err) {
        return logger.warn('fnTestApp', err)

    }

}

//Adding SuperUser in DMS
const fnAddAdmin = async (req, res) => {
    try {
        req.body = helper.fnParseJSON(req.body) || null;
        const hashedPassword = await bcrypt.hash(req.body.P, 10);
        req.body.MU = constants.maxUser[req.body.MU];//server constants

        //Adding User in Admin Schema
        const admin = await mongoOps.fnFindOneAndUpdate(adminSchema, { E: req.body.E, N: req.body.N }, { ...req.body, P: hashedPassword }, { new: true, upsert: true, projection: { P: 0, __v: 0 } },);
        // Remove Extra Data Before inserting User Schema
        delete req.body.TU;
        delete req.body.MU;

        req.body.BID = parseInt(admin.BID);//Adding Bussiness ID
        //redisClient.hmset(redisKeys.fnAdminKey(admin._id), "_adminId", admin._id);
        //Adding User in User Schema
        await mongoOps.fnFindOneAndUpdate(userSchema, { E: req.body.E, N: req.body.N }, { ...req.body, P: hashedPassword }, { new: true, upsert: true, lean: true, projection: { P: 0, __v: 0 } });
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnAddAdmin', error)
        if (error.code === 11000) return httpResponse.fnConflict(res);//DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};

//Login for any Users in DMS
const fnLogin = async (req, res) => {
    try {
        req.body = helper.fnParseJSON(req.body) || null;
        const user = await mongoOps.fnFindOne(userSchema, { E: req.body.E }, { __v: 0 });
        if (!user) return httpResponse.fnUnauthorized(res);
        const isPasswordValid = await bcrypt.compare(req.body.P, user.P);

        if (!isPasswordValid) return httpResponse.fnPreConitionFailed(res);
        else if (user.S > 2) return httpResponse.fnConflict(res);
        //Create a new TKN
        const token = await jwt.sign({
            E: user.E,
            N: user.N,
            BID: user.BID,
            S: user.S || 0,
        }, constants.SECRET_KEY);

        //Update TKN in MongoDB
        const updateUserTKN = await mongoOps.fnFindOneAndUpdate(userSchema, { E: user.E, BID: user.BID, }, { TKN: token }, { new: true, lean: true, projection: { P: 0, __v: 0 } });
        //Add user in redis
        await redisClient.hmset(redisKeys.fnUserKey(user.BID, user._id), await redisSchema.fnSetUserSchema(updateUserTKN));
        return httpResponse.fnSuccess(res, { token, _userId: updateUserTKN._id });


    } catch (error) {
        logger.warn('fnLoginAdmin', error)
        return httpResponse.fnBadRequest(res);
    }

}

//Adding BasicUser in DMS
const fnAddUser = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        req.body = helper.fnParseJSON(req.body) || null
        const hashedPassword = await bcrypt.hash(req.body.P, 10);
        const BID = parseInt(req.currentUserData.BID) || 0;//UUID
        if (!BID) return httpResponse.fnPreConitionFailed(res);

        //Update Total User
        const admin = await mongoOps.fnFindOneAndUpdate(adminSchema, { BID, E: req.currentUserData.E }, { $inc: { TU: 1 } });
        if (!admin || !Object.keys(admin).length === 0) return httpResponse.fnForbidden(res)
        const _adminId = admin._id
        req.body._adminId = _adminId;//Add Details
        req.body.P = hashedPassword; //Add Password
        req.body.BID = BID;//Add BID

        // Add User
        const addedUser = await mongoOps.fnFindOneAndUpdate(userSchema, { E: req.body.E, N: req.body.N, BID }, { ...req.body }, { new: true, upsert: true, lean: true })
        await redisClient.sadd(redisKeys.fnAddUserKey(BID, _adminId), addedUser._id)

        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnAddUser', error)
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};

//Edit BasicUser in DMS
const fnEditUser = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        req.body = helper.fnParseJSON(req.body)
        const updateUser = {}
        if (req.body.P) updateUser.P = await bcrypt.hash(req.body.P, 10);
        if (req.body.S) updateUser.S = parseInt(req.body.S);
        if (req.body.N) updateUser.N = req.body.N;
        if (req.body.R) updateUser.R = req.body.R;
        req.body.BID = parseInt(req.currentUserData.BID);
        // Edit User
        await mongoOps.fnFindOneAndUpdate(userSchema, { BID: req.currentUserData.BID, E: req.currentUserData.E }, updateUser)
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnEditUser', error)
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);
    }

}

//Get BasicUser in DMS
const fnGetUser = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        const _userId = ObjectID(req.query._id) || null;
        if (!_userId) return httpResponse.fnUnauthorized(res);
        const user = await mongoOps.fnFindOne(userSchema, { _id: _userId, BID: req.currentUserData.BID });
        if (!user) return httpResponse.fnPreConitionFailed(res);
        return httpResponse.fnSuccess(res, user);
    } catch (error) {
        logger.warn('fnGetUser', error);
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error  
        else return httpResponse.fnBadRequest(res);
    }

}
//Get ALL BasicUser in DMS
const fnGetAllUsers = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        const BID = parseInt(req.currentUserData.BID) || 0;
        const alluser = await mongoOps.fnFind(userSchema, { BID },{__v:0,P:0});
        return httpResponse.fnSuccess(res, alluser);
    } catch (error) {
        logger.warn('fnGetAllUsers', error);
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error  
        else return httpResponse.fnBadRequest(res);
    }

}

const fnSendOTP = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        if (parseInt(req.currentUserData.S) == 1) return httpResponse.fnConflict(res);
        const email = req.currentUserData.E;
        const otp = helper.fnRandomNumber(1000, 9999); // Generate a 6-digit OTP
        const otpKey = await redisKeys.fnOTPKey(req.currentUserData.BID, email)

        const existingOTP = await redisClient.get(otpKey);

        if (existingOTP) await redisClient.set(otpKey, otp);
        else await redisClient.set(otpKey, otp, 'EX', 300); // Expire in 5 minutes (300 seconds)


        // Send OTP via email 
        await _sendEmail({
            // bcc: "gauricodium210@gmail.com",
            // cc: "varungokte.codium@gmail.com",
            to: email,
            subject: 'Email Verification for ERP',
            message: `<h1>Your OTP for ERP</h1>
            <p>Dear User,</p>
            <p>Your OTP is: <strong>${otp}</strong></p>
            <p>Please use this OTP to complete your action on our platform.</p>
            <p>Thank you!</p>`,
        });
        logger.debug('Sending...Email', email, otp);
        return httpResponse.fnSuccess(res, 'OTP sent successfully');
    } catch (error) {
        logger.warn('fnSendOTP', error);
        return httpResponse.fnBadRequest(res);

    }
};

const fnVerifyOTP = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        const otp = req.body.otp;
        const email = req.currentUserData.E;
        const BID = parseInt(req.currentUserData.BID);
        const otpKey = await redisKeys.fnOTPKey(req.currentUserData.BID, email)
        // const existingOTP = await mongoOps.fnFindOneAndDelete(otpSchema, { E: email, otp });
        const existingOTP = await redisClient.get(otpKey) || null;

        if (existingOTP && existingOTP == otp) { // OTP is Valid
            await redisClient.del(otpKey);

            const TKN = await jwt.sign({
                E: email,
                N: req.currentUserData.N,
                BID,
                S: 2,
            }, constants.SECRET_KEY);
            //User Status and TKN
            const updateUserTKN = await mongoOps.fnFindOneAndUpdate(userSchema, { E: email }, { S: 2, TKN });
            await redisClient.hmset(redisKeys.fnUserKey(BID, updateUserTKN._id), await redisSchema.fnSetUserSchema(updateUserTKN));
            return httpResponse.fnSuccess(res, token);

        } else return httpResponse.fnPreConitionFailed(res);// OTP is Invalid
    } catch (error) {
        logger.warn('fnVerifyOTP ', error);
        return httpResponse.fnBadRequest(res);
    }
};

//Create Loan
const fnCreateLoan = async (req, res) => {
    try {

        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        req.body = helper.fnParseJSON(req.body);
        if (!req.body || !Object.keys(req.body).length === 0) return httpResponse.fnPreConitionFailed(res);
        const BID = parseInt(req.currentUserData.BID);
        const option = { new: true, lean: true, upsert: true };
        // if (req.query.type == 'add') option.upsert = true;

        //Update Total User : loanSchema ,contactsSchema
        const createLoan = await mongoOps.fnFindOneAndUpdate(loanSchema, { AID: req.body.AID, BID }, { ...req.body }, option)
        await redisClient.hmset(redisKeys.fnLoanKey(BID, createLoan._id), await redisSchema.fnSetLoanSchema(createLoan));
        return httpResponse.fnSuccess(res, { _loanId: createLoan._id });

    } catch (error) {
        logger.warn('fnCreateLoan', error)
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};
const fnGetLoan = async (req, res) => {
    try {

        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        const BID = parseInt(req.currentUserData.BID);
        //Update Total User 
        // loanSchema
        // contactsSchemaallLoan
        const allLoan = await mongoOps.fnFind(loanSchema, { BID })

        //await redisClient.hmset(redisKeys.fnLoanKey(BID, createLoan._id), await redisSchema.fnSetLoanSchema(createLoan));
        return httpResponse.fnSuccess(res, { allLoan });

    } catch (error) {
        logger.warn('fnCreateLoan', error)
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);

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
    fnGetUser,
    fnGetAllUsers,
    fnCreateLoan,
    fnGetLoan
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
        // cc: options.cc,
        // bcc: options.bcc,
        subject: options.subject,
        html: options.message,
    };

    return await transporter.sendMail(mailOptions);
}