// socketTest.js

const io = require('socket.io-client');

// Specify the URL of your Socket.IO server
// const socket = io('http://192.168.1.9:3000'); // Update with your server URL and port
const socket = io('http://192.168.1.9:3000', {
    auth: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJFIjoic2FudG9zaGR1YmV5LmNvZGl1bUBnbWFpbC5jb20iLCJOIjoic2FudG9zaCIsIkJJRCI6ODkxNDksIlMiOjEsImlhdCI6MTcxMzI0OTE0NH0.daR1yimvU1_tq-27ynCtQqcsHYznNiKqrEEEW_5tEFE",
    },
});
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

