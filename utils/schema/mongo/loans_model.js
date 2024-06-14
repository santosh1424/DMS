'use strict'
/**
 * loans_model.js:User Detail
 * Developer:Santosh Dubey
 * 
 */
const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    BID: { type: Number, required: true }, // Business ID
    AID: {
        type: String, required: true,
        unique: true, trim: true,
        default: generateUniqueAID,

    }, // Agreement Id
    Z: { type: String, }, // Zone (Drop Down)
    CN: { type: String, trim: true }, // Company Name
    PN: { type: String, trim: true }, // PAN Number
    GN: { type: String, trim: true }, // Group Name
    GST: { type: String, trim: true }, // GST Number
    CIN: { type: String, trim: true }, // CIN Number
    I: { type: String, trim: true }, // Industry (Drop Down)
    SA: { type: Number, trim: true }, // Sanctioned Amount
    HA: { type: Number, trim: true }, // Hold Amount
    // DA: { type: Number,  }, // Downsell Amount
    DD: { type: Date }, // Downsell Date
    PS: { type: String }, // Project Status (Drop Down)
    OA: { type: Number }, // Outstanding Amount
    T: { type: String }, // Loan Type (Drop Down)
    P: { type: String }, // Loan Product (Drop Down)
    ST: { type: String }, // Secured/Unsecured (Drop Down)
    SD: { type: Date }, // Sanctioned Date
    CD: { type: Date }, // Loan Closure Date
    RED: { type: Date }, // Repayment End Date
    DSRA: {
        A: { type: String }, // DSRA Applicability
        F: { type: String }, // DSRA Form
        S: {
            type: String,
            trim: true,
            enum: ['yes', 'no']
        },
        V: { type: Number } // DSRA Amount
    },

    SP: { type: Number, },//Share Precentage 
    DV: { type: Date, },//Date of Valuation
    STV: {
        T: { type: String },//Security Type 
        V: { type: Number }//Security Value
    },
    BD: {
        AN: { type: String },// Account Name
        BAN: { type: String },     // Bank Account Number
        AT: { type: String },      // Account type                                
        LB: { type: String },      // Location of Branch
        BN: { type: String },      // Bank Name
        BA: { type: String },      // Branch Address
        IFSC: {
            type: String,
            uppercase: true,
            match: /^[A-Z]{4}\d{7}$/                // IFSC format validation (4 letters followed by 7 digits) Indian Financial System Code (IFSC)
        }
    },
    _teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'team_model'
    }

}, {
    timestamps: true
});
// Custom function to generate a unique random number for BID
loanSchema.pre('save', async function (next) {
    const maxTry = 3;
    let totalTry = 0;

    while (totalTry < maxTry) {
        const randomNumber = generateUniqueAID()
        const existingAID = await this.constructor.findOne({ AID: randomNumber });
        if (!existingAID) {
            this.AID = randomNumber;
            return next();
        }
        totalTry++;
    }
    // Throw an error if the maximum number of attempts is reached
    const error = new Error(`Failed to generate a unique random number for AID after ${maxTry} attempts.`);
    return next(error);
});

function generateUniqueAID() {
    return helper.fnRandomAlphaNumeric(9);//length 0-8
}

module.exports = mongoose.model('loan_model', loanSchema);

/**
 * Loan_Basic
 * |1|**Basic Details**||
 *
 *  AID-Agreement Id
 *  Z-Zone
 *       1:West
 *       2:South
 *       3:East
 *       4:North
 *
 *  CN- Company Name
 *  PN- PAN Nuber
 *  GN-Group Name
 *  CIN Number
 *  GST Number
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
 * |2|**Security Details**||
 *
 *  S-Share(%)
 *  DV-Date of Valuation
 *  STV:Security Type and Value [{T1,V1},{T2,V2}]
 *      T- Type
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
 * |3|**Bank Details**||
 *  BD-Bank Details
 *   {
 *    AN-Account Name
 *      BAN-Bank Account Number
 *      AT-Account Type
 *      LB-Location of Branch
 *      BN-Bank Name
 *      BA-Branch Address
 *      IFSC-Indian Financial System Code
 * }
 *
 */
