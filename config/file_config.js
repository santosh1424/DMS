const fs = require('fs');
const multer = require('multer');
const aes = require('../utils/aes');
const fnAllInStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            req.body = await aes.fnDecryptAES(req.body.data);
            const uploadPath = `public/docs/${req.currentUserData.BID}/${req.body.LOC}/`;
            fnDirectoryExists(uploadPath);
            cb(null, uploadPath);
        } catch (error) {
            cb(error, false);
        }
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
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

module.exports = { fnAllInStorage };
