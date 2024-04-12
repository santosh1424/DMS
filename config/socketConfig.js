// socketConfig.js

const socketIO = require('socket.io');
const Redis = require('ioredis');
const redisAdapter = require('socket.io-redis');
const handleAllEvents = require('../utils/allEvents'); // Import event handler for chat-related events

// Function to configure and return a Socket.IO instance
const configureSocketIO = async (server) => {
    const io = socketIO(server);

    // Initialize Redis client
    const redisClient = new Redis();

    // Use ioredis as the Socket.IO adapter
    // io.adapter(redisAdapter({ pubClient: redisClient, subClient: redisClient }));

    // Event handling for Socket.IO connections
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Handle chat-related events using separate event handler module
        handleAllEvents(socket, io);

        // Add more event handlers for other types of events using similar imports
    });

    return io;
}

module.exports = configureSocketIO;
