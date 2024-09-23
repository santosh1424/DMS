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
const {
    adminSchema,
    userSchema,
    loanSchema,
    roleSchema,
    teamSchema,
    contactsSchema,
    ratingSchema,
    transactionSchema,
    complianceSchema,
    covenantsSchema,
    subsequentSchema,
    precedentSchema,
    mstSchema,
    managerSchema,
    paymentSchema
    // ,
    // allDocsSchema
} = require('../utils/schema/mongo/index');
const aes = require('../utils/aes');
const redisKeys = require('../utils/schema/redis/redisKeys');
const redisSchema = require('../utils/schema/redis/model/allinOne_schema')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const nodeMailer = require("nodemailer");
const ObjectId = require('mongoose').Types.ObjectId;
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { fnAllInStorage } = require('../config/file_config');
const { fnSendEmail } = require('../config/mailer_config');
const _uploadMiddleware = multer({ storage: fnAllInStorage }).array('file');

const fnTestApp = async (req, res) => {
    try {
        const message = 'this is message';
        logger.info(`fnTestApp ${message}`);

        return res.status(200).json({ message });
    } catch (err) {
        return logger.warn('fnTestApp', err)
    }

}

const fnDashboard = async (req, res) => {
    try {
        const BID = parseInt(req.currentUserData.BID) || 0;
        if (!BID) return httpResponse.fnPreConditionFailed(res);

        const pipeline = [
            {
                $match: {
                    BID
                }
            },
            {
                $group: {
                    _id: "$Z",
                    totalLoans: {
                        $sum: 1
                    },
                    totalSanction: {
                        $sum: "$SA"
                    },
                    totalHold: {
                        $sum: "$HA"
                    }
                }
            }
        ];
        logger.debug('pipeline Dashboard', helper.fnStringlyJSON(pipeline))
        const data = await mongoOps.fnAggregate(loanSchema, pipeline) || {};
        return httpResponse.fnSuccess(res, await aes.fnEncryptAES(data));
    } catch (error) {
        logger.warn('fnGetUserTeams ', error);
        return httpResponse.fnBadRequest(res);
    }
}

//Encrypt
const fnEncryptTest = async (req, res) => {
    try {
        const data = await aes.fnEncryptAES(req.body.data);
        return res.status(200).json({ data });
    } catch (err) {
        logger.warn('fnEncryptTest', err)
        return httpResponse.fnBadRequest(res);
    }
}

//Decrypt
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
        const hashedPassword = await bcrypt.hash(req.body.P, 10);
        req.body.MU = constants.maxUser[req.body.MU];//server constants

        //Adding User in Admin Schema
        const admin = await mongoOps.fnInsertOne(adminSchema, { ...req.body, P: hashedPassword });
        // Remove Extra Data Before inserting User Schema
        delete req.body.TU;
        delete req.body.MU;

        req.body.BID = parseInt(admin.BID);//Adding Bussiness ID
        //redisClient.hmset(redisKeys.fnAdminKey(admin._id), "_adminId", admin._id);
        //Adding User in User Schema
        await mongoOps.fnInsertOne(userSchema, { ...req.body, P: hashedPassword });
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnAddAdmin', error)
        if (error.code === 11000) return httpResponse.fnUnprocessableContent(res);//DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};

//Login for any Users 
const fnLogin = async (req, res) => {
    try {
        const user = await mongoOps.fnFindOne(userSchema, { E: req.body.E }, { __v: 0 });
        if (!user) return httpResponse.fnUnauthorized(res);
        const isPasswordValid = await bcrypt.compare(req.body.P, user.P);

        if (!isPasswordValid) return httpResponse.fnPreConditionFailed(res);
        else if (user.S == "unverfied") return httpResponse.fnConflict(res);
        //Create a new TKN
        const TKN = await jwt.sign({
            E: user.E,
            N: user.N,
            BID: user.BID,
            S: user.S || 'N/A',
            _userId: user._id,
            R: user.R
        }, constants.SECRET_KEY);

        //Update TKN in MongoDB
        const updateUserTKN = await mongoOps.fnFindOneAndUpdate(userSchema, { BID: user.BID, E: user.E, }, { TKN }, { new: true, lean: true, projection: { P: 0, __v: 0 } });
        //Add user in redis
        //await redisClient.hmset(redisKeys.fnUserKey(user.BID, user._id), await redisSchema.fnSetUserSchema(updateUserTKN));
        const userkey = redisKeys.fnUserKey(user.BID, user._id);
        const userData = await redisSchema.fnSetUserSchema(updateUserTKN);

        try {
            await redisClient.multi()
                .hmset(userkey, userData)
                .expire(userkey, 3 * 24 * 60 * 60) // 3 days in seconds
                .exec();

            logger.debug('User set in Redis with expiration', userkey);
        } catch (err) {
            logger.warn('Error setting user in Redis:', err);
            return httpResponse.fnConflict(res);
        }
        //UP: updateUserTKN.UP
        const data = await aes.fnEncryptAES({ TKN })
        //Encryption
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnLoginAdmin', error)
        return httpResponse.fnBadRequest(res);
    }

}

//Adding BasicUser 
const fnAddUser = async (req, res) => {
    try {
        // req.body = await helper.fnParseJSON(req.body) || null
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'user', 'add');
        if (!userPremission) return httpResponse.fnForbidden(res)
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
        if (req.body.UP) req.body.UP = await helper.fnParseJSON(req.body.UP)
        const addedUser = await mongoOps.fnInsertOne(userSchema, req.body)
        if (req.body.M) await mongoOps.fnInsertOne(managerSchema, req.body)
        logger.debug('Addding user....', req.body)
        await redisClient.sadd(redisKeys.fnAddUserKey(BID, _adminId), addedUser._id)

        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnAddUser', error)
        if (error.code === 11000) return httpResponse.fnUnprocessableContent(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};

//Edit BasicUser 
const fnEditUser = async (req, res) => {
    try {
        // req.body = helper.fnParseJSON(req.body)\
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'user', 'edit');
        if (!userPremission) return httpResponse.fnForbidden(res)
        const BID = parseInt(req.currentUserData.BID) || 0;//UUID
        const _id = req.body._id || null;
        if (!ObjectId.isValid(_id) || !BID) return httpResponse.fnPreConditionFailed(res);
        const updateUser = {}
        if (req.body.P) updateUser.P = await bcrypt.hash(req.body.P, 10);
        if (req.body.S) updateUser.S = req.body.S;
        if (req.body.N) updateUser.N = req.body.N;
        if (req.body.R) updateUser.R = req.body.R;
        if (req.body.UP) updateUser.UP = await helper.fnParseJSON(req.body.UP);
        req.body.BID = parseInt(req.currentUserData.BID);
        // Edit User
        await mongoOps.fnFindOneAndUpdate(userSchema, { BID, _id: new ObjectId(_id) }, updateUser)
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnEditUser', error)
        return httpResponse.fnBadRequest(res);
    }

}

//Get BasicUser 
const fnGetUser = async (req, res) => {
    try {
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'user', 'view');
        if (!userPremission) return httpResponse.fnForbidden(res)
        const _id = req.query._id || null;
        // _fnGetModulePermission(req.query._id, 'UM', 'info');//(_userId,moduleName,action)
        const BID = parseInt(req.currentUserData.BID) || 0;
        // if (!req.currentUserData.UP || !req.currentUserData.UP.UM || !req.currentUserData.UP.UM.includes("access")) return httpResponse.fnForbidden(res);
        if (!ObjectId.isValid(_id) || !BID) return httpResponse.fnPreConditionFailed(res);
        const data = await aes.fnEncryptAES(await mongoOps.fnFindOne(userSchema, { BID, _id: new ObjectId(_id) }, { __v: 0, P: 0, _adminId: 0, BID: 0, updatedAt: 0, createdAt: 0 }));
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnGetUser', error);
        return httpResponse.fnBadRequest(res);
    }

}

//List ALL BasicUser 
const fnListUser = async (req, res) => {
    try {
        const BID = parseInt(req.currentUserData.BID) || 0;
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'user', 'access');
        if (!userPremission) return httpResponse.fnForbidden(res)

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const query = BID ? { BID } : {};
        const value = req.query.value || "";
        const type = req.query.type || "";

        if (value && type) {
            if (type === 'N') {
                query.N = { $regex: value, $options: 'i' };// Case-insensitive search
            } else if (type === 'E') {
                query.E = { $regex: value, $options: 'i' };// Case-insensitive search
            }
        }
        const pipeline = [
            { $match: query },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { __v: 0, P: 0, UP: 0, _adminId: 0, updatedAt: 0 } }
                    ]
                }
            }
        ];
        return httpResponse.fnSuccess(res, await aes.fnEncryptAES(await mongoOps.fnAggregate(userSchema, pipeline)));
    } catch (error) {
        logger.warn('fnListUser', error);
        return httpResponse.fnBadRequest(res);
    }

}

