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
    L: {
        N: { type: String, required: true },
        E: { type: String, required: true },
        _id: false
    },
    TD: {
        M: { type: Object, required: true, },
        C: { type: Object, required: true, },
        _id: false
    },
    CD: {
        M: { type: Object, required: true, },
        C: { type: Object, required: true, },
        _id: false
    },
    C: {
        M: { type: Object, required: true, },
        C: { type: Object, required: true, },
        _id: false
    },
    CP: {
        M: { type: Object, required: true, },
        C: { type: Object, required: true, },
        _id: false
    },
    CS: {
        M: { type: Object, required: true, },
        C: { type: Object, required: true, },
        _id: false
    },
    S: { type: Number, required: true, default: 1 }, // 1-Active, 2-Inactive
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
 * S- Status  default 1 
 *  1-Active
 *  2-Inactive
 *   
 * 
 */