'use strict'
/**
 * 
 * redisOps.js: Redis Operation 
 * Developer:Santosh Dubey
 * Codium Technology
 * 
 */

const fnSet = async (client, key, value) => {
    return await client.set(key, value);
}
const fnHSet = async (client, key, value) => {
    return await client.hset(key, value);
}

module.exports = {
    fnSet, fnHSet

}