const _ = require("lodash");


const fnSetUserSchema = async (data) => _.pick(data, ["E", "N", "BID", "S", "TKN"]);
const fnGetUserSchema = async (data) => _.pick(data, ["E", "N", "BID", "S", "TKN"]);

module.exports = {
    fnSetUserSchema,
    fnGetUserSchema
}