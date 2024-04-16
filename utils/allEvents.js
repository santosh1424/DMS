'use strict'

// Function to handle chat-related Socket.IO events
const handleAllEvents = async (socket, io) => {
    socket.on('sendMessage', (data) => {
        // Broadcast the received message to all connected clients
        return io.emit('messageReceived', data);
    });
    return null
    // Add more event handlers for chat-related events if needed
}

module.exports = { handleAllEvents };