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
    R: {
        type: String,
        trim: true
    },
    M: {
        type: Number,
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
        type: String,
        required: true,
        trim: true
    },
    S: {
        type: String,
        required: true,
        trim: true,
        enum: ['Unverified', 'Active', 'Inactive'],
        default: 'Unverified'
    },
    BID: {
        type: Number,
        required: true,
    },
    UP: {
        type: Object,
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
 * E-Email
 * P-Password
 * N-Name
 * R-Role
 * UP-User Permission
 * RM-Reporting manager
 * Z-Zone
 *      1:West
 *      2:South
 *      3:East
 *      4:North
 * 
 * TKN-Token
 * S-Status
 *      1:Unverified
 *      2:Active
 *      3:UnActive
 * 
 * BID-Business ID
 * 
 */