'use strict'
// socketConfig.js
const jwt = require('jsonwebtoken');
const { handleAllEvents } = require('../utils/allEvents'); // Import event handler for chat-related events
const { fnPublish, fnSubscribe } = require('../utils/pubsub');
const redisSchema = require('../utils/schema/redis/model/allinOne_schema')
// Function to configure and return a Socket.IO instance
const fnConfigureSocketIO = async (io) => {
    try {

        // Authenticate Socket connection handling
        await io.use(async (socket, next) => {
            const { token, _userID } = socket.handshake.query || socket.handshake.auth;
            if (!token && !_userID) return null;

            // // Example usage: Subscribe to a Redis channel and handle incoming messages
            // const channelName = 'BusinessChannel';

            // await fnSubscribe(channelName, (receivedMessage) => {
            //     logger.debug(`Received message from ${receivedMessage.sender}: ${receivedMessage.text}`);
            // });

            // // Example usage: Publish a message to a Redis channel
            // const message = { sender: 'SantoshLocal', text: 'Hello, world!' };

            // await fnPublish(channelName, message);
            // Verify JWT token
            jwt.verify(token, constants.SECRET_KEY, async (err, decoded) => {
                if (err) return next(new Error('Authentication Error'));
                // Attach userId to socket for future use
                socket._userId = _userID;
                await redisClient.hset(redisKeys.fnUserKey(decoded.BID, _userID), "_socketid", socket.id);
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
