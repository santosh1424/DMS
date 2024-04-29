'use strict'
/**
 * contact_model.js:contact Details Schema 
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');

const contactDetailsSchema = new mongoose.Schema({
    BID: { type: Number, required: true },          // Business ID
    AID: { type: String, required: true },          // Agreement Id
    CT: { type: String, },           // Contact Type (e.g., Customer, Vendor, Supplier, etc.)
    RT: { type: Number, },           // Recipient Type(e.g to,cc,bcc)
    CE: { type: String, trim: true },                       // Contant Email
    CN: { type: String, trim: true },                       // Company Name
    PN: { type: String, trim: true },                       // Person Name
    D: { type: String, trim: true },                        // Designation
    LN: { type: String, trim: true },                       // Landline Number
    MN: { type: String, trim: true },                       // Mobile Number
    BA: { type: String, trim: true },       // Borrow Address
    BC: { type: String, trim: true },       // Borrow City
    BS: { type: String, trim: true },       // Borrow State
    BCC: { type: String, trim: true },      // Borrow Country Code
    BP: { type: String, trim: true },       // Borrow Pincode
    RA: { type: String, trim: true },       // Register Address
    RC: { type: String, trim: true },       // Register City
    RS: { type: String, trim: true },       // Register State
    RCC: { type: String, trim: true },      // Register Country Code
    RP: { type: String, trim: true },        // Register Pincode
    _loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'loan_model',
        required: true
    }
});


module.exports = mongoose.model('contact_model', contactDetailsSchema);
/**
 * 
 * 
 * |4|**Contact Details**||
 *  BID-Business ID
 *  AID-Agreement Id
 *  CT-Contact Type
 *      1 Borrower
 *      2 Promotor 
 *      3 Lender 
 *      4 Lender Agent 
 *      5 Legal Council (LLC) 
 *      6 Banks Legal Team (vetting) 
 *      7 Lender Insurance Agent (LIA) 
 *      8 Lenders Independent Engineer (LIE)
 * 
 *  RT-Recipient Type
 *      1-to
 *      2-cc
 *      3-bcc
 *  CE-Contant Email
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
