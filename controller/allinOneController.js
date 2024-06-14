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
    managerSchema
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
const _uploadMiddleware = multer({ storage: fnAllInStorage }).array('file');

const fnTestApp = (req, res) => {
    try {
        const message = _fnGetTeam(email);//'This is MessagE'
        // _fnGetTeam(email);
        logger.info(`fnTestApp ${message}`)
        return res.status(200).json({ message });
    } catch (err) {
        return logger.warn('fnTestApp', err)
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
            _userId: user._id
        }, constants.SECRET_KEY);

        //Update TKN in MongoDB
        const updateUserTKN = await mongoOps.fnFindOneAndUpdate(userSchema, { BID: user.BID, E: user.E, }, { TKN }, { new: true, lean: true, projection: { P: 0, __v: 0 } });
        //Add user in redis
        await redisClient.hmset(redisKeys.fnUserKey(user.BID, user._id), await redisSchema.fnSetUserSchema(updateUserTKN));
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
        const BID = parseInt(req.currentUserData.BID) || 0;//UUID
        const _id = req.body._id || null;
        if (!ObjectId.isValid(_id) || !BID) return httpResponse.fnPreConditionFailed(res);
        const updateUser = {}
        if (req.body.P) updateUser.P = await bcrypt.hash(req.body.P, 10);
        if (req.body.S) updateUser.S = req.body.S;
        if (req.body.N) updateUser.N = req.body.N;
        if (req.body.R) updateUser.R = req.body.R;
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
        //Encryption
        const data = await aes.fnEncryptAES(await mongoOps.fnFind(userSchema, { BID }, { __v: 0, P: 0, UP: 0, _adminId: 0, updatedAt: 0 }))
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnListUser', error);
        return httpResponse.fnBadRequest(res);
    }

}

