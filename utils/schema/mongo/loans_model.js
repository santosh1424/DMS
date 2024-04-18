'use strict'
/**
 * loans_model.js:User Detail
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    BID: { type: Number, required: true }, // Business ID
    AID: { type: String, required: true, unique: true, trim: true }, // Agreement Id
    Z: { type: String, required: true }, // Zone (Drop Down)
    CN: { type: String, required: true, trim: true }, // Company Name
    PN: { type: String, required: true, trim: true }, // PAN Number
    GN: { type: String, required: true, trim: true }, // Group Name
    GST: { type: String, required: true, trim: true }, // GST Number
    CIN: { type: String, required: true, trim: true }, // CIN Number
    I: { type: String, required: true, trim: true }, // Industry (Drop Down)
    SA: { type: Number, required: true, trim: true }, // Sanctioned Amount
    HA: { type: Number, required: true, trim: true }, // Hold Amount
    // DA: { type: Number, required: true }, // Downsell Amount
    DD: { type: Date, required: true }, // Downsell Date
    PS: { type: String, required: true }, // Project Status (Drop Down)
    OA: { type: Number, required: true }, // Outstanding Amount
    T: { type: String, required: true }, // Loan Type (Drop Down)
    P: { type: String, required: true }, // Loan Product (Drop Down)
    ST: { type: String, required: true }, // Secured/Unsecured (Drop Down)
    SD: { type: Date, required: true }, // Sanctioned Date
    CD: { type: Date, required: true }, // Loan Closure Date
    RED: { type: Date, required: true }, // Repayment End Date
    DSRA: [{
        A: { type: String, required: true }, // DSRA Applicability
        F: { type: String, required: true }, // DSRA Form
        S: { type: String, required: true }, // DSRA Status
        V: { type: Number, required: true } // DSRA Amount
    }],

    S: { type: Number, required: true },//Share(%)
    DV: { type: Date, required: true },//Date of Valuation
    STV: [{
        T: { type: Number, required: true },//Security Type 
        V: { type: Number, required: true }//Security Value
    }],

    AN: { type: String, required: true },      // Account Name
    BAN: { type: String, required: true },     // Bank Account Number
    AT: { type: Number, required: true },      // Account type                                    // Account Type
    LB: { type: String, required: true },      // Location of Branch
    BN: { type: String, required: true },      // Bank Name
    BA: { type: String, required: true },      // Branch Address
    IFSC: {
        type: String,
        required: true,
        uppercase: true,
        match: /^[A-Z]{4}\d{7}$/                // IFSC format validation (4 letters followed by 7 digits)
    }                                           // Indian Financial System Code
});


module.exports = mongoose.model('loan_model', loanSchema);

/**
 * Loan_Basic
 * 
 *  AID-Agreement Id
 *  Z-Zone
 *       1:West
 *       2:South 
 *       3:East 
 *       4:North
 *  
 *  CN- Company Name
 *  I- Industry
 *       1:Real Estate
 *       2:NBFC 
 *       3:NBFC-MFI 
 *       4:Bank 
 *       5:Diversified Conglomerate 
 *       6:Education 
 *       7:Healthcare & Pharma 
 *       8:Hospitality Manufacturing 
 *       9:Renewable Energy 
 *       10:Roads 
 *       11:Commercial Space 
 *       12:Others
 *  
 *  SA-Sanctioned Amount
 *  HA-Hold Amount
 *  DA-Downsell Amount(Auto  SA-HA)
 *  DD-Downsell Date
 *  PS-Project Status
 *  
 *  OA-Outstanding Amount
 *  T-Loan Type
 *       1:Long Term
 *       2:Short Term
 *  
 *  P- Loan Product
 *       1:Term Loan
 *       2:Drop-line LOC
 *       3:WCDL
 *       4:Debentures
 *  
 *  ST- Security Types
 *       1:Secured
 *       2:Unsecured
 *       3:Deemed Secured
 *  
 *  SD-Sanctioned Date
 *  CD-Closure Date
 *  RED- Repayment End Date
 *  
 *  DSRA-Debt Service Reserve Account {A,F,S,V}
 *       A- Applicability DSRA
 *           1:yes
 *           2:no
 *       F- Form DSRA
 *       S- Status DSRA
 *           1:yes
 *           2:no
 *       V- Value DSRA
 *  
 * 
 * ||**Security Details**||
 * 
 *  S-Share(%)
 *  DV-Date of Valuation
 *  STV:Security Type and Value [{T1,V1},{T2,V2}]
 *      T Type
 *           1:Security creation 
 *           2:MIS 
 *           3:Financials 
 *           4:Put/Call Option 
 *           5:Financial Covenants 
 *           6:End Use
 *           7:Others
 *      
 *      V- Value
 * 
 * ||**Bank Details**||
 *  AN-Account Name
 *  BAN-Bank Account Number
 *  AT-Account Type
 *  LB-Location of Branch 
 *  BN-Bank Name
 *  BA-Branch Address
 *  IFSC-Indian Financial System Code
 * 
 */