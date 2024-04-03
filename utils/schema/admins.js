const mongoose = require('mongoose');

// Define schema
const adminSchema = new mongoose.Schema({
    E: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    P: {
        type: String,
        required: true,
        trim: true
    },
    CN: {
        type: String,
        required: true,
        trim: true
    },

    TU: {
        type: Number,
        required: true,
        trim: true
    },
    MU: {
        type: Number,
        required: true,
        trim: true
    }
});



module.exports = mongoose.model('admins_model', adminSchema);

/**
 * 
 * E-email
 * P-password
 * CN-Company Name
 * TU-Total User
 * MU-Maximum User
 */