'use strict'
/**
 * subsequent_model.js:subsequent Detail
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');

const subsequentSchema = new mongoose.Schema({
    BID: { type: Number, required: true },
    N: { type: String, required: true, trim: true },
    R: { type: String, trim: true, },
    C: { type: String, required: true },
    FD: { type: Object, trim: true },
    S: {
        type: String,
        required: true,
        trim: true,
        enum: ['Pending', 'In progress', 'Complete'],
        default: 'Pending'
    },
    D: { type: String },
    P: { type: String, required: true },
    SD: { type: Date, required: true },
    ED: { type: Date, required: true },
    EL: { type: String },
    PL: { type: String },
    D: { type: String },
    _loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'loan_model',
        required: true
    },
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model('subsequent_model', subsequentSchema);

/**
 * 
 * N - Name
 *  1 - Common Loan Agreement
 *  2 - Lender Agents Agreement
 *  3 - Power Purchase Agreement
 *  4 - Escrow Agreement
 *  5 - Subordination Agreement
 *  6 - Subsitution Agreement 
 *  7 - Supplementary Escrow Agreement 
 * 
 * D- Description
 * 
 * P- Priority
 *  1- Low
 *  2- Medium
 *  3- High
 * 
 * SD-Start Date
 * ED-End Date
 * EL-Execution Location
 * PL-Physical Location
 */