'use strict'

const fnSendStatus = (res, httStatusCode = 400) => res.sendStatus(httStatusCode)

const fnSuccess = (res, message = null) => {
    if (message) return res.status(200).json({ message });
    else return res.sendStatus(200).end();
}
const fnBadRequest = (res, err = null) => {
    if (err) logger.error('fnBadRequest', err);
    return res.sendStatus(400).end();
}
const fnUnauthorized = (res, err = null) => {
    if (err) logger.error('fnUnauthorized', err);
    return res.sendStatus(401).end();
}
const fnConflict = (res, err = null) => res.sendStatus(409).end();
const fnNotFound = (res, err = null) => res.sendStatus(404).end();

const fnPreConitionFailed = (res, err = null) => {
    if (err) logger.error('fnPreConitionFailed', err);
    return res.sendStatus(412).end();
}
const fnServiceUnavailable = (res) => res.sendStatus(503).end();

module.exports = {
    fnSendStatus,
    fnSuccess,
    fnBadRequest,
    fnUnauthorized,
    fnConflict,
    fnPreConitionFailed,
    fnServiceUnavailable,
    fnNotFound
}