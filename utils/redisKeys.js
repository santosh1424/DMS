'use strict'

const fnGlobalKey = () => '{global-channel}';
const fnUserKey = (_userId) => `{${_userId}}:user`;
const fnAdminKey = () => `{global}:Admin`;

module.exports = {
    fnGlobalKey,
    fnUserKey,
    fnAdminKey

}