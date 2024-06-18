'use strict'
/**
 * manager_model.js:manager Detail
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');
const managerUser = new mongoose.Schema({
    E: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    N: {
        type: String,
        required: true,
        trim: true
    },
    RM: {
        type: Object,
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

}, {
    timestamps: true
}
);



module.exports = mongoose.model('manager_model', managerUser);

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