const fnSendOTP = async (req, res) => {
    try {
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

//Create Loan
const fnCreateLoan = async (req, res) => {
    try {
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
        return httpResponse.fnBadRequest(res);

    }
};

//Listing All Loans in Current Bussiness
const fnListLoan = async (req, res) => {
    try {
        const BID = parseInt(req.currentUserData.BID) || 0;
        const data = await aes.fnEncryptAES(await mongoOps.fnFind(loanSchema, { BID }));
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnListLoan', error)
        return httpResponse.fnBadRequest(res);

    }
};

//Get Loan 
const fnGetLoan = async (req, res) => {
    try {
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

//Create Contacts
const fnCreateContact = async (req, res) => {
    try {
        const _loanId = req.body._loanId || null;
        const _contactId = req.body._contactId || null;
        const type = req.query.type || null;
        const BID = parseInt(req.currentUserData.BID) || 0;
        // req.body=helper.fnParseJSON(req.body)
        if (!ObjectId.isValid(_loanId) || !BID) return httpResponse.fnConflict(res);
        const loan = await mongoOps.fnFindOne(loanSchema, { _id: new ObjectId(_loanId) })
        if (loan) {
            if (type == 'EDIT') {
                delete req.body.CE;
                await mongoOps.fnFindOneAndUpdate(contactsSchema, { BID, _id: new ObjectId(_contactId) }, { ...req.body }, { new: true, lean: true });
            } else {
                await mongoOps.fnInsertOne(contactsSchema, { BID, ...req.body });
            }
            // const data = await aes.fnEncryptAES({ _contactId: contact._id });
            return httpResponse.fnSuccess(res);
        } else return httpResponse.fnConflict(res);
    } catch (error) {
        logger.warn('fnCreateContact', error);
        if (error.code === 11000) return httpResponse.fnUnprocessableContent(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);
    }
};

//Get ALL Contacts
const fnListContact = async (req, res) => {
    try {
        const BID = parseInt(req.currentUserData.BID) || 0;
        const _loanId = req.query._loanId || null;
        if (!ObjectId.isValid(_loanId) || !BID) return httpResponse.fnPreConditionFailed(res);
        const contacts = await mongoOps.fnFind(contactsSchema, { BID, _loanId: new ObjectId(_loanId) }, { __v: 0, })
        //Encryption
        const data = await aes.fnEncryptAES(contacts)
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnListContact', error);
        return httpResponse.fnBadRequest(res);
    }

}

//View Single Contact 
const fnGetContact = async (req, res) => {
    try {
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
        const _id = req.query._id || null;
        const BID = parseInt(req.currentUserData.BID) || 0;
        if (!ObjectId.isValid(_id) || !BID) return httpResponse.fnPreConditionFailed(res);
        const data = await aes.fnEncryptAES(await mongoOps.fnDeleteOne(contactsSchema, { BID, _id: new ObjectId(req.query._id) }));
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnDeleteContact', error);
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
        else if (type == 'TT') data = await mongoOps.fnFind(userSchema, { BID, RM }, { N: 1, E: 1, _id: 0 }) //Team Team Assingment 
        else if (type == 'AU') data = await mongoOps.fnFind(userSchema, { BID }, { N: 1, E: 1, _id: 0 }) //ALL User
        // logger.debug('suggtion', type, data, { BID, Z })
        logger.debug('fnSuggestion', BID, data)
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
const fnAddTeam = async (req, res) => {
    try {
        const BID = parseInt(req.currentUserData.BID) || 0;//UUID
        let data = await mongoOps.fnInsertOne(teamSchema, { BID, ...req.body })
        data = await aes.fnEncryptAES(data);
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnAddTeam', error)
        if (error.code === 11000) return httpResponse.fnUnprocessableContent(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);
    }
};

//Select Team for loan 
const fnSelectTeam = async (req, res) => {
    try {
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

//List Team  + Current team 
const fnListTeam = async (req, res) => {
    try {
        const BID = parseInt(req.currentUserData.BID) || 0;
        const _loanId = req.query._loanId || null;
        if (!BID) return httpResponse.fnPreConditionFailed(res);
        let data = {};
        data.list = await mongoOps.fnFind(teamSchema, { BID })
        if (_loanId && ObjectId.isValid(_loanId)) data.currentTeam = await mongoOps.fnFindOne(loanSchema, { BID, _id: new ObjectId(_loanId) }, { _teamId: 1 })
        data = await aes.fnEncryptAES(data);
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnListTeam', error);
        return httpResponse.fnBadRequest(res);
    }
}

//Adding MST 
const fnAddMST = async (req, res) => {
    try {
        const BID = parseInt(req.currentUserData.BID) || 0;//UUID
        if (!BID) return httpResponse.fnPreConditionFailed(res);
        await mongoOps.fnInsertOne(mstSchema, { BID, ...req.body });
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnAddMST', error)
        if (error.code === 11000) return httpResponse.fnUnprocessableContent(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};

//Adding MST 
const fnEditMST = async (req, res) => {
    try {
        const BID = parseInt(req.currentUserData.BID) || 0;//UUID
        if (!BID) return httpResponse.fnPreConditionFailed(res);
        await mongoOps.fnFindOneAndUpdate(mstSchema, { BID, N: req.body.N }, { V: req.body.V });
        return httpResponse.fnSuccess(res);
    } catch (error) {
        logger.warn('fnEditMST', error)
        if (error.code === 11000) return httpResponse.fnUnprocessableContent(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
};

//List Role 
const fnListMST = async (req, res) => {
    try {
        const BID = parseInt(req.currentUserData.BID) || 0;
        if (!BID) return httpResponse.fnPreConditionFailed(res);
        const data = await aes.fnEncryptAES(await mongoOps.fnFind(mstSchema, { BID }));
        return httpResponse.fnSuccess(res, data);
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
            await mongoOps.fnFindOneAndUpdate(
                roleSchema,
                { BID, _id: new ObjectId(_id) },
                { ...req.body }
            );
        } else await mongoOps.fnInsertOne(roleSchema, { BID, ...req.body });

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
        const BID = parseInt(req.currentUserData.BID) || 0;
        if (!BID) return httpResponse.fnPreConditionFailed(res);
        const data = await aes.fnEncryptAES(await mongoOps.fnFind(roleSchema, { BID }));
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnListRole', error);
        return httpResponse.fnBadRequest(res);
    }
}
//Adding Rating  
const fnAddRating = async (req, res) => {
    try {

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
        const BID = parseInt(req.currentUserData.BID) || 0;
        const _loanId = req.query._loanId || null;
        if (!ObjectId.isValid(_loanId) || !BID) return httpResponse.fnConflict(res);
        const data = await aes.fnEncryptAES(await mongoOps.fnFind(ratingSchema, { BID, _loanId: new ObjectId(_loanId) }));
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnListRating', error);
        return httpResponse.fnBadRequest(res);
    }
}

//Tranaction Documents

//Adding Documents Details  
const fnAddDocsDetails = async (req, res) => {
    try {
        const BID = parseInt(req.currentUserData.BID) || 0;
        const _loanId = req.body._loanId || null
        if (!ObjectId.isValid(_loanId) || !req.body.SN) return httpResponse.fnPreConditionFailed(res);
        // Add Documents Details 
        req.body.BID = parseInt(req.currentUserData.BID) || 0;//UUID
        let selectedDocsSchema;
        if (req.body.SN == 'TD') { selectedDocsSchema = transactionSchema; delete req.body.SN; }
        else if (req.body.SN == 'CD') { selectedDocsSchema = complianceSchema; delete req.body.SN; }
        else if (req.body.SN == 'C') { selectedDocsSchema = covenantsSchema; delete req.body.SN; }
        else if (req.body.SN == 'CS') { selectedDocsSchema = subsequentSchema; delete req.body.SN; }
        else if (req.body.SN == 'CP') { selectedDocsSchema = precedentSchema; delete req.body.SN; }

        logger.debug('Add Docs Details...', selectedDocsSchema, req.body)
        const data = await aes.fnEncryptAES(await mongoOps.fnInsertOne(selectedDocsSchema, { BID, _loanId: new ObjectId(_loanId), ...req.body }));
        return httpResponse.fnSuccess(res, data);
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

        if (!ObjectId.isValid(_id) || !req.body.SN || !BID) return httpResponse.fnPreConditionFailed(res);
        // Add Documents Details 
        let selectedDocsSchema;
        if (req.body.SN == 'TD') { selectedDocsSchema = transactionSchema; delete req.body.SN; }
        else if (req.body.SN == 'CD') { selectedDocsSchema = complianceSchema; delete req.body.SN; }
        else if (req.body.SN == 'C') { selectedDocsSchema = covenantsSchema; delete req.body.SN; }
        else if (req.body.SN == 'CS') { selectedDocsSchema = subsequentSchema; delete req.body.SN; }
        else if (req.body.SN == 'CP') { selectedDocsSchema = precedentSchema; delete req.body.SN; }
        delete req.body._loanId;
        const result = await mongoOps.fnFindOneAndUpdate(selectedDocsSchema, { BID, _id: new ObjectId(_id) }, { ...req.body });
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
        let selectedDocsSchema;
        if (sessionName == 'TD') { selectedDocsSchema = transactionSchema; }
        else if (sessionName == 'CD') { selectedDocsSchema = complianceSchema; }
        else if (sessionName == 'C') { selectedDocsSchema = covenantsSchema; }
        else if (sessionName == 'CS') { selectedDocsSchema = subsequentSchema; }
        else if (sessionName == 'CP') { selectedDocsSchema = precedentSchema; }
        if (!selectedDocsSchema) return httpResponse.fnConflict(res);
        const DocsDetail = await mongoOps.fnFind(selectedDocsSchema, { BID, _loanId: new ObjectId(_loanId) }, { __v: 0 })
        const data = await aes.fnEncryptAES(DocsDetail)
        return httpResponse.fnSuccess(res, data);
    } catch (error) {
        logger.warn('fnListDocsDetail', error);
        return httpResponse.fnBadRequest(res);
    }
}

const fnUploadTD = async (req, res) => {
    _uploadMiddleware(req, res, async () => {
        try {
            const BID = parseInt(req.currentUserData.BID) || 0;
            const LOC = req.query.LOC || null;
            const _id = req.query._id || null;
            if (!ObjectId.isValid(_id) || !LOC || !BID) return httpResponse.fnConflict(res);
            const sessionName = LOC.split("/").slice(-1)[0] || null;
            let selectedDocsSchema;
            if (sessionName == 'TD') { selectedDocsSchema = transactionSchema; }
            else if (sessionName == 'CD') { selectedDocsSchema = complianceSchema; }
            else if (sessionName == 'C') { selectedDocsSchema = covenantsSchema; }
            else if (sessionName == 'CS') { selectedDocsSchema = subsequentSchema; }
            else if (sessionName == 'CP') { selectedDocsSchema = precedentSchema; }
            // const body = { $push: { FD: { $each: req.files }, $set: { S: 2 } } }
            const query = { BID, _id: new ObjectId(_id) };
            const body = { S: 2, FD: req.files }

            await mongoOps.fnFindOneAndUpdate(selectedDocsSchema, query, body);
            logger.debug('Uploading file ......', LOC, _id)

            return httpResponse.fnSuccess(res);
        } catch (error) {
            logger.warn('fnUploadTD ', error);
            if (error.code === 11000) return httpResponse.fnUnprocessableContent(res);//MongoDB DuplicateKey error
            else return httpResponse.fnBadRequest(res);
        }
    });
    return null;
    // return httpResponse.fnSuccess(res);

};

// const fnUpdateTD = async (req, res) => {
//     _uploadMiddleware(req, res, async () => {
//         try {
//             if (req.body.data) req.body = await aes.fnDecryptAES(req.body.data);
//             logger.warn('_uploadMiddleware ', req.body, req.files)
//             const BID = parseInt(req.currentUserData.BID) || 0;
//             if (!req.files || req.files.length === 0) {
//                 if (req.body.data) req.body = await aes.fnDecryptAES(req.body.data);
//                 else return httpResponse.fnPreConditionFailed(res);
//             }
//             const sessionName = req.body.LOC.split("/")[1] || null;
//             const folderName = req.body.LOC.split("/")[2] || null;
//             const _id = req.body._id || null;
//             let selectedDocsSchema = transactionSchema;
//             if (!ObjectId.isValid(_id) || !selectedDocsSchema || !BID || !folderName || !sessionName) return httpResponse.fnConflict(res);
//             const query = { BID, _id: new ObjectId(_id) };
//             delete req.body.N;//Prevent to Update Session Name
//             const body = { ...req.body, $push: { Docs: { $each: req.files } } }
//             if (sessionName == 'TD') selectedDocsSchema = transactionSchema

//             await mongoOps.fnFindOneAndUpdate(selectedDocsSchema, query, body);
//             return httpResponse.fnSuccess(res);
//         } catch (error) {
//             logger.warn('fnUpdateTD ', error);
//             return httpResponse.fnBadRequest(res);
//         }
//     });
//     return null;

// };

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
            // return httpResponse.fnSuccess(res, { files });
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
                if (sessionName == 'TD') selectedDocsSchema = transactionSchema
                else if (sessionName == 'CD') { selectedDocsSchema = complianceSchema; }
                else if (sessionName == 'C') { selectedDocsSchema = covenantsSchema; }
                else if (sessionName == 'CS') { selectedDocsSchema = subsequentSchema; }
                else if (sessionName == 'CP') { selectedDocsSchema = precedentSchema; }

                const query = { BID, _id: new ObjectId(_id), 'FD.filename': filename };
                const body = { $set: { S: 1 }, $unset: { FD: 1 } }

                logger.debug('Deleting Docs ....', filepath, _id)
                await mongoOps.fnFindOneAndUpdate(selectedDocsSchema, query, body);
                fs.unlinkSync(filepath); // Delete only the file
                return httpResponse.fnSuccess(res);
            } else {
                return httpResponse.fnConflict(res); // Specified path is a directory, not a file
            }
        } else {
            return httpResponse.fnPreConditionFailed(res); // File not found
        }
    } catch (error) {
        console.error('fnDeleteDocs error:', error);
        return res.status(400).send('Bad Request');
    }
};

const fnAssignListDocsDetail = async (req, res) => {
    try {
        const email = req.currentUserData.E;
        const sessionName = req.query.SN;
        let selectedDocsSchemaName;
        if (!email || !sessionName) return httpResponse.fnConflict(res);
        logger.debug(email, sessionName)
        if (sessionName == 'TD') selectedDocsSchemaName = "transaction_models";
        else if (sessionName == 'CD') selectedDocsSchemaName = "compliance_models";
        else if (sessionName == 'C') selectedDocsSchemaName = "covenants_models";
        else if (sessionName == 'CP') selectedDocsSchemaName = "precedent_models";
        else if (sessionName == 'CS') selectedDocsSchemaName = "subsequent_models";
        const query = [
            {
                $match: {
                    $expr: {
                        $or: [
                            { $eq: ["$L", email] },
                            { "$in": [email, "$TD.M"] },
                            { "$in": [email, "$TD.C"] },
                            { "$in": [email, "$CD.M"] },
                            { "$in": [email, "$CD.C"] },
                            { "$in": [email, "$C.M"] },
                            { "$in": [email, "$C.C"] },
                            { "$in": [email, "$CP.M"] },
                            { "$in": [email, "$CP.C"] },
                            { "$in": [email, "$CS.M"] },
                            { "$in": [email, "$CS.C"] }
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
                $unwind: "$loanDetails" // Unwind the loanDetails array
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
            }
        ];
        logger.debug(helper.fnStringlyJSON(query));
        let output = await mongoOps.fnAggregate(teamSchema, query);
        const data = await aes.fnEncryptAES(output);
        return httpResponse.fnSuccess(res, data);
        // return output;
    } catch (error) {
        return logger.warn('fnAssignListDocsDetail', error);
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
    fnListLoan,
    fnSuggestion,
    fnGetTeam,
    fnAddTeam,
    fnSelectTeam,
    fnListTeam,
    fnAddRole,
    fnListRole,
    fnAddRating,
    fnListRating,
    fnUploadTD,
    fnListDocs,
    fnListDocsDetail,
    // fnUpdateTD,
    fnViewDocs,
    fnDownloadDocs,
    fnDeleteDocs,
    fnAddDocsDetails,
    fnEditDocsDetails,
    fnAddMST,
    fnListMST,
    fnEditMST,
    fnAssignListDocsDetail
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

const _fnGetPermission = async (_id, moduleName = null) => {
    try {
        const aPr = await mongoOps.fnFindOne(userSchema, { _id: new ObjectId(_id) }, { _id: 0, P: 1 });
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


const _fnDecryptFileData = async (data) => {
    return await aes.fnDecryptAES(data)

}



