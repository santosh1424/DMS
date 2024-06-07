const fs = require('fs');
const multer = require('multer');
const aes = require('../utils/aes');
const fnAllInStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const LOC = req.query.LOC;
            // _vaildateLOC(req.body.LOC)
            if (!LOC) {
                const error = new Error('LOC is missing');
                error.status = 404; // Bad Request
                return cb(error, false);
            }

            const uploadPath = `public/docs/${req.currentUserData.BID}/${LOC}/`;
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

const _vaildateLOC = (LOC) => {
    const sessionName = req.body.LOC.split("/")[1] || null;
    const folderName = req.body.LOC.split("/")[2] || null;
}
