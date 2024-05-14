'use strict'
/**
 * team_model.js:Team Detail
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    BID: { type: Number, required: true },
    TS: { type: Number, required: true, default: 1 },
    PM: [{
        N: { type: String, required: true },
        E: { type: String, required: true },
        S: { type: Number, required: true, default: 1 },
        _id: false
    }],
    PE: [{
        N: { type: String, required: true },
        E: { type: String, required: true },
        S: { type: Number, required: true, default: 1 },
        _id: false
    }]
}, {
    timestamps: true
}
);

module.exports = mongoose.model('team_model', teamSchema);

/**
 * 
 * BID
 * N-Name
 * PM-Project Manager [{N1,R2},{N2,R2},{N3,R1}]  {N-name ,E-Email,R-Role,S-Status}
 * PE-Project Employer [{N1,R2},{N2,R2},{N3,R1}]  {N-name ,E-Email,R-Role,S-Status}
 * TS- Status
 * 1-Active
 * 2-Inactive
 *   
 * 
 */