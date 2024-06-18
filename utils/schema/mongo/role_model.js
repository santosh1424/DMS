'use strict'
/**
 * role_model.js:Role Detail
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    N: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    S: {
        type: String,
        required: true,
        trim: true,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    BID: {
        type: Number,
        required: true,
    },
    P: {
        type: Object,
        required: true,
    }
}, {
    timestamps: true
}
);

module.exports = mongoose.model('role_model', roleSchema);

/**
 * N-Name
 * S-Status
 * BID-Bussiness ID
 *  
 */