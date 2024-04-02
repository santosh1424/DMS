const _ = require('lodash');
const httpResponse = require('../utils/httpResponse');

const fnTestApp = (req, res) => {
    try {
        const message = 'This is MessagE'
        logger.info(`fnTestApp ${message}`)
        httpResponse.fnSuccess(res);
        // res.status(200).json({ message });

    } catch (err) {
        return logger.error('fnTestApp', err)

    }

}
module.exports = {
    fnTestApp
}