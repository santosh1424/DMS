const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    BID: { type: Number, required: true },
    _loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'loan_model',
        required: true
    },
    P: {
        type: Number,
        required: true
    },
    F: {
        type: String,
        enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'], // Adjust frequency options as needed
        required: true
    },
    SD: {
        type: Date,
        required: true
    },
    ED: {
        type: Date,
        required: true
    },
    T: {
        type: String,
        enum: ['Fixed', 'Manual'],
        required: true
    },
    S: {
        type: String,
        required: true,
        trim: true,
        enum: ['Pending', 'In progress', 'Complete'],
        default: 'Pending'
    },
    I: {
        type: Number,
        // required: true
    },
    H: {
        type: String,
        enum: ['Subsequent', 'Precedent', 'None'],
        required: true
    },
    GS: [{
        _id: false,
        D: Date,
        R: String,
        I: Number,
        S: String,
        FD: Object
    }]
});

module.exports = mongoose.model('payment_model', paymentSchema);


/**
 * P-Principal
 * F-Frequency
 * SD-Start Date
 * ED-End Date
 * T-type [fixed,manual]
 * I-Interest
 * H-Hoilday [Subsequent ,Precedent ]
 * GS-Generated Schedule 
 *  
*/