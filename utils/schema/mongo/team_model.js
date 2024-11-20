'use strict'
/**
 * team_model.js:Team Detail
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');
const teamSchema = new mongoose.Schema({
    BID: { type: Number, required: true },
    N: { type: String, required: true },
    // L: {
    //     N: { type: String, required: true },
    //     E: { type: String, required: true },
    //     _id: false
    // },
    L: { type: String, required: true },//Team Lead
    TD: {
        M: { type: Array, required: true },//{ type: Object, required: true, },
        C: { type: Array, required: true },//{ type: Object, required: true, },
        _id: false
    },
    CD: {
        M: { type: Array, required: true },//{ type: Object, required: true, },
        C: { type: Array, required: true },//{ type: Object, required: true, },
        _id: false
    },
    C: {
        M: { type: Array, required: true },//{ type: Object, required: true, },
        C: { type: Array, required: true },//{ type: Object, required: true, },
        _id: false
    },
    CP: {
        M: { type: Array, required: true },//{ type: Object, required: true, },
        C: { type: Array, required: true },//{ type: Object, required: true, },
        _id: false
    },
    CS: {
        M: { type: Array, required: true },//{ type: Object, required: true, },
        C: { type: Array, required: true },//{ type: Object, required: true, },
        _id: false
    },
    PD: {
        M: { type: Array, required: true },//{ type: Object, required: true, },
        C: { type: Array, required: true },//{ type: Object, required: true, },
        _id: false
    },
    S: {
        type: String,
        required: true,
        trim: true,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    // _loanId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'loan_model',
    //     required: true
    // },
}, {
    timestamps: true
});

module.exports = mongoose.model('team_model', teamSchema);

/**
 * BID
 * N-Name
 * L-Lead {N,E}
 * TD - Tranaction Document {M:[],C:[]}
 * CD - Compliance Document {M:[],C:[]}
 * C - Covenants {M:[],C:[]}
 * CP - Condition Precedent {M:[],C:[]}
 * CS - Condition Subsequent {M:[],C:[]}
 * PD - Payment Details {M:[],C:[]}
 * S- Status  default 1 
 *  1-Active
 *  2-Inactive
 *   
 * 
 */