'use strict'
/**
 * precedent_model.js:precedent Detail
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');

const precedentSchema = new mongoose.Schema({
    BID: { type: Number, required: true },
    N: { type: String, required: true, trim: true },
    C: { type: Number, required: true },
    FD: {
        N: { type: String, trim: true },
        P: { type: String, trim: true },
        S: { type: Number, trim: true },
    },
    S: {
        type: Number,
        required: true,
        trim: true,
        default: 1
    },
    D: { type: String },
    P: { type: Number, required: true },
    SD: { type: Date, required: true },
    ED: { type: Date, required: true },
    EL: { type: String },
    PL: { type: String },
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

module.exports = mongoose.model('precedent_model', precedentSchema);

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
 *
 * 
 * T- Type
 *  1- PDF
 *  2- Excel 
 *  3- PDF + Excel
 *  4- Other
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