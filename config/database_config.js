// Connect to MongoDB
const mongoose = require('mongoose');

const fnDbConnection = (uri) => {
    mongoose.connect(uri, {})
        .then(() => {
            logger.info(`Connected to MongoDB`);
        })
        .catch((error) => {
            return logger.error('Failed to connect to MongoDB', error);

        });
}
module.exports = { fnDbConnection } 
