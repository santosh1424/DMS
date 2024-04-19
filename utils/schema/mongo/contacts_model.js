'use strict'
/**
 * contact_model.js:contact Details Schema 
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');

const contactDetailsSchema = new mongoose.Schema({
    CT: { type: String, required: true },       // Contact Type (e.g., Customer, Vendor, Supplier, etc.)
    R: { type: Number, required: true },        // Recipient (e.g., Name of the contact)
    CN: { type: String, required: true, trim: true },                       // Company Name
    PN: { type: String, required: true, trim: true },                       // Person Name
    D: { type: String, required: true, trim: true },                        // Designation
    LN: { type: String, required: true, trim: true },                       // Landline Number
    MN: { type: String, required: true, trim: true },                       // Mobile Number
    BA: { type: String, required: true, trim: true },       // Borrow Address
    BC: { type: String, required: true, trim: true },       // Borrow City
    BS: { type: String, required: true, trim: true },       // Borrow State
    BCC: { type: String, required: true, trim: true },      // Borrow Country Code
    BP: { type: String, required: true, trim: true },       // Borrow Pincode
    RA: { type: String, required: true, trim: true },       // Register Address
    RC: { type: String, required: true, trim: true },       // Register City
    RS: { type: String, required: true, trim: true },       // Register State
    RCC: { type: String, required: true, trim: true },      // Register Country Code
    RP: { type: String, required: true, trim: true },        // Register Pincode
    _loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'loan_model'
    }
});


module.exports = mongoose.model('contact_model', contactDetailsSchema);
/**
 * 
 * 
 * |4|**Contact Details**||
 *  CT-Contact Type
 *  R-Recipient
 *      1-to
 *      2-cc
 *      3-bcc
 *  E-Email
 *  CN-Company Name
 *  PN-Person Name
 *  D-Designation
 *  LN-Landline Number 
 *  MN-Mobile Number
 *  
 *  
 *  -+-Billing Details-+-
 *  
 *  BA-Borrow Address 
 *  BC-Borrow City 
 *  BS-Borrow State 
 *  BCC-Borrow Country Code
 *  BP-Borrow Pincode
 *  
 *  -+-Registered Address-+-
 *  
 *  RA-Register Address 
 *  RC-Register City 
 *  RS-Register State 
 *  RCC-Register Country Code 
 *  RP-Register Pincode
 * 
 */
