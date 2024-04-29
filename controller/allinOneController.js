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
const aes = require('../utils/aes');
const redisKeys = require('../utils/schema/redis/redisKeys');
const redisSchema = require('../utils/schema/redis/model/allinOne_schema')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const nodeMailer = require("nodemailer");
const ObjectId = require('mongoose').Types.ObjectId;

const fnTestApp = (req, res) => {
    try {
        const message = 'This is MessagE'
        logger.info(`fnTestApp ${message}`)
        return res.status(200).json({ message });

    } catch (err) {
        return logger.warn('fnTestApp', err)

    }

}

const fnEncryptTest = async (req, res) => {
    try {
        const data = await aes.fnEncryptAES(req.body.data);
        return res.status(200).json({ data });
    } catch (err) {
        logger.warn('fnEncryptTest', err)
        return httpResponse.fnBadRequest(res);

    }
}

const fnDecryptTest = async (req, res) => {
    try {
        const data = await aes.fnDecryptAES(req.body.data);
        return res.status(200).jsonp(data);
    } catch (err) {
        logger.warn('fnDecryptTest', err)
        return httpResponse.fnBadRequest(res);
    }
}

//Adding SuperUser 
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

//Login for any Users 
const fnLogin = async (req, res) => {
    try {
        req.body = await helper.fnParseJSON(req.body) || null;
        const user = await mongoOps.fnFindOne(userSchema, { E: req.body.E }, { __v: 0 });
        if (!user) return httpResponse.fnUnauthorized(res);
        const isPasswordValid = await bcrypt.compare(req.body.P, user.P);

        if (!isPasswordValid) return httpResponse.fnPreConditionFailed(res);
        else if (user.S != 2) return httpResponse.fnConflict(res);
        //Create a new TKN
        const TKN = await jwt.sign({
            E: user.E,
            N: user.N,
            BID: user.BID,
            S: user.S || 0,
            _userId: user._id
        }, constants.SECRET_KEY);

        //Update TKN in MongoDB
        const updateUserTKN = await mongoOps.fnFindOneAndUpdate(userSchema, { BID: user.BID, E: user.E, }, { TKN }, { new: true, lean: true, projection: { P: 0, __v: 0 } });
        //Add user in redis
        await redisClient.hmset(redisKeys.fnUserKey(user.BID, user._id), await redisSchema.fnSetUserSchema(updateUserTKN));
        const data = { TKN }
        //Encryption
        return httpResponse.fnSuccess(res, await aes.fnEncryptAES(data));
    } catch (error) {
        logger.warn('fnLoginAdmin', error)
        return httpResponse.fnBadRequest(res);
    }

}

//Adding BasicUser 
const fnAddUser = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        req.body = await helper.fnParseJSON(req.body) || null
        const hashedPassword = await bcrypt.hash(req.body.P, 10);
        const BID = parseInt(req.currentUserData.BID) || 0;//UUID
        if (!BID) return httpResponse.fnPreConditionFailed(res);

        //Update Total User
        const admin = await mongoOps.fnFindOneAndUpdate(adminSchema, { BID, E: req.currentUserData.E }, { $inc: { TU: 1 } });
        if (!admin || !Object.keys(admin).length === 0) return httpResponse.fnForbidden(res)
        const _adminId = admin._id
        req.body._adminId = _adminId;//Add Details
        req.body.P = hashedPassword; //Add Password
        req.body.BID = BID;//Add BID

        // Add User
        const addedUser = await mongoOps.fnFindOneAndUpdate(userSchema, { BID, E: req.body.E, N: req.body.N }, { ...req.body }, { new: true, upsert: true, lean: true })
        await redisClient.sadd(redisKeys.fnAddUserKey(BID, _adminId), addedUser._id)

        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnAddUser', error)
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};

//Edit BasicUser 
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

