const crypto = require('crypto');

// Encryption function using async/await with arrow function

const encrypt = async (text, password) => {
    try {
        if (!text || !password) {
            throw new Error('Invalid input. Text and password are required.');
        }

        const algorithm = 'aes-256-cbc';
        const key = crypto.createHash('sha256').update(password).digest().slice(0, 32); // Derive 32-byte key

        const iv = crypto.randomBytes(16); // Generate a random IV (Initialization Vector)

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
const decrypt = async (encryptedText, password) => {
    try {
        if (!encryptedText || !password) {
            throw new Error('Invalid input. Encrypted text and password are required.');
        }

        const algorithm = 'aes-256-cbc';
        const key = crypto.createHash('sha256').update(password).digest().slice(0, 32); // Derive 32-byte key

        const encryptedBuffer = Buffer.from(encryptedText, 'hex');
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
    const plaintext = 'Hello, world!';
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
