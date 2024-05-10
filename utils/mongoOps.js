'use strict'
/**
 * 
 * mongoOps.js: MongoDB Operation 
 * Developer:Santosh Dubey
 * Codium Technology
 * 
 */


const fnFind = async (collectionName, query = {}, projection = {}, options = { new: true, lean: true }) => {
    return await collectionName.find(query, projection, options)
}

const fnFindOne = async (collectionName, query, projection = {}, options = { new: true, lean: true }) => {
    return await collectionName.findOne(query, projection, options)
}
const fnFindOneAndUpdate = async (collectionName, query, update, options = { new: true, lean: true }) => {
    return await collectionName.findOneAndUpdate(query, update, options)
}

const fnFindOneAndDelete = async (collectionName, query, projection = {}) => {
    return await collectionName.findOneAndDelete(query, projection)
}
const fnAggregate = async (collectionName, pipeline = []) => {
    return await collectionName.aggregate(pipeline).exec();
};

const fnDeleteOne = async (collectionName, query) => {
    return await collectionName.deleteOne(query);
};

const fnDeleteMany = async (collectionName, query) => {
    return await collectionName.deleteMany(query);
};

const fnInsertOne = async (collectionName, document) => {
    return await collectionName.create(document);
};

const fnInsertMany = async (collectionName, documents) => {
    return await collectionName.insertMany(documents);
};

const fnSave = async (collectionName, documents) => {
    const newDocument = new collectionName(documents);
    return await newDocument.save();
};

module.exports = {
    fnFind,
    fnFindOne,
    fnFindOneAndUpdate,
    fnFindOneAndDelete,
    fnAggregate,
    fnDeleteOne,
    fnDeleteMany,
    fnInsertOne,
    fnInsertMany,
    fnSave
}