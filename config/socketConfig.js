'use strict'
// socketConfig.js
const jwt = require('jsonwebtoken');
const aes = require('../utils/aes');
const { handleAllEvents } = require('../utils/allEvents'); // Import event handler for chat-related events
// Function to configure and return a Socket.IO instance
const fnConfigureSocketIO = async (io) => {
    try {
        // Authenticate Socket connection handling
        await io.use(async (socket, next) => {
            const encryptData = socket.handshake.query.data || socket.handshake.auth.data;
            if (!encryptData) return null;
            const data = await aes.fnDecryptAES(encryptData)
            if (!data) return null;
            // Verify JWT token
            jwt.verify(data.TKN, constants.SECRET_KEY, async (err, decoded) => {
                if (err) return next(new Error('Authentication Error'));
                // Attach userId to socket for future use
                socket._userId = decoded._userId;
                await redisClient.hset(redisKeys.fnUserKey(decoded.BID, decoded._userId), "_socketid", socket.id);
                next();
            });
        });
        // Event handling for Socket.IO connections
        await io.on('connection', async (socket) => {
            logger.debug('New client connected:', socket.id);
            // Handle chat-related events using separate event handler module
            await handleAllEvents(socket, io);
            await socket.on('disconnect', (reason) => {
                logger.warn('Client disconnected:', reason, socket.id);
            });

            await socket.on('connect_error', (error) => {
                logger.warn('Connection error:', error.message);
            });
            // Add more event handlers for other types of events using similar imports
        });

        return io;
    } catch (error) {
        logger.warn("Socket Err", error)
    }
    return null;
}

module.exports = { fnConfigureSocketIO };
