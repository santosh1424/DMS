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

module.exports = {
    fnFind,
    fnFindOne,
    fnFindOneAndUpdate,
    fnFindOneAndDelete,
}