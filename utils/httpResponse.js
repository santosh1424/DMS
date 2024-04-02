'use strict'

const fnSendStatus = (res, httStatusCode = 400) => res.sendStatus(httStatusCode)

const fnSuccess = (res, message = null) => {
    if (message) logger.info(message);
    return res.sendStatus(200).end();
}
const fnBadRequest = (res, err = null) => {
    if (err) logger.error(`fnBadRequest :: ${err}`);
    return res.sendStatus(400).end();
}
module.exports = {
    fnSendStatus,
    fnSuccess,
    fnBadRequest
}