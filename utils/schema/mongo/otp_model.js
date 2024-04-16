'use strict'
/**
 * otp_model.js:OTP Detail
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    E: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 5, // The document will be automatically deleted after 5 minutes of its creation time
    }
});

module.exports = mongoose.model('otps', otpSchema);

/**
 * E:email
 */