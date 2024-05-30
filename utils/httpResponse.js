'use strict'

const fnSendStatus = (res, httStatusCode = 400) => res.sendStatus(httStatusCode)

const fnSuccess = (res, data = null) => {
    if (data) return res.status(200).jsonp(data);
    else return res.sendStatus(200).end();
}
const fnBadRequest = (res, err = null) => {
    if (err) logger.warn('fnBadRequest', err);
    return res.sendStatus(400).end();
}
const fnUnauthorized = (res, err = null) => {
    if (err) logger.warn('fnUnauthorized', err);
    return res.sendStatus(401).end();
}
const fnForbidden = (res, err = null) => {
    if (err) logger.warn('fnForbidden', err);
    return res.sendStatus(403).end();
}
const fnNotFound = (res, err = null) => res.sendStatus(404).end();
const fnConflict = (res, err = null) => {
    if (err) logger.warn('fnConflict', err);
    return res.sendStatus(409).end();
}

const fnPreConditionFailed = (res, err = null) => {
    if (err) logger.warn('fnPreConditionFailed', err);
    return res.sendStatus(412).end();
}
const fnUnprocessableContent = (res, err = null) => res.sendStatus(422).end();
const fnServiceUnavailable = (res) => res.sendStatus(503).end();

module.exports = {
    fnSendStatus,
    fnSuccess,
    fnBadRequest,
    fnUnauthorized,
    fnForbidden,
    fnConflict,
    fnPreConditionFailed,
    fnServiceUnavailable,
    fnNotFound,
    fnUnprocessableContent
}