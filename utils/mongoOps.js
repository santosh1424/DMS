'use strict'
/**
 * 
 * mongoOps.js: MongoDB Operation 
 * Developer:Santosh Dubey
 * Codium Technology
 * 
 */


const fnFind = (collectionName, query = {}, projection = {}, options = { new: true, lean: true }) => {
    return collectionName.find(query, projection, options)
}

const fnFindOne = (collectionName, query, projection = {}, options = { new: true, lean: true }) => {
    return collectionName.findOne(query, projection, options)
}
const fnFindOneAndUpdate = (collectionName, query, update, options = { new: true, lean: true }) => {
    return collectionName.findOneAndUpdate(query, update, options)
}

const fnFindOneAndDelete = (collectionName, query, projection = {}) => {
    return collectionName.findOneAndDelete(query, projection)
}

module.exports = {
    fnFind,
    fnFindOne,
    fnFindOneAndUpdate,
    fnFindOneAndDelete,
}