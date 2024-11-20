const cron = require('node-cron');
const {
    transactionSchema,
    complianceSchema,
    covenantsSchema,
    subsequentSchema,
    precedentSchema,
    paymentSchema
} = require('../utils/schema/mongo/index');
const { fnSendEmail } = require('../config/mailer_config');

const fnDefaultCheck = async () => {
    try {
        cron.schedule('*/15 * * * *', async () => {
            const data = {}
            const docsQuery = { ED: { $lte: new Date() }, DEF: { $exists: 0 }, S: { $ne: 'Verified' } }
            const paymentQuery = { ND: { $lte: new Date() }, DEF: { $exists: 0 }, S: { $ne: 'Verified' } }
            const mongoUpdate = { DEF: 1 }
            data.CD = await mongoOps.fnUpdateMany(complianceSchema, docsQuery, mongoUpdate);
            data.TD = await mongoOps.fnUpdateMany(transactionSchema, docsQuery, mongoUpdate);
            data.C = await mongoOps.fnUpdateMany(covenantsSchema, docsQuery, mongoUpdate);
            data.CS = await mongoOps.fnUpdateMany(subsequentSchema, docsQuery, mongoUpdate);
            data.CP = await mongoOps.fnUpdateMany(precedentSchema, docsQuery, mongoUpdate);
            data.GS = await mongoOps.fnUpdateMany(paymentSchema, paymentQuery, mongoUpdate);

            logger.info('Running cron job...', data);
        });
        return null;
    } catch (error) {
        logger.warn('fnDefaultCheck', error);
        return error;
    }

}



const fnSendNotification = async () => {
    try {
        cron.schedule('*/1 * * * * *', async () => {
            const data = {}
            // const docsQuery = { S: { $ne: 'Verified' } }//ED: { $lte: new Date() }, DEF: { $exists: 0 },
            // data.CD = await mongoOps.fnFind(complianceSchema, docsQuery);
            // data.TD = await mongoOps.fnFind(transactionSchema, docsQuery);
            // data.C = await mongoOps.fnFind(covenantsSchema, docsQuery);
            // data.CS = await mongoOps.fnFind(subsequentSchema, docsQuery);
            // data.CP = await mongoOps.fnFind(precedentSchema, docsQuery);

            /**
             * TODO
             * Find data by session name
             * find team linked with loan
             * find maker and checker 
             * make email
             * send email
             */


            // Filter items with Session Name
            if (Array.isArray(data.CD)) {
                const pipeline = [
                    {
                        $match: { S: { $ne: 'Verified' } }
                    },
                    {
                        $lookup: {
                            from: "loan_models",
                            localField: "_loanId",
                            foreignField: "_id",
                            as: "loanDetail"
                        }
                    },
                    {
                        $unwind: {
                            path: "$loanDetails",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            N: 1,
                            C: 1,
                            SD: 1,
                            ED: 1,
                            S: 1,
                            EL: 1,
                            PL: 1,
                            P: 1,
                            _loanId: 1,
                            _teamId: {
                                $arrayElemAt: ["$loanDetail._teamId", 0]
                            },
                            AID: {
                                $arrayElemAt: ["$loanDetail.AID", 0]
                            }
                        }
                    }
                ];

                data.CD = await mongoOps.fnAggregate(complianceSchema, pipeline);

                // const makerCD = docsCD.filter(item => item.S === 'Pending');
                // const checkerCD = docsCD.filter(item => item.S === 'In progress');
                // const uniqueIds = [...new Set(docsCD.map(item => item._loanId))];
                // logger.debug(data.CD);
                // data.TD = await mongoOps.fnAggregate(transactionSchema, pipeline);
                // data.C = await mongoOps.fnAggregate(covenantsSchema, pipeline);
                // data.CS = await mongoOps.fnAggregate(subsequentSchema, pipeline);
                // data.CP = await mongoOps.fnAggregate(precedentSchema, pipeline);
            }
            // const paymentQuery = { ND: { $lte: new Date() }, DEF: { $exists: 0 }, S: { $ne: 'Verified' } }
            // data.GS = await mongoOps.fnFind(paymentSchema, paymentQuery);
            // logger.info('fnSendNotification...', data);
        });
        return null;
    } catch (error) {
        logger.warn('Error in cron job:', error);
        return error;
    }

}

module.exports = {
    fnDefaultCheck,
    fnSendNotification
}