'use strict';

/**
 * mst_model.js: Master Setting Detail
 * Developer: Santosh Dubey
 * 
 */

const mongoose = require('mongoose');
const mstSchema = new mongoose.Schema({
    BID: { type: Number, required: true, },
    LP: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false },],
    ZL: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    FT: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    IN: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    LT: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    DRR: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    TRP: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    PS: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    DF: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    LST: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    BAT: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    CT: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    ER: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    RA: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    RT: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    RO: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    TC: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    CC: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    CV: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    CTY: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    CPC: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
    CSC: [{ V: { type: String, required: true }, S: { type: String, default: 'active' }, _id: false }],
}, { timestamps: true });

module.exports = mongoose.model('mst_model', mstSchema);

/*
 * LP- Loan Product List
 * ZL- Zone List
 * FT- File Type List
 * IN- Industry List
 * LT- Loan Type List
 * DRR- Document Rejection Reason List
 * TRP- Table Rows Per Page
 * PS- Project Status List
 * DF- DSRA Form List
 * LST- Loan Security Type List
 * BAT- Bank Account Type List
 * CT- Contact Type List
 * ER- Email Recipient List
 * RA- Rating Agency List
 * RT- Rating Type List
 * RO- Rating Outlook List
 * TC- Transaction Category List
 * CC- Compliance Category List
 * CV- Covenant Category List
 * CTY- Covenant Type List
 * CPC- Condition Precedent Category List
 * CSC- Condition Subsequent Category List
*/
