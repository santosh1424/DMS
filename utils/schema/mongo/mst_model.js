'use strict'
/**
 * mst_model.js:Master Setting Detail
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');

const mstSchema = new mongoose.Schema({
    Z: [{ V: { type: String, required: true }, S: { type: String, default: 'active' } }],
    LP: [{ V: { type: String, required: true }, S: { type: String, default: 'active' } }],
    I: [{ V: { type: String, required: true }, S: { type: String, default: 'active' } }],
    LT: [{ V: { type: String, required: true }, S: { type: String, default: 'active' } }],
    FT: [{ V: { type: String, required: true }, S: { type: String, default: 'active' } }],
    ST: [{ V: { type: String, required: true }, S: { type: String, default: 'active' } }],
    TD: [{ V: { type: String, required: true }, S: { type: String, default: 'active' } }],
    CD: [{ V: { type: String, required: true }, S: { type: String, default: 'active' } }],
    CP: [{ V: { type: String, required: true }, S: { type: String, default: 'active' } }],
    CS: [{ V: { type: String, required: true }, S: { type: String, default: 'active' } }],
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