//Get BasicUser 
const fnGetUser = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        const _id = req.query._id || null;
        const BID = parseInt(req.currentUserData.BID) || 0;
        if (!ObjectId.isValid(_id) || !BID) return httpResponse.fnPreConditionFailed(res);
        const data = await aes.fnEncryptAES(await mongoOps.fnFindOne(userSchema, { BID, _id: new ObjectId(_id), }));
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnGetUser', error);
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error  
        else return httpResponse.fnBadRequest(res);
    }

}

//list ALL BasicUser 
const fnListUser = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        const BID = parseInt(req.currentUserData.BID) || 0;
        //Encryption
        const data = await aes.fnEncryptAES(await mongoOps.fnFind(userSchema, { BID }, { __v: 0, P: 0 }))
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnListUser', error);
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error  
        else return httpResponse.fnBadRequest(res);
    }

}

const fnSendOTP = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        if (parseInt(req.currentUserData.S) == 2) return httpResponse.fnPreConditionFailed(res);
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
        return httpResponse.fnSuccess(res);
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
        const _userId = req.currentUserData._userId;
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
                _userId
            }, constants.SECRET_KEY);
            //User Status and TKN
            const updateUserTKN = await mongoOps.fnFindOneAndUpdate(userSchema, { E: email }, { S: 2, TKN });
            await redisClient.hmset(redisKeys.fnUserKey(BID, updateUserTKN._id), await redisSchema.fnSetUserSchema(updateUserTKN));
            const data = await aes.fnEncryptAES(TKN);
            logger.debug("||Verified||", email, _userId)
            return httpResponse.fnSuccess(res, data);
        } else return httpResponse.fnPreConditionFailed(res);// OTP is Invalid
    } catch (error) {
        logger.warn('fnVerifyOTP ', error);
        return httpResponse.fnBadRequest(res);
    }
};

//Create Agreement Id
const fnCreateAID = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        const BID = parseInt(req.currentUserData.BID);
        const AID = req.body.AID || null;

        if (AID) {// Creation of AID with User inputs
            const getAID = await mongoOps.fnFindOne(loanSchema, { AID })
            if (!getAID) {
                const loan = await mongoOps.fnFindOneAndUpdate(loanSchema, { BID, AID }, { AID }, { new: true, lean: true, upsert: true })
                const data = await aes.fnEncryptAES({ AID: loan.AID, _loanId: loan._id });
                return httpResponse.fnSuccess(res, data);
            }
            else return httpResponse.fnConflict(res); //AID already Exist

        } else {//Automatic Creation of AID
            const loan = await mongoOps.fnInsertOne(loanSchema, { BID })//await mongoOps.fnFindOneAndUpdate(contactsSchema, { BID }, {}, { new: true, lean: true, upsert: true })
            const data = await aes.fnEncryptAES({ AID: loan.AID, _loanId: loan._id });
            return httpResponse.fnSuccess(res, data);
        }

    } catch (error) {
        logger.warn('fnCreateAID', error)
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};

//Create Loan
const fnCreateLoan = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        const BID = parseInt(req.currentUserData.BID) || 0;
        const _loanId = req.body._loanId || null;
        if (!ObjectId.isValid(_loanId) || !BID) return httpResponse.fnConflict(res);
        const loan = await mongoOps.fnFindOneAndUpdate(loanSchema, { BID, AID: req.body.AID, _id: new ObjectId(_loanId) }, { ...req.body }, { new: true, lean: true })
        if (!loan) return httpResponse.fnConflict(res);
        logger.debug('Loan Created....', BID, _loanId);
        await redisClient.hmset(redisKeys.fnLoanKey(BID, _loanId), await redisSchema.fnSetLoanSchema(loan));
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnCreateLoan', error)
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};

//Listing All Loans in Current Bussiness
const fnListLoan = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        const BID = parseInt(req.currentUserData.BID) || 0;
        const data = await aes.fnEncryptAES(await mongoOps.fnFind(loanSchema, { BID }));
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnListLoan', error)
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};

