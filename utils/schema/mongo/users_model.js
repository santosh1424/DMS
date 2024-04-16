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
});



module.exports = mongoose.model('users_model', user);

/**
 * 
 * E-email
 * P-password
 * N- Name
 * R- Role
 * TKN-Token
 * S-
 * 1:Unverified
 * 2:Active
 * 3:UnActive
 * 
 * BID-Business ID
 * 
 */