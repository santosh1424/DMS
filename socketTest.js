// socketTest.js

const io = require('socket.io-client');

// Specify the URL of your Socket.IO server
const socket = io('http://192.168.1.4:3000'); // Update with your server URL and port

// Event handler for connecting to the server
socket.on('connect', () => {
    console.log('Connected to Socket.IO server');

    // Send a test message to the server
    socket.emit('sendMessage', { message: 'Hello from Socket.IO client!' });
});

// Event handler for receiving messages from the server
socket.on('messageReceived', (data) => {
    console.log('Received message from server:', data);
});

// Event handler for disconnecting from the server
socket.on('disconnect', () => {
    console.log('Disconnected from Socket.IO server');
});


