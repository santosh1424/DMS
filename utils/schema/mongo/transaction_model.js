'use strict'
/**
 * transaction_model.js:Transaction Detail
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    BID: { type: Number, required: true },
    N: { type: String, required: true, trim: true, },
    C: { type: Number, required: true },
    P: { type: Number, required: true },
    SD: { type: Date, required: true },
    ED: { type: Date, required: true },
    EL: { type: String, trim: true },
    PL: { type: String, trim: true },
    FD: {
        N: { type: String, trim: true },
        P: { type: String, trim: true },
        S: { type: Number, trim: true },
    },
    _loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'loan_model',
        required: true
    },
    S: {
        type: Number,
        required: true,
        trim: true,
        default: 1
    }
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model('transaction_model', transactionSchema);

/**
 * 
 * N - Name
 * C - Category
 *    1-Common Loan Agreements / Facility Agreement/Loan Agreement 
 *    2-Security Trustee Agreement
 *    3-Lenders’ Agent Agreement
 *    4-Escrow Agreement;
 *    5-Substitution Agreement;
 *    6-Subordination Agreement;
 *    7-Supplementary Escrow Agreement;
 *    8-Sponsor’s Undertakings;
 *    9-Security documents
 *    10-Pledge Agreement;
 *    11-Consent to Assignment, if applicable
 *    12-Trust and Retention Account Agreement
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
 * FD-file Date {N-name ,P-path,S-size}

 * S-Stauts
 */