//Get Loan 
const fnGetLoan = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        const _id = req.query._loanId || null;
        const BID = parseInt(req.currentUserData.BID) || 0;
        if (!ObjectId.isValid(_id) || !BID) return httpResponse.fnPreConditionFailed(res);
        const data = await aes.fnEncryptAES(await mongoOps.fnFindOne(loanSchema, { BID, _id: new ObjectId(_id) }));
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnGetLoan', error);
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error  
        else return httpResponse.fnBadRequest(res);
    }

}

//Create Contacts
const fnCreateContact = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        const BID = parseInt(req.currentUserData.BID) || 0;
        const _loanId = req.body._loanId || null;
        const _contactId = req.body._contactId || null;
        const type = req.query.type || null;
        // req.body=helper.fnParseJSON(req.body)
        if (!ObjectId.isValid(_loanId) || !BID) return httpResponse.fnConflict(res);
        const loan = await mongoOps.fnFindOne(loanSchema, { _id: new ObjectId(_loanId) })
        if (loan) {
            let option, query;

            if (type == 'EDIT') {
                option = { new: true, lean: true };
                query = { BID, _id: new ObjectId(_contactId) };
                delete req.body.CE;
            } else {
                query = { BID, _loanId: new ObjectId(_loanId), CE: req.body.CE };
                option = { new: true, lean: true, upsert: true };
            }

            const contact = await mongoOps.fnFindOneAndUpdate(contactsSchema, query, { ...req.body }, option);
            //Only for Edit
            if (type == 'EDIT' && !contact) return httpResponse.fnConflict(res);

            const data = await aes.fnEncryptAES({ _contactId: contact._id });
            return httpResponse.fnSuccess(res, data);
        } else return httpResponse.fnConflict(res);
    } catch (error) {
        logger.warn('fnCreateContact', error);
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);
    }
};

//Get ALL Contacts
const fnListContact = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        const BID = parseInt(req.currentUserData.BID) || 0;
        if (!BID) return httpResponse.fnPreConditionFailed(res);
        const contacts = await mongoOps.fnFind(contactsSchema, { BID, _loanId: new ObjectId(req.query._loanId) }, { __v: 0, })
        //Encryption
        const data = await aes.fnEncryptAES(contacts)
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnListContact', error);
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error  
        else return httpResponse.fnBadRequest(res);
    }

}

//View Single Contact 
const fnGetContact = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        const _id = req.query._id || null;
        const BID = parseInt(req.currentUserData.BID) || 0;
        if (!ObjectId.isValid(_id) || !BID) return httpResponse.fnPreConditionFailed(res);
        const data = await aes.fnEncryptAES(await mongoOps.fnFindOne(contactsSchema, { BID, _id: new ObjectId(req.query._id) }));
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnGetContact', error);
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error  
        else return httpResponse.fnBadRequest(res);
    }
}

//Delete Single Contact 
const fnDeleteContact = async (req, res) => {
    try {
        if (!req.currentUserData || !Object.keys(req.currentUserData).length === 0) return httpResponse.fnUnauthorized(res);
        const _id = req.query._id || null;
        const BID = parseInt(req.currentUserData.BID) || 0;
        if (!ObjectId.isValid(_id) || !BID) return httpResponse.fnPreConditionFailed(res);
        logger.debug('Deleteing.....Contact', BID, new ObjectId(req.query._id))
        const data = await aes.fnEncryptAES(await mongoOps.fnDeleteOne(contactsSchema, { BID, _id: new ObjectId(req.query._id) }));
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnDeleteContact', error);
        if (error.code === 11000) return httpResponse.fnConflict(res);//MongoDB DuplicateKey error  
        else return httpResponse.fnBadRequest(res);
    }
}

module.exports = {
    fnTestApp,
    fnEncryptTest,
    fnDecryptTest,
    fnAddAdmin,
    fnLogin,
    fnAddUser,
    fnEditUser,
    fnSendOTP,
    fnVerifyOTP,
    fnGetUser,
    fnGetContact,
    fnDeleteContact,
    fnListUser,
    fnCreateLoan,
    fnCreateContact,
    fnListContact,
    fnGetLoan,
    fnCreateAID,
    fnListLoan
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