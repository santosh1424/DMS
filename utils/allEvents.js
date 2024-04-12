// Function to handle chat-related Socket.IO events
const handleAllEvents = async (socket, io) => {
    socket.on('sendMessage', (data) => {
        // Broadcast the received message to all connected clients
        io.emit('messageReceived', data);
    });

    // Add more event handlers for chat-related events if needed
}

module.exports = handleAllEvents;