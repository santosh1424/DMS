const cron = require('node-cron');
const {
    transactionSchema,
    complianceSchema,
    covenantsSchema,
    subsequentSchema,
    precedentSchema,
    paymentSchema
} = require('../utils/schema/mongo/index');
const fnCheckEndDate = async () => {
    try {
        cron.schedule('*/10 * * * *', async () => {
            const data = {}
            data.CD = await mongoOps.fnFindOneAndUpdate(complianceSchema, { ED: { $lte: new Date() }, DEF: { $exists: 0 } }, { DEF: 1 });
            data.TD = await mongoOps.fnFindOneAndUpdate(transactionSchema, { ED: { $lte: new Date() }, DEF: { $exists: 0 } }, { DEF: 1 });
            data.C = await mongoOps.fnFindOneAndUpdate(covenantsSchema, { ED: { $lte: new Date() }, DEF: { $exists: 0 } }, { DEF: 1 });
            data.CS = await mongoOps.fnFindOneAndUpdate(subsequentSchema, { ED: { $lte: new Date() }, DEF: { $exists: 0 } }, { DEF: 1 });
            data.CP = await mongoOps.fnFindOneAndUpdate(precedentSchema, { ED: { $lte: new Date() }, DEF: { $exists: 0 } }, { DEF: 1 });
            data.GS = await mongoOps.fnFindOneAndUpdate(paymentSchema, { ND: { $lte: new Date() }, DEF: { $exists: 0 } }, { DEF: 1 });
            logger.info('Running cron job...', data);
        });
        return null;
    } catch (error) {
        logger.warn('Error in cron job:', error);
        return error;
    }

}

module.exports = {
    fnCheckEndDate
}