'use strict'
const log4js = require('log4js');
const appenders = constants.NODE_ENV || 'local';
log4js.configure({
    appenders: {
        console: { type: 'console' }
    },
    categories: {
        // local: { appenders: ['console'], level: 'trace' },
        default: { appenders: ['console'], level: 'trace' }
    }
});

const logger = log4js.getLogger(appenders); // Get default logger
module.exports = logger;


// //Test CASE
// let req = { body: { OTP: 10 } }
// let req1 = { body: { OTP: 20 } }
// let req2 = { body: { OTP: 30 } }
// logger.info('req.body', req.body)//req.body {"OTP":10}
// logger.debug(req.body)//{"OTP":10}
// logger.info('3object', { 1: req.body, 2: req1.body, 3: req2.body })// 3object {"1":{"OTP":10},"2":{"OTP":20},"3":{"OTP":30}}
// logger.info('3arg', req.body, req1.body, req2.body)// 3arg {"OTP":10} {"OTP":20} {"OTP":30}
// logger.info('req.body', 'req.body', 'req.body', 'req.body')//req.body req.body req.body req.body
// logger.info('req.body', 'req.body', 'req.body', 'req.body', req.body, req1.body, req2.body)//req.body req.body req.body req.body
// logger.info('________________________________');
// logger.trace('This will not be logged at INFO level');
// logger.debug('This will not be logged at INFO level');
// logger.info('This will be logged at INFO level');
// logger.warn('This will be logged at INFO level');
// logger.error('This will be logged at INFO level');
// logger.fatal('This will be logged at INFO level');