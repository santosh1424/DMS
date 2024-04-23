const crypto = require('crypto');
const fnEncryptAES = async (data) => {
    try {
        if (!data) throw new Error('Invalid input');

        const algorithm = 'aes-256-cbc';
        const key = await crypto.createHash('sha256').update(constants.ENCRYPTION_KEY).digest().slice(0, 32); // Derive 32-byte key
        const iv = await crypto.randomBytes(16); // Generate a random IV (Initialization Vector)

        // Serialize data to JSON string before encryption
        const text = JSON.stringify(data);

        const cipher = await crypto.createCipheriv(algorithm, key, iv);
        let encrypted = await cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Prepend the IV to the encrypted data for decryption later
        const encryptedData = await iv.toString('hex') + encrypted;
        return encryptedData;
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Encryption failed');
    }
}
const fnDecryptAES = async (data) => {
    try {
        if (!data) throw new Error('Invalid input.');

        const algorithm = 'aes-256-cbc';
        const key = await crypto.createHash('sha256').update(constants.ENCRYPTION_KEY).digest().slice(0, 32); // Derive 32-byte key
        // const encryptedText=data
        const encryptedBuffer = await Buffer.from(data, 'hex');

        const iv = await encryptedBuffer.subarray(0, 16);
        const encryptedData = await encryptedBuffer.subarray(16);

        const decipher = await crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = await decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return helper.fnParseJSON(decrypted);
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Decryption failed');
    }
}

module.exports = {
    fnEncryptAES,
    fnDecryptAES
}
