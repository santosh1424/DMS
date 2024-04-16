'use strict'
// socketConfig.js
const jwt = require('jsonwebtoken');
const { handleAllEvents } = require('../utils/allEvents'); // Import event handler for chat-related events
const { fnPublish, fnSubscribe } = require('../utils/pubsub');
// Function to configure and return a Socket.IO instance
const fnConfigureSocketIO = async (io) => {
    try {

        // Socket connection handling
        io.use((socket, next) => {
            const token = socket.handshake.auth.token;

            logger.debug('token',token);
            // Verify JWT token
            jwt.verify(token, constants.SECRET_KEY, (err, decoded) => {
                if (err) {
                    logger.warn('Err',err);
                    return next(new Error('Authentication error'));
                }

                // Attach userId to socket for future use
                socket.userId = decoded.userId;
                // next();
            });
        });
        // Event handling for Socket.IO connections
        await io.on('connection', async (socket) => {
            logger.debug('New client connected:', socket.id);
            // socket.on('authenticate', async (token) => {
            //     try {
            //         const decoded = jwt.verify(token, constants.SECRET_KEY);

            //         if (decoded.userId) {
            //             socket.userId = decoded.userId;

            //             // Store userId - socketId mapping in Redis
            //             await redis.set(socket.userId.toString(), socket.id);

            //             console.log(`User authenticated: ${socket.userId}`);

            //             // Emit a custom event to indicate successful authentication
            //             socket.emit('authenticated');
            //         } else {
            //             throw new Error("Invalid token");
            //         }
            //     } catch (error) {
            //         console.error("Authentication error:", error.message);
            //         socket.emit('authentication_error', { message: error.message });
            //     }
            // });
            // Handle chat-related events using separate event handler module
            await handleAllEvents(socket, io);

            // Example usage: Subscribe to a Redis channel and handle incoming messages
            const channelName = 'BusinessChannel';

            await fnSubscribe(channelName, (receivedMessage) => {
                logger.debug(`Received message from ${receivedMessage.sender}: ${receivedMessage.text}`);
            });

            // Example usage: Publish a message to a Redis channel
            const message = { sender: 'Alice', text: 'Hello, world!' };

            await fnPublish(channelName, message);

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
