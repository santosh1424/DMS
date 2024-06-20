'use strict'
/**
 * 
 * mst_service.js: master service
 * Developer:Santosh Dubey
 * Codium Technology
 * 
 */
const _ = require('lodash');
const httpResponse = require('../utils/httpResponse');
const { mstSchema } = require('../utils/schema/mongo/index');



const fnUpdateMST = async (BID = 0, body = null) => {
    try {
        // const BID = parseInt(req.currentUserData.BID) || 0;//UUID
        const _id = body._id || null;
        if (!BID || _id && !ObjectId.isValid(_id)) return httpResponse.fnPreConditionFailed(res);
        let data;
        if (_id) data = await mongoOps.fnFindOneAndUpdate(mstSchema, { BID, _id: new ObjectId(_id) }, { V: body.V })
        else data = await mongoOps.fnInsertOne(mstSchema, { BID, N: body.N, V: body.V });
        return data;
    } catch (error) {
        if (error.code === 11000) return httpResponse.fnUnprocessableContent(res);//MongoDB DuplicateKey error
        else return httpResponse.fnBadRequest(res);

    }
    return null;
};

//List Role 
const fnListMST = async (BID = 0) => {
    try {
        return await mongoOps.fnFind(mstSchema, { BID });
    } catch (error) {
        logger.warn('fnListMST', error);
        return error;
    }
    return null;
}
module.exports = {
    fnUpdateMST,
    fnListMST
}

