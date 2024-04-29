'use strict'
/**
 * admins_model.js:Admin Details
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
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
    TU: {
        type: Number,
        required: true,
        default: 1
    },
    MU: {
        type: Number,
        required: true,
        trim: true
    },
    TKN: {
        type: String,
        required: true,
        trim: true
    },
    BID: {
        type: Number,
        unique: true,
        default: generateUniqueBid
    },

});

// Custom function to generate a unique random number for BID
adminSchema.pre('save', async function (next) {
    const maxTry = 3;
    let totalTry = 0;

    while (totalTry < maxTry) {
        const randomNumber = generateUniqueBid()
        const existingAdmin = await this.constructor.findOne({ BID: randomNumber });
        if (!existingAdmin) {
            this.BID = randomNumber;
            return next();
        }
        totalTry++;
    }
    // Throw an error if the maximum number of attempts is reached
    const error = new Error(`Failed to generate a unique random number for BID after ${maxTry} attempts.`);
    return next(error);
});

function generateUniqueBid() {
    return helper.fnRandomNumber(10000, 99999);//number between 10000 -99999
}

module.exports = mongoose.model('admins_model', adminSchema);

/**
 * 
 * E-Email
 * P-Password
 * N- Name of Company
 * TU-Total User
 * MU-Maximum User
 * TKN-Token
 * BID-Business ID
 */