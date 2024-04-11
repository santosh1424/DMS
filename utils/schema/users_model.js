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
    EV: Number,
    BID: {
        type: Number,
        required: true,
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
 * -1:Delete 
 * 0:Active
 * 1:UnActive
 * 
 * BID-Business ID
 * EV-Email Verified
 * 
 */