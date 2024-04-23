const crypto = require('crypto');
const sPassword = 'supersecret';
const _ = require('lodash');
// Encryption function using async/await with arrow function
const encrypt = async (data) => {
    try {
        if (!data) throw new Error('Invalid input');

        const algorithm = 'aes-256-cbc';
        const key = crypto.createHash('sha256').update(sPassword).digest().slice(0, 32); // Derive 32-byte key
        const iv = crypto.randomBytes(16); // Generate a random IV (Initialization Vector)

        // Serialize data to JSON string before encryption
        const text = JSON.stringify(data);

        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Prepend the IV to the encrypted data for decryption later
        const encryptedData = iv.toString('hex') + encrypted;
        return encryptedData;
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Encryption failed');
    }
};

// Decryption function using async/await with arrow function
const decrypt = async (data) => {
    try {
        if (!data) throw new Error('Invalid input.');

        const algorithm = 'aes-256-cbc';
        const key = crypto.createHash('sha256').update(sPassword).digest().slice(0, 32); // Derive 32-byte key
        // const encryptedText=data
        const encryptedBuffer = Buffer.from(data, 'hex');

        const iv = encryptedBuffer.subarray(0, 16);
        const encryptedData = encryptedBuffer.subarray(16);

        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Decryption failed');
    }
};

// Example usage
const runEncryptionDecryption = async () => {
    const plaintext = { a: 'hi', b: 1 };
    const password = 'supersecret';

    try {
        const encryptedText = await encrypt(plaintext, password);
        console.log('Encrypted:', encryptedText);

        const decryptedText = await decrypt(encryptedText, password);
        console.log('Decrypted:', decryptedText);
    } catch (error) {
        console.error('Encryption/Decryption error:', error.message);
    }
};

// Run the encryption and decryption example
runEncryptionDecryption();
