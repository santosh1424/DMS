'use strict'

const fnGlobalKey = () => '{global-channel}';
const fnUserKey = (BID = 0, _userId) => `${BID}:{${_userId}}:user`;
const fnAdminKey = (BID = 0, _adminId) => `${BID}:{${_adminId}}:admin`;
const fnAddUserKey = (BID = 0, _userId) => `${BID}:{${_userId}}:adduser`;
const fnOTPKey = (BID = 0, email) => `${BID}:{${email}}:OTP`;

module.exports = {
    fnGlobalKey,
    fnUserKey,
    fnAdminKey,
    fnAddUserKey,
    fnOTPKey

}