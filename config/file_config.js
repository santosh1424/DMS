const fs = require('fs');
const multer = require('multer');

// Define multiple storage configurations
const storage1 = multer.diskStorage({
    destination: (req, file, cb) => {
        // logger.debug('destination', req.currentUserData,file)
        const uploadPath = `public/docs/${req.currentUserData.BID}/TD/common/`;//'uploadsTest/storage1/';
        fnDirectoryExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {

        cb(null, Date.now() + '-' + file.originalname);
    },
});

const storage2 = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = `public/docs/${req.currentUserData.BID}/TD/security/`

        fnDirectoryExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

// Function to ensure directory exists
const fnDirectoryExists = (directory) => {
    try {
        fs.mkdirSync(directory, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
}

module.exports = { storage1, storage2 };
