'use strict'
/**
 * 
 * mailer_config.js: Mailing Setup    
 * Developer:Santosh Dubey
 * Codium Technology
 * 
 */
const dns = require('dns');
const nodemailer = require('nodemailer');

const fnSendEmail = async (options) => { // {options}= {bcc,cc,to,subject,message}
    try {
        const emailValid = await _isEmailDeliverable(options.to);
        if (!emailValid) throw new Error('Invalid email address');

        const transporter = nodemailer.createTransport({
            host: process.env.SMPT_HOST,
            port: process.env.SMPT_PORT,
            secure: false, // Use SSL
            auth: {
                user: process.env.SMPT_MAIL,
                pass: process.env.SMPT_APP_PASS,
            },

        });

        const mailOptions = {
            from: process.env.SMPT_MAIL,
            to: options.to,
            subject: options.subject,
            html: options.message,
        };
        return await transporter.sendMail(mailOptions);
    } catch (error) {
        logger.warn('Error Sending Email:', error);
        return null;
    }
};


module.exports = {
    fnSendEmail
}

const _isEmailValid = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

const _verifyDomain = (email) => {
    return new Promise((resolve, reject) => {
        const domain = email.split('@')[1];
        dns.resolveMx(domain, (err, addresses) => {
            if (err || addresses.length === 0) {
                return resolve(false);
            }
            return resolve(true);
        });
    });
};

const _isEmailDeliverable = async (email) => {
    if (!_isEmailValid(email)) {
        return false;
    }
    const domainValid = await _verifyDomain(email);
    return domainValid;
};

