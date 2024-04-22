const _ = require("lodash");


const fnSetUserSchema = async (data) => _.pick(data, ["_socketid", "E", "N", "BID", "S", "TKN"]);
const fnSetLoanSchema = async (data) => data//_.pick(data, ["_socketid", "E", "N", "BID", "S", "TKN"]);
const fnGetUserSchema = async (data) => _.pick(data, ["_socketid", "E", "N", "BID", "S", "TKN"]);

module.exports = {
    fnSetUserSchema,
    fnGetUserSchema,
    fnSetLoanSchema
}