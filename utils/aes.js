const CryptoJS = require('crypto-js');

const fnEncryptAES = async (data) => {
    try {
        if (typeof (data) == 'object') data = await helper.fnStringlyJSON(data);
        data = CryptoJS.AES.encrypt(data, constants.ENCRYPTION_KEY).toString();
        return data;
    } catch (error) {
        logger.warn('Encryption failed:', error.message);
        return new Error('Encryption failed');
    }
};

const fnDecryptAES = async (data) => {
    try {
        data = CryptoJS.AES.decrypt(data, constants.ENCRYPTION_KEY);
        data = await data.toString(CryptoJS.enc.Utf8);
        return helper.fnParseJSON(data);
    } catch (error) {
        logger.warn('Decryption failed:', error);
        return new Error('Decryption failed');
    }
};

module.exports = {
    fnEncryptAES,
    fnDecryptAES
};
