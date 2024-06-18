'use strict'
/**
 * rating_model.js:rating Detail
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    A: {
        type: String,
        required: true
    },
    T: {
        type: String,
        required: true
    },
    DT: {
        type: Date,
        required: true
    },
    O: {
        type: String,
        required: true
    },
    L: {
        type: String,
        required: true
    },
    V: {
        type: String,
        required: true
    },
    _loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'loan_model',
        required: true
    },
    BID: {
        type: Number,
        required: true,
    }
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model('rating_model', ratingSchema);

/**
 * A- Agency [ICRA ,CRISIL ,BWR]
 *      1- ICRA 
 *      2- CRISIL
 *      3- BWR
 * 
 * T-type [final,provision]
 *      1- final
 *      2- provision
 * 
 * DT-date
 * 
 * O-outlook [Postive,Stable,Negative]
 *      1- Postive
 *      2- Stable
 *      3- Negative
 * L-link (URL)
 * V -value of Rating
 * 
 * 
 * 

 */