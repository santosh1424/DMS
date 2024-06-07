'use strict'
/**
 * mst_model.js:Master Setting Detail
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');

const mstSchema = new mongoose.Schema({
    N: { type: String, required: true },
    V: { type: Object, required: true },
    S: { type: Number, required: true, default: 1 }, // 1-Active, 2-Inactive
}, { timestamps: true });

module.exports = mongoose.model('mst_model', mstSchema);

/**
 * N-Name
 * V-value
 */