const fnSendOTP = async (req, res) => {
    try {
        if (req.currentUserData.S == "Active") return httpResponse.fnPreConditionFailed(res);
        const email = req.currentUserData.E;
        const otp = helper.fnRandomNumber(1000, 9999); // Generate a 6-digit OTP
        const otpKey = await redisKeys.fnOTPKey(req.currentUserData.BID, email)

        const existingOTP = await redisClient.get(otpKey);

        if (existingOTP) await redisClient.set(otpKey, otp);
        else await redisClient.set(otpKey, otp, 'EX', 300); // Expire in 5 minutes (300 seconds)

        // Send OTP via email 
        await fnSendEmail({
            to: email,
            subject: 'Email Verification for DMS',
            message: `<h1>Your OTP for DMS</h1>
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
                S: "Active",
                _userId,
                R: req.currentUserData.R
            }, constants.SECRET_KEY);
            //User Status and TKN
            const updateUserTKN = await mongoOps.fnFindOneAndUpdate(userSchema, { E: email }, { S: "Active", TKN });
            await redisClient.hmset(redisKeys.fnUserKey(BID, updateUserTKN._id), await redisSchema.fnSetUserSchema(updateUserTKN));
            const data = await aes.fnEncryptAES({ TKN: TKN });
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
        const BID = parseInt(req.currentUserData.BID) || 0;
        const AID = req.body.AID || null;
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'loan', 'add');
        if (!userPremission) return httpResponse.fnForbidden(res);
        if (AID) {// Creation of AID with User inputs
            const getAID = await mongoOps.fnFindOne(loanSchema, { AID })
            if (!getAID) {
                const loan = await mongoOps.fnFindOneAndUpdate(loanSchema, { BID, AID }, { AID }, { new: true, lean: true, upsert: true })
                const data = await aes.fnEncryptAES({ AID: loan.AID, _loanId: loan._id });
                return httpResponse.fnSuccess(res, data);
            }
            else return httpResponse.fnUnprocessableContent(res); //AID already Exist

        } else {//Automatic Creation of AID
            const loan = await mongoOps.fnInsertOne(loanSchema, { BID });
            const data = await aes.fnEncryptAES({ AID: loan.AID, _loanId: loan._id });
            return httpResponse.fnSuccess(res, data);
        }

    } catch (error) {
        logger.warn('fnCreateAID', error)
        if (error.code === 11000) return httpResponse.fnUnprocessableContent(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};

//Update Loan
const fnUpdateLoan = async (req, res) => {
    try {
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'loan', 'edit');
        if (!userPremission) return httpResponse.fnForbidden(res);
        const BID = parseInt(req.currentUserData.BID) || 0;
        const _loanId = req.body._loanId || null;
        if (!ObjectId.isValid(_loanId) || !BID) return httpResponse.fnConflict(res);
        const loan = await mongoOps.fnFindOneAndUpdate(loanSchema, { BID, AID: req.body.AID, _id: new ObjectId(_loanId) }, { ...req.body }, { new: true, lean: true })
        if (!loan) return httpResponse.fnConflict(res);
        logger.debug('Loan Created....', BID, _loanId);
        await redisClient.hmset(redisKeys.fnLoanKey(BID, _loanId), await redisSchema.fnSetLoanSchema(loan));
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnUpdateLoan', error)
        return httpResponse.fnBadRequest(res);

    }
};

//Listing All Loans in Current Bussiness
const fnListLoan = async (req, res) => {
    try {
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'loan', 'access');
        if (!userPremission) return httpResponse.fnForbidden(res);
        const BID = parseInt(req.currentUserData.BID) || 0;
        const pageType = req.query.pageType || null;
        const pageValue = req.query.pageValue || null;
        const query = { BID }
        //Pages
        if (pageType && Array.isArray(pageValue) && pageValue.length > 0) {
            if (pageType == 'P') query.P = { $in: pageValue };//Product
            if (pageType == 'Z') query.Z = { $in: pageValue };//Zone
            if (pageType == 'I') query.I = { $in: pageValue };//Industry
        }

        //filter
        const value = req.query.value || "";
        const type = req.query.type || "";

        if (value && type) {
            if (type === 'AID') {
                query.AID = { $regex: value, $options: 'i' };// Case-insensitive search
            } else if (type === 'CN') {
                query.CN = { $regex: value, $options: 'i' };// Case-insensitive search
            }
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const pipeline = [
            { $match: query },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { AID: 1, CN: 1, Z: 1, SA: 1, S: 1 } }
                    ]
                }
            }
        ];

        return httpResponse.fnSuccess(res, await aes.fnEncryptAES(await mongoOps.fnAggregate(loanSchema, pipeline)));
    } catch (error) {
        logger.warn('fnListLoan', error)
        return httpResponse.fnBadRequest(res);

    }
};

//Get Loan 
const fnGetLoan = async (req, res) => {
    try {
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'loan', 'view');
        if (!userPremission) return httpResponse.fnForbidden(res);
        const _id = req.query._loanId || null;
        const BID = parseInt(req.currentUserData.BID) || 0;
        if (!ObjectId.isValid(_id) || !BID) return httpResponse.fnPreConditionFailed(res);
        const data = await aes.fnEncryptAES(await mongoOps.fnFindOne(loanSchema, { BID, _id: new ObjectId(_id) }));
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnGetLoan', error);
        return httpResponse.fnBadRequest(res);
    }
}

//Update Contacts
const fnUpdateContact = async (req, res) => {
    try {

        const _loanId = req.body._loanId || null;
        const _contactId = req.body._contactId || null;
        const BID = parseInt(req.currentUserData.BID) || 0;
        if (!ObjectId.isValid(_loanId) || !BID) return httpResponse.fnConflict(res);
        // const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'loan', 'edit');
        // if (!userPremission) return httpResponse.fnForbidden(res);
        const loan = await mongoOps.fnFindOne(loanSchema, { _id: new ObjectId(_loanId) })
        if (loan) {
            if (_contactId) {
                const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'contact', 'edit');
                if (!userPremission) return httpResponse.fnForbidden(res);
                delete req.body.CE;
                await mongoOps.fnFindOneAndUpdate(contactsSchema, { BID, _id: new ObjectId(_contactId) }, { ...req.body }, { new: true, lean: true });
            } else {
                const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'contact', 'add');
                if (!userPremission) return httpResponse.fnForbidden(res);
                await mongoOps.fnInsertOne(contactsSchema, { BID, ...req.body });
            }
            return httpResponse.fnSuccess(res);
        } else return httpResponse.fnConflict(res);
    } catch (error) {
        logger.warn('fnUpdateContact', error);
        if (error.code === 11000) return httpResponse.fnUnprocessableContent(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);
    }
};

//Get ALL Contacts
const fnListContact = async (req, res) => {
    try {
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'contact', 'access');
        if (!userPremission) return httpResponse.fnForbidden(res);
        const BID = parseInt(req.currentUserData.BID) || 0;
        const _loanId = req.query._loanId || null;
        if (!ObjectId.isValid(_loanId) || !BID) return httpResponse.fnPreConditionFailed(res);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const query = { BID, _loanId: new ObjectId(_loanId) }
        //filter
        const value = req.query.value || "";
        const type = req.query.type || "";

        if (value && type) {
            if (type === 'CE') {
                query.CE = { $regex: value, $options: 'i' };// Case-insensitive search
            } else if (type === 'PN') {
                query.PN = { $regex: value, $options: 'i' };// Case-insensitive search
            } else if (type === 'CN') {
                query.CN = { $regex: value, $options: 'i' };// Case-insensitive search
            }
        }

        const pipeline = [
            { $match: query },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { PN: 1, CE: 1, D: 1, CT: 1 } }
                    ]
                }
            }
        ];

        return httpResponse.fnSuccess(res, await aes.fnEncryptAES(await mongoOps.fnAggregate(contactsSchema, pipeline)));
    } catch (error) {
        logger.warn('fnListContact', error);
        return httpResponse.fnBadRequest(res);
    }

}

//View Single Contact 
const fnGetContact = async (req, res) => {
    try {
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'contact', 'view');
        if (!userPremission) return httpResponse.fnForbidden(res);
        const _id = req.query._id || null;
        const BID = parseInt(req.currentUserData.BID) || 0;
        if (!ObjectId.isValid(_id) || !BID) return httpResponse.fnPreConditionFailed(res);
        const data = await aes.fnEncryptAES(await mongoOps.fnFindOne(contactsSchema, { BID, _id: new ObjectId(req.query._id) }));
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnGetContact', error);
        return httpResponse.fnBadRequest(res);
    }
}

//Delete Single Contact 
const fnDeleteContact = async (req, res) => {
    try {
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'contact', 'delete');
        if (!userPremission) return httpResponse.fnForbidden(res);
        const _id = req.query._id || null;
        const BID = parseInt(req.currentUserData.BID) || 0;
        if (!ObjectId.isValid(_id) || !BID) return httpResponse.fnPreConditionFailed(res);
        await mongoOps.fnDeleteOne(contactsSchema, { BID, _id: new ObjectId(_id) });
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnDeleteContact', error);
        return httpResponse.fnBadRequest(res);
    }
}

//Delete Single Contact 
const fnDeleteLoan = async (req, res) => {
    try {
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'loan', 'delete');
        if (!userPremission) return httpResponse.fnForbidden(res);
        const _id = req.query._id || null;
        const BID = parseInt(req.currentUserData.BID) || 0;
        if (!ObjectId.isValid(_id) || !BID) return httpResponse.fnPreConditionFailed(res);

        const loanDetails = await mongoOps.fnFindOne(loanSchema, { BID, _id: new ObjectId(_id) });
        await mongoOps.fnDeleteOne(loanSchema, { BID, _id: new ObjectId(_id) });
        await mongoOps.fnDeleteOne(paymentSchema, { BID, _loanId: new ObjectId(_id) });
        await mongoOps.fnDeleteMany(ratingSchema, { BID, _loanId: new ObjectId(_id) });
        await mongoOps.fnDeleteMany(contactsSchema, { BID, _loanId: new ObjectId(_id) });
        await mongoOps.fnDeleteMany(transactionSchema, { BID, _loanId: new ObjectId(_id) });
        await mongoOps.fnDeleteMany(complianceSchema, { BID, _loanId: new ObjectId(_id) });
        await mongoOps.fnDeleteMany(covenantsSchema, { BID, _loanId: new ObjectId(_id) });
        await mongoOps.fnDeleteMany(subsequentSchema, { BID, _loanId: new ObjectId(_id) });
        await mongoOps.fnDeleteMany(precedentSchema, { BID, _loanId: new ObjectId(_id) });
        const filepath = path.join(__dirname, '..', `public/docs/${req.currentUserData.BID}/${loanDetails.AID}`);
        if (fs.existsSync(filepath)) {
            const stat = fs.statSync(filepath);
            if (stat.isDirectory()) {
                fs.rmdirSync(filepath, { recursive: true });
                logger.debug('Deleting Loan File Details....', _id, loanDetails);
                return httpResponse.fnSuccess(res);
            } else {
                return httpResponse.fnConflict(res); // Specified path is a directory, not a file
            }
        }
        logger.debug('Delete Loan Account ....', _id);
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnDeleteLoan', error);
        return httpResponse.fnBadRequest(res);
    }
}

//List Suggestion 
const fnSuggestion = async (req, res) => {
    try {
        const BID = parseInt(req.currentUserData.BID) || 0;
        const type = req.query.type || null;
        const Z = req.query.Z || null;//Zone
        const RM = req.query.RM || null;//Reporting Manager
        if (!type || !BID) return httpResponse.fnPreConditionFailed(res);
        let data = {};
        //Relationship Mapping
        if (type == 'UM') {
            data.U = await mongoOps.fnFind(userSchema, { BID, Z }, { N: 1, E: 1 })
            data.R = await mongoOps.fnFind(roleSchema, { BID }, { N: 1, P: 1 })
        } else if (type == 'RM') data = await mongoOps.fnFind(managerSchema, { BID }, { N: 1, E: 1, Z: 1 })
        else if (type == 'TL') data = await mongoOps.fnFind(userSchema, { BID, RM }, { N: 1, E: 1, _id: 0 }) //Team Lead Assingment 
        else if (type == 'AU') data = await mongoOps.fnFind(userSchema, { BID }, { N: 1, E: 1, _id: 0 }) //ALL User
        // logger.debug('suggtion', type, data, { BID, Z })
        data = await aes.fnEncryptAES(data);
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnSuggestion', error);
        return httpResponse.fnBadRequest(res);
    }

}

//Get Team 
const fnGetTeam = async (req, res) => {
    try {
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'team', 'view');
        if (!userPremission) return httpResponse.fnForbidden(res);
        const BID = parseInt(req.currentUserData.BID) || 0;
        const _id = req.query._id || null;
        if (!ObjectId.isValid(_id) || !BID) return httpResponse.fnPreConditionFailed(res);
        //Fetch Single Team Detail
        let data = await mongoOps.fnFindOne(teamSchema, { BID, _id: new ObjectId(_id) }, { __v: 0, _id: 0 })
        data = await aes.fnEncryptAES(data);
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnGetTeam', error);
        return httpResponse.fnBadRequest(res);
    }

}

//Adding Member to a Team 
const fnUpdateTeam = async (req, res) => {
    try {
        const BID = parseInt(req.currentUserData.BID) || 0;//UUID
        const _id = req.body._id || null;
        if (!req.body.TD.M || !req.body.TD.C || !req.body.CD.M || !req.body.CD.C || !req.body.C.M || !req.body.C.C || !req.body.CP.M || !req.body.CP.C || !req.body.CS.M || !req.body.CS.C || !req.body.PD.M || !req.body.PD.C) return httpResponse.fnPreConditionFailed(res);
        if (_id && !ObjectId.isValid(_id)) return httpResponse.fnPreConditionFailed(res);
        else if (_id) {
            const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'team', 'edit');
            if (!userPremission) return httpResponse.fnForbidden(res);
            await mongoOps.fnFindOneAndUpdate(teamSchema, { BID, _id: new ObjectId(_id) }, { ...req.body });
        }
        else {
            const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'team', 'add');
            if (!userPremission) return httpResponse.fnForbidden(res);
            await mongoOps.fnInsertOne(teamSchema, { BID, ...req.body })
        }
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnUpdateTeam', error)
        if (error.code === 11000) return httpResponse.fnUnprocessableContent(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);
    }
};

//Select Team for loan 
const fnRemoveTeams = async (req, res) => {
    try {
        // const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'team', 'select');
        // if (!userPremission) return httpResponse.fnForbidden(res);
        const BID = parseInt(req.currentUserData.BID) || 0;//UUID
        const email = req.body.email || null;
        const _teamId = req.body._teamId || null;
        if (!ObjectId.isValid(_loanId) || !ObjectId.isValid(_teamId) || !BID) return httpResponse.fnPreConditionFailed(res);
        await mongoOps.fnFindOneAndUpdate(loanSchema, { BID, _id: new ObjectId(_loanId) }, { _teamId });
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnRemoveTeams', error);
        return httpResponse.fnBadRequest(res);
    }
}

//Select Team for loan 
const fnSelectTeam = async (req, res) => {
    try {
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'team', 'select');
        if (!userPremission) return httpResponse.fnForbidden(res);
        const BID = parseInt(req.currentUserData.BID) || 0;//UUID
        const _loanId = req.body._loanId || null;
        const _teamId = req.body._teamId || null;
        if (!ObjectId.isValid(_loanId) || !ObjectId.isValid(_teamId) || !BID) return httpResponse.fnPreConditionFailed(res);
        await mongoOps.fnFindOneAndUpdate(loanSchema, { BID, _id: new ObjectId(_loanId) }, { _teamId });
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnSelectTeam', error);
        return httpResponse.fnBadRequest(res);
    }
}

//List Team  +  Current team 
const fnListTeam = async (req, res) => {
    try {
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'team', 'access');
        if (!userPremission) return httpResponse.fnForbidden(res);
        const BID = parseInt(req.currentUserData.BID) || 0;
        const _loanId = req.query._loanId || null;
        if (!BID) return httpResponse.fnPreConditionFailed(res);

        const query = { BID }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        //filter
        const value = req.query.value || "";
        const type = req.query.type || "";

        if (value && type) {
            if (type === 'L') {
                query.L = { $regex: value, $options: 'i' };// Case-insensitive search
            } else if (type === 'N') {
                query.N = { $regex: value, $options: 'i' };// Case-insensitive search
            }
        }
        const pipeline = [
            { $match: query },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { N: 1, L: 1, S: 1, createdAt: 1 } }
                    ]
                }
            }
        ];
        const data = { list: await mongoOps.fnAggregate(teamSchema, pipeline) || null };
        if (_loanId && ObjectId.isValid(_loanId)) data.currentTeam = await mongoOps.fnFindOne(loanSchema, { BID, _id: new ObjectId(_loanId) }, { _teamId: 1, _id: 0 })
        return httpResponse.fnSuccess(res, await aes.fnEncryptAES(data));
    } catch (error) {
        logger.warn('fnListTeam', error);
        return httpResponse.fnBadRequest(res);
    }
}

//List Team  +  Current team 
const fnGetUserTeams = async (req, res) => {
    try {
        // const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'tranfer', 'access');
        // if (!userPremission) return httpResponse.fnForbidden(res);
        const BID = parseInt(req.currentUserData.BID) || 0;
        if (!BID) return httpResponse.fnPreConditionFailed(res);

        const query = { BID }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        //filter
        const email = req.query.value || "";

        const pipeline = [
            {
                $match: {
                    $expr: {
                        $and: [
                            {
                                $or: [
                                    { $eq: ["$L", email] },
                                    { $in: [email, { $ifNull: ["$TD.C", []] }] },
                                    { $in: [email, { $ifNull: ["$CD.M", []] }] },
                                    { $in: [email, { $ifNull: ["$CD.C", []] }] },
                                    { $in: [email, { $ifNull: ["$C.M", []] }] },
                                    { $in: [email, { $ifNull: ["$C.C", []] }] },
                                    { $in: [email, { $ifNull: ["$CP.M", []] }] },
                                    { $in: [email, { $ifNull: ["$CP.C", []] }] },
                                    { $in: [email, { $ifNull: ["$CS.M", []] }] },
                                    { $in: [email, { $ifNull: ["$CS.C", []] }] },
                                    { $in: [email, { $ifNull: ["$PD.M", []] }] },
                                    { $in: [email, { $ifNull: ["$PD.C", []] }] },
                                ]
                            },
                            { $eq: ["$BID", BID] }

                        ]
                    }
                }
            },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { N: 1, L: 1, S: 1, createdAt: 1 } }
                    ]
                }
            }
        ];
        const data = await mongoOps.fnAggregate(teamSchema, pipeline) || {};
        return httpResponse.fnSuccess(res, await aes.fnEncryptAES(data));
    } catch (error) {
        logger.warn('fnGetUserTeams ', error);
        return httpResponse.fnBadRequest(res);
    }
}

//Adding MST 
const fnUpdateMST = async (req, res) => {
    try {
        const BID = parseInt(req.currentUserData.BID) || 0;//UUID
        const _id = req.body._id || null;

        if (!BID || _id && !ObjectId.isValid(_id)) return httpResponse.fnPreConditionFailed(res);

        if (_id) {
            const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'masters', 'edit');
            if (!userPremission) return httpResponse.fnForbidden(res);
            await mongoOps.fnFindOneAndUpdate(mstSchema, { BID, _id: new ObjectId(_id) }, { V: req.body.V })
        }
        else {
            const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'masters', 'add');
            if (!userPremission) return httpResponse.fnForbidden(res);
            await mongoOps.fnInsertOne(mstSchema, { BID, N: req.body.N, V: req.body.V });
        }
        logger.debug('Updating MST.... _id', _id, req.body)
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnUpdateMST', error)
        if (error.code === 11000) return httpResponse.fnUnprocessableContent(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};

//List Role 
const fnListMST = async (req, res) => {
    try {
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'masters', 'access');
        if (!userPremission) return httpResponse.fnForbidden(res);
        const BID = parseInt(req.currentUserData.BID) || 0;
        if (!BID) return httpResponse.fnPreConditionFailed(res);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const pipeline = [
            { $match: { BID } },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { N: 1, V: 1, S: 1 } }
                    ]
                }
            }
        ];

        return httpResponse.fnSuccess(res, await aes.fnEncryptAES(await mongoOps.fnAggregate(mstSchema, pipeline)));
    } catch (error) {
        logger.warn('fnListMST', error);
        return httpResponse.fnBadRequest(res);
    }
}

//Adding Role 
const fnAddRole = async (req, res) => {
    try {
        const BID = parseInt(req.currentUserData.BID) || 0;//UUID        
        const _id = req.body._id || null;
        if (!BID || _id && !ObjectId.isValid(_id)) return httpResponse.fnPreConditionFailed(res);
        if (_id && ObjectId.isValid(_id)) {
            const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'role', 'edit');
            if (!userPremission) return httpResponse.fnForbidden(res);
            await mongoOps.fnFindOneAndUpdate(
                roleSchema,
                { BID, _id: new ObjectId(_id) },
                { ...req.body }
            );

        } else {
            const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'role', 'add');
            if (!userPremission) return httpResponse.fnForbidden(res);
            await mongoOps.fnInsertOne(roleSchema, { BID, ...req.body });
        }

        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnAddRole', error)
        if (error.code === 11000) return httpResponse.fnUnprocessableContent(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};

//List Role 
const fnListRole = async (req, res) => {
    try {
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'role', 'access');
        if (!userPremission) return httpResponse.fnForbidden(res);
        const BID = parseInt(req.currentUserData.BID) || 0;
        if (!BID) return httpResponse.fnPreConditionFailed(res);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const pipeline = [
            { $match: { BID } },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { N: 1, P: 1, S: 1 } }
                    ]
                }
            }
        ];

        return httpResponse.fnSuccess(res, await aes.fnEncryptAES(await mongoOps.fnAggregate(roleSchema, pipeline)));
    } catch (error) {
        logger.warn('fnListRole', error);
        return httpResponse.fnBadRequest(res);
    }
}

//Adding Rating  
const fnAddRating = async (req, res) => {
    try {
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'rating', 'add');
        if (!userPremission) return httpResponse.fnForbidden(res);
        const _loanId = req.body._loanId || null
        if (!ObjectId.isValid(_loanId)) return httpResponse.fnConflict(res);
        // Add Rating
        req.body.BID = parseInt(req.currentUserData.BID) || 0;//UUID
        await mongoOps.fnSave(ratingSchema, req.body);
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnAddRating', error)
        return httpResponse.fnBadRequest(res);

    }
};

//List Rating 
const fnListRating = async (req, res) => {
    try {
        const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'rating', 'access');
        if (!userPremission) return httpResponse.fnForbidden(res);
        const BID = parseInt(req.currentUserData.BID) || 0;
        const _loanId = req.query._loanId || null;
        if (!ObjectId.isValid(_loanId) || !BID) return httpResponse.fnConflict(res);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const pipeline = [
            { $match: { BID, _loanId: new ObjectId(_loanId) } },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { A: 1, T: 1, DT: 1, O: 1, V: 1, L: 1 } }
                    ]
                }
            }
        ];

        return httpResponse.fnSuccess(res, await aes.fnEncryptAES(await mongoOps.fnAggregate(ratingSchema, pipeline)));
    } catch (error) {
        logger.warn('fnListRating', error);
        return httpResponse.fnBadRequest(res);
    }
}

//Adding Edit Delete Transaction,Compliance,Covenants,Covenants Subsequent,Covenants Precedent Documents & Payment Schedule
const fnAddDocsDetails = async (req, res) => {
    try {
        const BID = req.body.BID = parseInt(req.currentUserData.BID) || 0;
        const _loanId = req.body._loanId || null;
        const sessionName = req.body.SN || '';
        if (!ObjectId.isValid(_loanId) || !sessionName) return httpResponse.fnPreConditionFailed(res);
        const _userId = req.currentUserData._userId || ''
        // const [selectedDocsSchema, userPremission] = await _fnSelectSchema(sessionName, 'add');
        let selectedDocsSchema, userPremission;
        switch (sessionName) {
            case 'TD': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'transaction', 'add', 1); selectedDocsSchema = transactionSchema; break;
            case 'CD': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'compliance', 'add', 1); selectedDocsSchema = complianceSchema; break;
            case 'C': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'covenants', 'add', 1); selectedDocsSchema = covenantsSchema; break;
            case 'CS': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'subsequent', 'add', 1); selectedDocsSchema = subsequentSchema; break;
            case 'CP': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'precedent', 'add', 1); selectedDocsSchema = precedentSchema; break;
            default: return httpResponse.fnPreConditionFailed(res);
        }
        if (!userPremission) return httpResponse.fnForbidden(res);
        delete req.body.SN;
        logger.debug('Add Docs Details...', selectedDocsSchema, req.body);
        const output = await mongoOps.fnInsertOne(selectedDocsSchema, { BID, _loanId: new ObjectId(_loanId), ...req.body });
        //Notify Maker
        const data = await mongoOps.fnFindById(loanSchema, _loanId);
        await _fnNotify(BID, _userId, output._id, data._teamId, sessionName, 'M');
        return httpResponse.fnSuccess(res, await aes.fnEncryptAES(output._id));
    } catch (error) {
        logger.warn('fnAddDocsDetails', error)
        if (error.code === 11000) return httpResponse.fnUnprocessableContent(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};

const fnEditDocsDetails = async (req, res) => {
    try {
        const BID = parseInt(req.currentUserData.BID) || 0;
        const _id = req.body._id || null;
        const sessionName = req.body.SN || '';
        const _loanId = req.body._loanId || '';
        const _userId = req.currentUserData._userId || '';
        if (!ObjectId.isValid(_id) || !sessionName || !BID) return httpResponse.fnPreConditionFailed(res);
        let selectedDocsSchema, userPremission;
        switch (sessionName) {
            case 'TD': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'transaction', 'edit', 1); selectedDocsSchema = transactionSchema; break;
            case 'CD': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'compliance', 'edit', 1); selectedDocsSchema = complianceSchema; break;
            case 'C': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'covenants', 'edit', 1); selectedDocsSchema = covenantsSchema; break;
            case 'CS': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'subsequent', 'edit', 1); selectedDocsSchema = subsequentSchema; break;
            case 'CP': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'precedent', 'edit', 1); selectedDocsSchema = precedentSchema; break;
            default: return httpResponse.fnPreConditionFailed(res);
        }
        if (!userPremission) return httpResponse.fnForbidden(res);
        delete req.body.SN;
        delete req.body._loanId;
        const mongoUpdate = { $set: { ...req.body } };
        if (req.body.S == 'Verified') {
            mongoUpdate.$unset = { DEF: 1 };
            const data = await mongoOps.fnFindById(loanSchema, _loanId);
            await _fnNotify(BID, _userId, _id, data._teamId, sessionName, 'L');
        }
        const result = await mongoOps.fnFindOneAndUpdate(selectedDocsSchema, { BID, _id: new ObjectId(_id) }, mongoUpdate);
        logger.debug('EDIT Docs Details...', selectedDocsSchema, result)
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnEDITDocsDetails', error)
        if (error.code === 11000) return httpResponse.fnUnprocessableContent(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};

const fnListDocsDetail = async (req, res) => {
    try {
        const BID = parseInt(req.currentUserData.BID) || 0;
        const _loanId = req.query._loanId || null;
        const sessionName = req.query.SN || null;
        if (!ObjectId.isValid(_loanId) || !sessionName) return httpResponse.fnPreConditionFailed(res);
        let selectedDocsSchema, userPremission;
        switch (sessionName) {
            case 'TD': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'transaction', 'access', 1); selectedDocsSchema = transactionSchema; break;
            case 'CD': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'compliance', 'access', 1); selectedDocsSchema = complianceSchema; break;
            case 'C': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'covenants', 'access', 1); selectedDocsSchema = covenantsSchema; break;
            case 'CS': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'subsequent', 'access', 1); selectedDocsSchema = subsequentSchema; break;
            case 'CP': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'precedent', 'access', 1); selectedDocsSchema = precedentSchema; break;
            default: return httpResponse.fnPreConditionFailed(res);
        }
        if (!userPremission) return httpResponse.fnForbidden(res);
        if (!selectedDocsSchema) return httpResponse.fnConflict(res);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const query = { BID, _loanId: new ObjectId(_loanId) }
        //filter
        const value = req.query.value || "";
        const type = req.query.type || "";

        if (value && type) {
            if (type === 'N') {
                query.N = { $regex: value, $options: 'i' };// Case-insensitive search
            } else if (type === 'C') {
                query.C = { $regex: value, $options: 'i' };// Case-insensitive search
            } else if (type === 'S') {
                query.S = { $regex: value, $options: 'i' };// Case-insensitive search
            }
        }

        const pipeline = [
            { $match: query },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { _v: 0 } }
                    ]
                }
            }
        ];

        return httpResponse.fnSuccess(res, await aes.fnEncryptAES(await mongoOps.fnAggregate(selectedDocsSchema, pipeline)));

    } catch (error) {
        logger.warn('fnListDocsDetail', error);
        return httpResponse.fnBadRequest(res);
    }
}

const fnUploadDocs = async (req, res) => {
    _uploadMiddleware(req, res, async () => {
        try {
            const BID = parseInt(req.currentUserData.BID) || 0;
            const LOC = req.query.LOC || null;
            const _id = req.query._id || null;
            const _userId = req.currentUserData._userId || '';
            if (!ObjectId.isValid(_id) || !LOC || !BID || req.files.length != 1) return httpResponse.fnPreConditionFailed(res);
            const sessionName = LOC.split("/").slice(-1)[0] || null;

            const query = { BID, _id: new ObjectId(_id) };
            let body = { S: "In progress" };
            // const body = { $push: { FD: { $each: req.files }, $set: { S: 2 } } }

            let selectedDocsSchema;
            if (sessionName == 'TD') { selectedDocsSchema = transactionSchema; }
            else if (sessionName == 'CD') { selectedDocsSchema = complianceSchema; }
            else if (sessionName == 'C') { selectedDocsSchema = covenantsSchema; }
            else if (sessionName == 'CS') { selectedDocsSchema = subsequentSchema; }
            else if (sessionName == 'CP') { selectedDocsSchema = precedentSchema; }
            else if (sessionName == 'PD') {
                const index = req.query.POS || 0;
                if (!index) return httpResponse.fnPreConditionFailed(res);
                body = {}
                body[`GS.${index}.S`] = 'In progress'
                body[`GS.${index}.FD`] = req.files
                await mongoOps.fnFindOneAndUpdate(paymentSchema, query, body);
                return httpResponse.fnSuccess(res);
            }
            body.FD = req.files;
            const output = await mongoOps.fnFindOneAndUpdate(selectedDocsSchema, query, body);
            logger.debug('Uploading file ......', LOC, _id, req.files)
            //Notify Checker
            const data = await mongoOps.fnFindById(loanSchema, output._loanId);
            await _fnNotify(BID, _userId, output._id, data._teamId, sessionName, 'C');
            return httpResponse.fnSuccess(res);
        } catch (error) {
            logger.warn('fnUploadDocs ', error);
            if (error.code === 11000) return httpResponse.fnUnprocessableContent(res);//MongoDB DuplicateKey error
            else return httpResponse.fnBadRequest(res);
        }
    });
    return null;
    // return httpResponse.fnSuccess(res);

};

const fnViewDocs = async (req, res) => {
    try {
        const filepath = path.join(__dirname, '..', `public/docs/${req.currentUserData.BID}/${req.query.LOC}`);
        logger.debug('Reading file ....', fs.existsSync(filepath), filepath)
        if (fs.existsSync(filepath)) return res.sendFile(filepath);
        else return httpResponse.fnConflict(res);
    } catch (error) {
        logger.warn('fnViewDocs', error);
        return httpResponse.fnBadRequest(res);
    }

}

const fnDownloadDocs = async (req, res) => {
    try {
        const filepath = path.join(__dirname, '..', `public/docs/${req.currentUserData.BID}/${req.query.LOC}`);
        logger.debug('Downloading file  ....', fs.existsSync(filepath), filepath);
        if (fs.existsSync(filepath)) {
            return res.download(filepath, (err) => {
                if (err) {
                    logger.warn('Error during file download', err);
                    return httpResponse.fnBadRequest(res);
                }
            });
        } else {
            return httpResponse.fnConflict(res);
        }
    } catch (error) {
        logger.warn('fnDownloadDocs', error);
        return httpResponse.fnBadRequest(res);
    }
};

const fnListDocs = async (req, res) => {
    try {
        if (!req.query.LOC) return httpResponse.fnConflict(res);
        const filepath = path.join(__dirname, '..', `public/docs/${req.currentUserData.BID}/${req.query.LOC}`);
        logger.debug('List All file ....', filepath)
        // Read all files in the directory
        fs.readdir(filepath, async (err, files) => {
            if (err) return httpResponse.fnConflict(res);
            const data = await aes.fnEncryptAES({ files });
            return httpResponse.fnSuccess(res, data);
        });
        return null;
    } catch (error) {
        logger.warn('fnListDocs', error);
        return httpResponse.fnBadRequest(res);
    }
}

const fnDeleteDocs = async (req, res) => {
    try {
        const BID = req.currentUserData.BID || 0;
        const filepath = path.join(__dirname, '..', `public/docs/${req.currentUserData.BID}/${req.query.LOC}`);
        const filename = req.query.LOC.split("/").slice(-1)[0];//LOC
        const _id = req.query._id || null;

        if (!ObjectId.isValid(_id) || !filename || !BID) return httpResponse.fnConflict(res);

        if (fs.existsSync(filepath)) {
            const stat = fs.statSync(filepath);
            if (stat.isFile()) {
                const sessionName = req.query.LOC.split("/")[1] || null;
                let selectedDocsSchema;
                if (sessionName == 'TD') { selectedDocsSchema = transactionSchema; }
                else if (sessionName == 'CD') { selectedDocsSchema = complianceSchema; }
                else if (sessionName == 'C') { selectedDocsSchema = covenantsSchema; }
                else if (sessionName == 'CS') { selectedDocsSchema = subsequentSchema; }
                else if (sessionName == 'CP') { selectedDocsSchema = precedentSchema; }
                else if (sessionName == 'PD') {
                    const index = req.query.POS || 0;
                    if (!index) return httpResponse.fnPreConditionFailed(res);
                    // Create the update object dynamically
                    const updateBody = {
                        $set: {},
                        $unset: {}
                    };
                    const query = { BID, _id: new ObjectId(_id) };
                    updateBody.$set[`GS.${index}.S`] = 'Pending';  // Set status S to "Pending"
                    updateBody.$unset[`GS.${index}.FD`] = 1;      // Unset FD
                    // Perform the update using fnFindOneAndUpdate
                    await mongoOps.fnFindOneAndUpdate(paymentSchema, query, updateBody);
                    await fs.unlink(filepath, (err) => {
                        if (err) {
                            logger.warn(`Error deleting ${filepath}:`, err);
                        } else {
                            logger.debug(`Payment Successfully Deleted...... ${filepath}`, _id);
                        }
                    });
                    return httpResponse.fnSuccess(res);
                }

                const query = { BID, _id: new ObjectId(_id), 'FD.filename': filename };
                const body = { $set: { S: "Pending" }, $unset: { FD: 1 } }

                await mongoOps.fnFindOneAndUpdate(selectedDocsSchema, query, body);
                // fs.unlinkSync(filepath); // Delete only the file
                await fs.unlink(filepath, (err) => {
                    if (err) {
                        logger.warn(`Error deleting ${filepath}:`, err);
                    } else {
                        logger.debug(`File Successfully deleted...... ${filepath}`, _id);
                    }
                });
                return httpResponse.fnSuccess(res);
            } else {
                return httpResponse.fnConflict(res); // Specified path is a directory, not a file
            }
        } else {
            return httpResponse.fnPreConditionFailed(res); // File not found
        }
    } catch (error) {
        logger.warn('fnDeleteDocs error:', error);
        return res.status(400).send('Bad Request');
    }
};

//Update Payment Details
const fnUpdatePaymentDetails = async (req, res) => {
    try {
        const BID = parseInt(req.currentUserData.BID) || 0;
        const _userId = req.currentUserData._userId || '';
        const _loanId = req.body._loanId || null
        const _id = req.body._id || null
        if (!BID) return httpResponse.fnPreConditionFailed(res);
        if (_id && ObjectId.isValid(_id)) { // Edit Documents Details 
            req.body.BID = parseInt(req.currentUserData.BID) || 0;//UUID
            let data = await mongoOps.fnFindOneAndUpdate(paymentSchema, { BID, _id: new ObjectId(_id) }, { GS: req.body.GS })
            logger.debug('Update Payment  Details GS', data);
            //Notify Checker
            if (req.body.GS && req.body.POS >= 0 && req.body.GS[req.body.POS].S == 'Verified') {
                const loan = await mongoOps.fnFindById(loanSchema, data._loanId);
                await _fnNotify(BID, _userId, _id, loan._teamId, 'PD', 'L');
            }
            return httpResponse.fnSuccess(res);
        }
        else if (!_id && _loanId && ObjectId.isValid(_loanId)) {// Add Documents Details 
            req.body.BID = parseInt(req.currentUserData.BID) || 0;//UUID
            let data = await mongoOps.fnInsertOne(paymentSchema, { BID, _loanId: new ObjectId(_loanId), ...req.body })
            logger.debug('Added Payment  Details...', data)
            const loan = await mongoOps.fnFindById(loanSchema, _loanId);
            await _fnNotify(BID, _userId, data._id, loan._teamId, 'PD', 'M');
            return httpResponse.fnSuccess(res);
        }

    } catch (error) {
        logger.warn('fnUpdatePaymentDetails', error)
        if (error.code === 11000) return httpResponse.fnUnprocessableContent(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
    return null;
};

const fnListPaymentDetails = async (req, res) => {
    try {
        const BID = parseInt(req.currentUserData.BID) || 0;
        const _loanId = req.query._loanId || null
        if (!ObjectId.isValid(_loanId) || !BID) return httpResponse.fnPreConditionFailed(res);
        req.body.BID = parseInt(req.currentUserData.BID) || 0;//UUID
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const pipeline = [
            { $match: { BID, _loanId: new ObjectId(_loanId) } },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { _v: 0 } }
                    ]
                }
            }
        ];

        return httpResponse.fnSuccess(res, await aes.fnEncryptAES(await mongoOps.fnAggregate(paymentSchema, pipeline)));

    } catch (error) {
        logger.warn('fnListPaymentDetails', error)
        return httpResponse.fnBadRequest(res);
    }
};

const fnAssignListDocsDetail = async (req, res) => {
    try {
        const email = req.currentUserData.E;
        const BID = req.currentUserData.BID;
        const sessionName = req.query.SN;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        let selectedDocsSchemaName;
        const specificConditions = [];

        switch (sessionName) {
            case 'TD':
                selectedDocsSchemaName = "transaction_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$TD.M", []] }] },
                    { $in: [email, { $ifNull: ["$TD.C", []] }] }
                );
                break;
            case 'CD':
                selectedDocsSchemaName = "compliance_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$CD.M", []] }] },
                    { $in: [email, { $ifNull: ["$CD.C", []] }] }
                );
                break;
            case 'C':
                selectedDocsSchemaName = "covenants_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$C.M", []] }] },
                    { $in: [email, { $ifNull: ["$C.C", []] }] }
                );
                break;
            case 'CP':
                selectedDocsSchemaName = "precedent_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$CP.M", []] }] },
                    { $in: [email, { $ifNull: ["$CP.C", []] }] }
                );
                break;
            case 'CS':
                selectedDocsSchemaName = "subsequent_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$CS.M", []] }] },
                    { $in: [email, { $ifNull: ["$CS.C", []] }] }
                );
                break;
            case 'PD':
                selectedDocsSchemaName = "payment_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$PD.M", []] }] },
                    { $in: [email, { $ifNull: ["$PD.C", []] }] }
                );
                break;
            default:
                return httpResponse.fnConflict(res);
        }


        const query = [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $or: [{ $eq: ["$L", email] }, ...specificConditions] },
                            { $eq: ["$BID", BID] }
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "loan_models",
                    localField: "_id",
                    foreignField: "_teamId",
                    as: "loanDetails"
                }
            },
            {
                $unwind: "$loanDetails", // Unwind the loanDetails array
            },
            {
                $lookup: {
                    from: selectedDocsSchemaName,
                    localField: "loanDetails._id",
                    foreignField: "_loanId",
                    as: "docsDetails"
                }
            },
            {
                $unwind: "$docsDetails"
            },
            {
                $project: {
                    _id: 1,
                    L: 1,
                    N: 1,
                    _loanId: "$loanDetails._id",
                    AID: "$loanDetails.AID",
                    CN: "$loanDetails.CN",
                    SD: "$loanDetails.SD",
                    S: "$docsDetails.S"
                }
            },
            {
                $group:

                {
                    _id: "$_loanId",
                    AID: {
                        $first: "$AID"
                    },
                    CN: {
                        $first: "$CN"
                    },
                    SD: {
                        $first: "$SD"
                    },
                    details: {
                        $push: {
                            S: "$S"
                        }
                    }
                }
            },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { _v: 0 } }
                    ]
                }
            }
        ];
        logger.debug('QuErY', helper.fnStringlyJSON(query));
        let output = await mongoOps.fnAggregate(teamSchema, query);
        const data = await aes.fnEncryptAES(output);
        return httpResponse.fnSuccess(res, data);
        // return output;
    } catch (error) {
        logger.warn('fnAssignListDocsDetail', error);
        return httpResponse.fnBadRequest(res);
    }
}

const fnAssignListDefault = async (req, res) => {
    try {
        const email = req.currentUserData.E;
        const BID = req.currentUserData.BID;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sessionName = req.query.SN || null;
        let selectedDocsSchemaName;
        const specificConditions = [];
        // Selection of Schema 
        switch (sessionName) {
            case 'TD':
                selectedDocsSchemaName = "transaction_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$TD.M", []] }] },
                    { $in: [email, { $ifNull: ["$TD.C", []] }] }
                );
                break;
            case 'CD':
                selectedDocsSchemaName = "compliance_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$CD.M", []] }] },
                    { $in: [email, { $ifNull: ["$CD.C", []] }] }
                );
                break;
            case 'C':
                selectedDocsSchemaName = "covenants_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$C.M", []] }] },
                    { $in: [email, { $ifNull: ["$C.C", []] }] }
                );
                break;
            case 'CP':
                selectedDocsSchemaName = "precedent_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$CP.M", []] }] },
                    { $in: [email, { $ifNull: ["$CP.C", []] }] }
                );
                break;
            case 'CS':
                selectedDocsSchemaName = "subsequent_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$CS.M", []] }] },
                    { $in: [email, { $ifNull: ["$CS.C", []] }] }
                );
                break;
            case 'PD':
                selectedDocsSchemaName = "payment_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$PD.M", []] }] },
                    { $in: [email, { $ifNull: ["$PD.C", []] }] }
                );
                break;
            default:
                return httpResponse.fnConflict(res);
        }
        const query = [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $or: [{ $eq: ["$L", email] }, ...specificConditions] },
                            { $eq: ["$BID", BID] }
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "loan_models",
                    localField: "_id",
                    foreignField: "_teamId",
                    as: "loanDetails"
                }
            },
            {
                $unwind: "$loanDetails"
            },
            {
                $lookup: {
                    from: selectedDocsSchemaName,
                    localField: "loanDetails._id",
                    foreignField: "_loanId",
                    as: "docsDetails",
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$DEF", 1]
                                }
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$docsDetails"
            },
            {
                $project: {
                    _id: 1,
                    L: 1,
                    N: 1,
                    _loanId: "$loanDetails._id",
                    AID: "$loanDetails.AID",
                    SD: "$loanDetails.SD",
                    DN: "$docsDetails.N",
                    DC: "$docsDetails.C",
                    SD: "$docsDetails.SD",
                    ED: "$docsDetails.ED",
                    DS: "$docsDetails.S",
                    FD: "$docsDetails.FD",
                    _fileId: "$docsDetails._id",
                }
            },

            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { _v: 0 } }
                    ]
                }
            }
        ];
        logger.debug('DefaulteR QuErY', helper.fnStringlyJSON(query));
        let output = await mongoOps.fnAggregate(teamSchema, query);

        const data = await aes.fnEncryptAES(output);
        return httpResponse.fnSuccess(res, data);
        // return output;
    } catch (error) {
        logger.warn('fnAssignListDefault', error);
        return httpResponse.fnBadRequest(res);
    }
}

const fnAssignListCriticalCase = async (req, res) => {
    try {
        const email = req.currentUserData.E;
        const BID = req.currentUserData.BID;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sessionName = req.query.SN || null;
        let selectedDocsSchemaName;
        const specificConditions = [];
        // Selection of Schema 
        switch (sessionName) {
            case 'TD':
                selectedDocsSchemaName = "transaction_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$TD.M", []] }] },
                    { $in: [email, { $ifNull: ["$TD.C", []] }] }
                );
                break;
            case 'CD':
                selectedDocsSchemaName = "compliance_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$CD.M", []] }] },
                    { $in: [email, { $ifNull: ["$CD.C", []] }] }
                );
                break;
            case 'C':
                selectedDocsSchemaName = "covenants_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$C.M", []] }] },
                    { $in: [email, { $ifNull: ["$C.C", []] }] }
                );
                break;
            case 'CP':
                selectedDocsSchemaName = "precedent_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$CP.M", []] }] },
                    { $in: [email, { $ifNull: ["$CP.C", []] }] }
                );
                break;
            case 'CS':
                selectedDocsSchemaName = "subsequent_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$CS.M", []] }] },
                    { $in: [email, { $ifNull: ["$CS.C", []] }] }
                );
                break;
            case 'PD':
                selectedDocsSchemaName = "payment_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$PD.M", []] }] },
                    { $in: [email, { $ifNull: ["$PD.C", []] }] }
                );
                break;
            default:
                return httpResponse.fnConflict(res);
        }
        const query = [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $or: [{ $eq: ["$L", email] }, ...specificConditions] },
                            { $eq: ["$BID", BID] }
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "loan_models",
                    localField: "_id",
                    foreignField: "_teamId",
                    as: "loanDetails"
                }
            },
            {
                $unwind: "$loanDetails"
            },
            {
                $lookup: {
                    from: selectedDocsSchemaName,
                    localField: "loanDetails._id",
                    foreignField: "_loanId",
                    as: "docsDetails",
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$P", "High"]
                                }
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$docsDetails"
            },
            {
                $project: {
                    _id: 1,
                    L: 1,
                    N: 1,
                    _loanId: "$loanDetails._id",
                    AID: "$loanDetails.AID",
                    SD: "$loanDetails.SD",
                    DN: "$docsDetails.N",
                    DC: "$docsDetails.C",
                    SD: "$docsDetails.SD",
                    ED: "$docsDetails.ED",
                    DS: "$docsDetails.S",
                    DP: "$docsDetails.P",
                    FD: "$docsDetails.FD",
                    _fileId: "$docsDetails._id",

                }
            },

            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { _v: 0 } }
                    ]
                }
            }
        ];
        logger.debug('Critial CaSe QuErY', helper.fnStringlyJSON(query));
        let output = await mongoOps.fnAggregate(teamSchema, query);

        const data = await aes.fnEncryptAES(output);
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnAssignListCriticalCase', error);
        return httpResponse.fnBadRequest(res);
    }
}

const fnMSTListDocsDetail = async (req, res) => {
    try {
        const BID = req.currentUserData.BID;
        const sessionName = req.query.SN;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        let selectedDocsSchemaName;
        switch (sessionName) {
            case 'TD': selectedDocsSchemaName = "transaction_models"; break;
            case 'CD': selectedDocsSchemaName = "compliance_models"; break;
            case 'C': selectedDocsSchemaName = "covenants_models"; break;
            case 'CP': selectedDocsSchemaName = "precedent_models"; break;
            case 'CS': selectedDocsSchemaName = "subsequent_models"; break;
            case 'PD': selectedDocsSchemaName = "payment_models"; break;
            default: return httpResponse.fnConflict(res);
        }


        const query = [
            {
                $match: {
                    BID
                }
            },
            {
                $lookup: {
                    from: "loan_models",
                    localField: "_id",
                    foreignField: "_teamId",
                    as: "loanDetails"
                }
            },
            {
                $unwind: "$loanDetails", // Unwind the loanDetails array
            },
            {
                $lookup: {
                    from: selectedDocsSchemaName,
                    localField: "loanDetails._id",
                    foreignField: "_loanId",
                    as: "docsDetails"
                }
            },
            {
                $unwind: "$docsDetails"
            },
            {
                $project: {
                    _id: 1,
                    L: 1,
                    N: 1,
                    _loanId: "$loanDetails._id",
                    AID: "$loanDetails.AID",
                    CN: "$loanDetails.CN",
                    SD: "$loanDetails.SD",
                    S: "$docsDetails.S"
                }
            },
            {
                $group:

                {
                    _id: "$_loanId",
                    AID: {
                        $first: "$AID"
                    },
                    CN: {
                        $first: "$CN"
                    },
                    SD: {
                        $first: "$SD"
                    },
                    details: {
                        $push: {
                            S: "$S"
                        }
                    }
                }
            },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { _v: 0 } }
                    ]
                }
            }
        ];
        logger.debug('{MST} QuErY', helper.fnStringlyJSON(query));
        let output = await mongoOps.fnAggregate(teamSchema, query);
        const data = await aes.fnEncryptAES(output);
        return httpResponse.fnSuccess(res, data);
        // return output;
    } catch (error) {
        logger.warn('fnMSTListDocsDetail', error);
        return httpResponse.fnBadRequest(res);
    }
}

const fnMSTListDefault = async (req, res) => {
    try {
        // const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'mst_defaultor', 'access');
        // if (!userPremission) return httpResponse.fnForbidden(res);
        const BID = req.currentUserData.BID;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sessionName = req.query.SN || null;
        let selectedDocsSchemaName;
        // Selection of Schema 
        switch (sessionName) {
            case 'TD': selectedDocsSchemaName = "transaction_models"; break;
            case 'CD': selectedDocsSchemaName = "compliance_models"; break;
            case 'C': selectedDocsSchemaName = "covenants_models"; break;
            case 'CP': selectedDocsSchemaName = "precedent_models"; break;
            case 'CS': selectedDocsSchemaName = "subsequent_models"; break;
            case 'PD': selectedDocsSchemaName = "payment_models"; break;
            default: return httpResponse.fnConflict(res);
        }
        const query = [
            {
                $match: { BID }
            },
            {
                $lookup: {
                    from: "loan_models",
                    localField: "_id",
                    foreignField: "_teamId",
                    as: "loanDetails"
                }
            },
            {
                $unwind: "$loanDetails"
            },
            {
                $lookup: {
                    from: selectedDocsSchemaName,
                    localField: "loanDetails._id",
                    foreignField: "_loanId",
                    as: "docsDetails",
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$DEF", 1]
                                }
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$docsDetails"
            },
            {
                $project: {
                    _id: 1,
                    L: 1,
                    N: 1,
                    _loanId: "$loanDetails._id",
                    AID: "$loanDetails.AID",
                    SD: "$loanDetails.SD",
                    DN: "$docsDetails.N",
                    DC: "$docsDetails.C",
                    SD: "$docsDetails.SD",
                    ED: "$docsDetails.ED",
                    DS: "$docsDetails.S",
                    FD: "$docsDetails.FD",
                    _fileId: "$docsDetails._id",
                }
            },

            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { _v: 0 } }
                    ]
                }
            }
        ];
        logger.debug('{MST} DefaulteR QuErY', helper.fnStringlyJSON(query));
        let output = await mongoOps.fnAggregate(teamSchema, query);

        const data = await aes.fnEncryptAES(output);
        return httpResponse.fnSuccess(res, data);
        // return output;
    } catch (error) {
        logger.warn('fnMSTListDefault', error);
        return httpResponse.fnBadRequest(res);
    }
}

const fnMSTListCriticalCase = async (req, res) => {
    try {
        // const userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'mst_critical', 'access');
        // if (!userPremission) return httpResponse.fnForbidden(res);
        const BID = req.currentUserData.BID;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sessionName = req.query.SN || null;
        let selectedDocsSchemaName;
        // Selection of Schema 
        switch (sessionName) {
            case 'TD': selectedDocsSchemaName = "transaction_models"; break;
            case 'CD': selectedDocsSchemaName = "compliance_models"; break;
            case 'C': selectedDocsSchemaName = "covenants_models"; break;
            case 'CP': selectedDocsSchemaName = "precedent_models"; break;
            case 'CS': selectedDocsSchemaName = "subsequent_models"; break;
            case 'PD': selectedDocsSchemaName = "payment_models"; break;
            default: return httpResponse.fnConflict(res);
        }
        const query = [
            {
                $match: { BID }
            },
            {
                $lookup: {
                    from: "loan_models",
                    localField: "_id",
                    foreignField: "_teamId",
                    as: "loanDetails"
                }
            },
            {
                $unwind: "$loanDetails"
            },
            {
                $lookup: {
                    from: selectedDocsSchemaName,
                    localField: "loanDetails._id",
                    foreignField: "_loanId",
                    as: "docsDetails",
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$P", "High"]
                                }
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$docsDetails"
            },
            {
                $project: {
                    _id: 1,
                    L: 1,
                    N: 1,
                    _loanId: "$loanDetails._id",
                    AID: "$loanDetails.AID",
                    SD: "$loanDetails.SD",
                    DN: "$docsDetails.N",
                    DC: "$docsDetails.C",
                    SD: "$docsDetails.SD",
                    ED: "$docsDetails.ED",
                    DS: "$docsDetails.S",
                    DP: "$docsDetails.P",
                    FD: "$docsDetails.FD",
                    _fileId: "$docsDetails._id",

                }
            },

            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { _v: 0 } }
                    ]
                }
            }
        ];
        logger.debug('{MST} Critial CaSe QuErY', helper.fnStringlyJSON(query));
        let output = await mongoOps.fnAggregate(teamSchema, query);

        const data = await aes.fnEncryptAES(output);
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnMSTListCriticalCase', error);
        return httpResponse.fnBadRequest(res);
    }
}

const fnMSTAssignListDocsDetail = async (req, res) => {
    try {
        const BID = req.currentUserData.BID;
        const email = req.query.E;
        const sessionName = req.query.SN;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        let selectedDocsSchemaName;
        const specificConditions = [];

        switch (sessionName) {
            case 'TD':
                selectedDocsSchemaName = "transaction_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$TD.M", []] }] },
                    { $in: [email, { $ifNull: ["$TD.C", []] }] }
                );
                break;
            case 'CD':
                selectedDocsSchemaName = "compliance_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$CD.M", []] }] },
                    { $in: [email, { $ifNull: ["$CD.C", []] }] }
                );
                break;
            case 'C':
                selectedDocsSchemaName = "covenants_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$C.M", []] }] },
                    { $in: [email, { $ifNull: ["$C.C", []] }] }
                );
                break;
            case 'CP':
                selectedDocsSchemaName = "precedent_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$CP.M", []] }] },
                    { $in: [email, { $ifNull: ["$CP.C", []] }] }
                );
                break;
            case 'CS':
                selectedDocsSchemaName = "subsequent_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$CS.M", []] }] },
                    { $in: [email, { $ifNull: ["$CS.C", []] }] }
                );
                break;
            case 'PD':
                selectedDocsSchemaName = "payment_models";
                specificConditions.push(
                    { $in: [email, { $ifNull: ["$PD.M", []] }] },
                    { $in: [email, { $ifNull: ["$PD.C", []] }] }
                );
                break;
            default:
                return httpResponse.fnConflict(res);
        }


        const query = [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $or: [{ $eq: ["$L", email] }, ...specificConditions] },
                            { $eq: ["$BID", BID] }
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "loan_models",
                    localField: "_id",
                    foreignField: "_teamId",
                    as: "loanDetails"
                }
            },
            {
                $unwind: "$loanDetails", // Unwind the loanDetails array
            },
            {
                $lookup: {
                    from: selectedDocsSchemaName,
                    localField: "loanDetails._id",
                    foreignField: "_loanId",
                    as: "docsDetails"
                }
            },
            {
                $unwind: "$docsDetails"
            },
            {
                $project: {
                    _id: 1,
                    L: 1,
                    N: 1,
                    _loanId: "$loanDetails._id",
                    AID: "$loanDetails.AID",
                    CN: "$loanDetails.CN",
                    SD: "$loanDetails.SD",
                    S: "$docsDetails.S"
                }
            },
            {
                $group:

                {
                    _id: "$_loanId",
                    AID: {
                        $first: "$AID"
                    },
                    CN: {
                        $first: "$CN"
                    },
                    SD: {
                        $first: "$SD"
                    },
                    details: {
                        $push: {
                            S: "$S"
                        }
                    }
                }
            },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { _v: 0 } }
                    ]
                }
            }
        ];
        logger.debug('{MST}Query', helper.fnStringlyJSON(query));
        let output = await mongoOps.fnAggregate(teamSchema, query);
        const data = await aes.fnEncryptAES(output);
        return httpResponse.fnSuccess(res, data);
        // return output;
    } catch (error) {
        logger.warn('fnMSTAssignListDocsDetail', error);
        return httpResponse.fnBadRequest(res);
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
    fnDeleteLoan,
    fnDeleteContact,
    fnListUser,
    fnUpdateLoan,
    fnUpdateContact,
    fnListContact,
    fnGetLoan,
    fnCreateAID,
    fnListLoan,
    fnSuggestion,
    fnGetTeam,
    fnUpdateTeam,
    fnSelectTeam,
    fnGetUserTeams,
    fnListTeam,
    fnAddRole,
    fnListRole,
    fnAddRating,
    fnListRating,
    fnUploadDocs,
    fnListDocs,
    fnListDocsDetail,
    fnAssignListDefault,
    fnAssignListCriticalCase,
    fnMSTAssignListDocsDetail,
    fnMSTListDocsDetail,
    fnViewDocs,
    fnDownloadDocs,
    fnDeleteDocs,
    fnAddDocsDetails,
    fnUpdatePaymentDetails,
    fnEditDocsDetails,
    fnUpdateMST,
    fnListMST,
    fnAssignListDocsDetail,
    fnListPaymentDetails,
    fnMSTListDocsDetail,
    fnMSTListDefault,
    fnMSTListCriticalCase,
    fnRemoveTeams,
    fnDashboard
}

const _sendEmail = async (options) => {
    try {
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
    } catch (error) {
        logger.warn('Error sending email:', error);
        return null;
    }
}

const _fnVaildatingPermission = async (_id, moduleName = null, sPremission = 'access', flag = 0) => {
    try {
        const userPermissionDoc = await mongoOps.fnFindById(userSchema, _id, { UP: 1, _id: 0 });
        const userPermission = userPermissionDoc ? userPermissionDoc.UP : null;
        // logger.debug(userPermission)
        if (!userPermission) return false;

        // logger.debug(moduleName, sPremission, userPermission[moduleName])
        if (!flag) return userPermission[moduleName] && userPermission[moduleName].includes(sPremission);
        else return userPermission[moduleName] && userPermission[moduleName].docs && userPermission[moduleName].docs.includes(sPremission);

        // return null;
    } catch (error) {
        logger.warn('_fnVaildatingPermission', error);
        return false;
    }
};

const _fnSelectSchema = async (sessionName, operation) => {
    try {
        let selectedDocsSchema, userPremission;
        switch (sessionName) {
            case 'TD': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'transaction', operation, 1); selectedDocsSchema = transactionSchema; break;
            case 'CD': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'compliance', operation, 1); selectedDocsSchema = complianceSchema; break;
            case 'C': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'covenants', operation, 1); selectedDocsSchema = covenantsSchema; break;
            case 'CS': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'subsequent', operation, 1); selectedDocsSchema = subsequentSchema; break;
            case 'CP': userPremission = await _fnVaildatingPermission(req.currentUserData._userId, 'precedent', operation, 1); selectedDocsSchema = precedentSchema; break;
            default: return httpResponse.fnPreConditionFailed(res);
        }
        return { selectedDocsSchema, userPremission };
    } catch (error) {
        logger.warn('_fnSelectSchema', error);
        return null;
    }
}

const _fnGetPermission = async (_id, moduleName = null) => {
    try {
        const aPr = await mongoOps.fnFindOne(userSchema, { _id: new ObjectId(_id) }, { _id: 0, UP: 1 });
        if (moduleName == "UM") return aPr.P.UM;
        else return aPr.P;
    } catch (error) {
        return logger.warn('_fnGetPermission', error);
    }
}

const _fnGetModulePermission = async (_userId = null, moduleName = null, action = null) => {

    const aPremission = await mongoOps.fnFindOne(userSchema, { _id: new ObjectId(_userId) }, { _id: 0, UP: 1 })
    // req.currentUserData.UP = aPremission.UP;
    const text = `UP.${moduleName}`;

    logger.debug(text, aPremission, '_fnGetModulePermission', aPremission.UP.UM, 'ttt', aPremission[text])
    // aPremission.text.includes(action)

    // }
    // return true;
    // return false;
}

const _fnSendEmails = async (recipients = [], emailContent = { subject: 'Blank', message: 'Empty Body' }) => {
    const failedEmails = []; // Array to store emails that failed to send

    await Promise.all(
        recipients.map(async (email) => {
            try {
                await fnSendEmail({
                    to: email,
                    ...emailContent
                });
                logger.debug(`Email sent to ${email}`);
            } catch (error) {
                logger.warn(`Failed to send email to ${email}:`, error);
                failedEmails.push(email); // Add the failed email to the array
            }
        })
    );

    if (failedEmails.length > 0) {
        logger.debug('Failed to send emails to the following addresses:');
        logger.debug(failedEmails);
    } else {
        logger.debug('All emails were sent successfully.');
    }
    return null;
};

const _fnNotify = async (BID = 0, _actionUserId = '', documentId = null, _teamId = null, sessionName = null, teamRole = null) => {
    try {
        if (!documentId || !_teamId || !BID || !_actionUserId) return null;
        logger.debug('_fnNotify', documentId, _teamId);
        const data = await mongoOps.fnFindById(teamSchema, _teamId);
        let documentDetails;
        //  = await mongoOps.fnFindById(teamSchema, documentId);

        const teamName = data.N || 'tempTeam';
        const teamLead = data.L || 'tempLead';
        const leadEmailContent = {
            subject: 'Document Successfully Verified',
            message: `
            <h1>Document Successfully Verified</h1>
            <p>Dear ${teamLead} ,</p>
            <p>We are pleased to inform you that the document with name<strong>${documentId}</strong> has been successfully verified.</p>
            <p>Our verification  ${teamName} team has thoroughly reviewed the document, and the process is now complete.</p>
            <p>If you have any questions or need further information, please feel free to reach out.</p>
            <p>Thank you for your cooperation.</p>
            <p>Best regards,</p>
            <p>The Verification Team</p>`,
        };
        const makerEmailContent = {
            subject: 'File Created: Upload Pending',
            message: `
                <h1>File Created: Upload Pending</h1>
                <p>Dear Maker,</p>
                <p>We would like to inform you that the file successfully created.</p>
                <p>However, please note that the upload process for the document with the ID <strong>${documentId}</strong> is still pending. Our ${teamName} team is working to complete the upload as soon as possible.</p>
                <p>You will be notified once the upload is complete and the file is available for access.</p>
                <p>If you have any questions or need further assistance, please feel free to reach out.</p>
                <p>Thank you for your understanding.</p>
                <p>Best regards,</p>
                <p>The File Management Team</p>`,
        };
        const checkerEmailContent = {
            subject: 'Action Required: Document Verification Needed',
            message: `
                <h1>Action Required: Document Verification Needed</h1>
                <p>Dear Checker,</p>
                <p>This is a reminder that the document with the ID <strong>${documentId}</strong> is pending verification by our ${teamName} team.</p>
                <p>Please review and verify the document </p>
                <p>Your prompt attention to this matter is greatly appreciated.</p>
                <p>If you have any questions or require further assistance, please do not hesitate to contact us.</p>
                <p>Thank you for your cooperation.</p>
                <p>Best regards,</p>
                <p>The Verification Team</p>`,
        };

        if (teamRole == 'L') {
            logger.debug('teamLead teamName, documentId', teamLead, teamName, documentId)
            await _fnSendEmails([data.L], leadEmailContent);
        }
        else if (sessionName == 'TD' && data.TD) {
            documentDetails = await mongoOps.fnFindById(transactionSchema, documentId);
            if (teamRole == 'M') {
                logger.debug('Maker', data.TD.M)
                await _fnSendEmails(data.TD.M, makerEmailContent);
            } else if (teamRole == 'C') {
                logger.debug('Checker', data.TD.C)
                await _fnSendEmails(data.TD.C, checkerEmailContent);
            }
        }
        else if (sessionName == 'CD' && data.CD) {
            documentDetails = await mongoOps.fnFindById(complianceSchema, documentId);
            if (teamRole == 'M') {
                logger.debug('Maker', data.CD.M)
                await _fnSendEmails(data.CD.M, makerEmailContent);
            } else if (teamRole == 'C') {
                logger.debug('Checker', data.CD.C)
                await _fnSendEmails(data.CD.C, checkerEmailContent);
            }
        }
        else if (sessionName == 'C' && data.C) {
            documentDetails = await mongoOps.fnFindById(covenantsSchema, documentId);
            if (teamRole == 'M') {
                logger.debug('Maker', data.C.M)
                await _fnSendEmails(data.C.M, makerEmailContent);
            } else if (teamRole == 'C') {
                logger.debug('Checker', data.C.C)
                await _fnSendEmails(data.C.C, checkerEmailContent);
            }
        }
        else if (sessionName == 'CS' && data.CS) {
            documentDetails = await mongoOps.fnFindById(subsequentSchema, documentId);
            if (teamRole == 'M') {
                logger.debug('Maker', data.CS.M)
                await _fnSendEmails(data.CS.M, makerEmailContent);
            } else if (teamRole == 'C') {
                logger.debug('Checker', data.CS.C)
                await _fnSendEmails(data.CS.C, checkerEmailContent);
            }
        }
        else if (sessionName == 'CP' && data.CP) {
            documentDetails = await mongoOps.fnFindById(precedentSchema, documentId);
            if (teamRole == 'M') {
                logger.debug('Maker', data.CP.M)
                await _fnSendEmails(data.CP.M, makerEmailContent);
            } else if (teamRole == 'C') {
                logger.debug('Checker', data.CP.C)
                await _fnSendEmails(data.CP.C, checkerEmailContent);
            }
        }
        else if (sessionName == 'PD' && data.PD) {
            if (teamRole == 'M') {
                logger.debug('Maker', data.PD.M)
                await _fnSendEmails(data.PD.M, makerEmailContent);
            } else if (teamRole == 'C') {
                logger.debug('Checker', data.PD.C)
                await _fnSendEmails(data.PD.C, checkerEmailContent);
            }
        }
        // const output = await mongoOps.fnInsertOne(allDocsSchema, { BID, _loanId: new ObjectId(_loanId), ...req.body });

    } catch (error) {
        logger.warn(' _fnNotify error', error)

    }
    return null;

}



