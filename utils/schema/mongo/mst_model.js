'use strict'
/**
 * mst_model.js:Master Setting Detail
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');

const mstSchema = new mongoose.Schema({
    N: { type: String, required: true },
    V: { type: Array, required: true },
    BID: {
        type: Number,
        required: true,
    },
    S: {
        type: String,
        required: true,
        trim: true,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model('mst_model', mstSchema);

/**
 * N-Name
 * V-value
 */