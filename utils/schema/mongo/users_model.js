'use strict'
/**
 * users_model.js:User Detail
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');
const user = new mongoose.Schema({
    E: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    P: {
        type: String,
        required: true,
        trim: true
    },
    N: {
        type: String,
        required: true,
        trim: true
    },
    TKN: {
        type: String,
        trim: true
    },
    RM: {
        type: String,
        required: true,
        trim: true
    },
    Z: {
        type: Number,
        required: true,
        trim: true
    },
    S: {
        type: Number,
        required: true,
        trim: true,
        default: 1
    },
    BID: {
        type: Number,
        required: true,
    },
    _adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admins_model'
    }
}, {
    timestamps: true
}
);



module.exports = mongoose.model('users_model', user);

/**
 * 
 * E-email
 * P-password
 * N- Name
 * R- Role
 * RM-Reporting manager
 * Z-Zone
 *      1:West
 *      2:South
 *      3:East
 *      4:North
 * 
 * TKN-Token
 * S-
 * 1:Unverified
 * 2:Active
 * 3:UnActive
 * 
 * BID-Business ID
 * 
 */