'use strict'
/**
 * team_model.js:Team Detail
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    // N: { type: String, required: true },
    // AID: { type: String, required: true },
    BID: { type: Number, required: true },
    TS: { type: Number, required: true, default: 1 },
    M: [{
        N: { type: String, required: true },
        E: { type: String, required: true },
        R: { type: String, required: true },
        S: { type: Number, required: true, default: 1 },
    }],
    // _loanId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'loan_model',
    //     required: true
    // }
});

module.exports = mongoose.model('team_model', teamSchema);

/**
 * 
 * BID
 * N-Name
 * M-members [{N1,R2},{N2,R2},{N3,R1}]  {N-name ,E-Email,R-Role,S-Status}
 * 
 * TS- Status
 * 1-Active
 * 2-Inactive
 *   
 * 
 */