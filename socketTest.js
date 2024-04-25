// socketTest.js

const io = require('socket.io-client');

// Specify the URL of your Socket.IO server
// const socket = io('http://192.168.1.9:3000'); // Update with your server URL and port
const socket = io('http://192.168.1.9:3000', {
    query: {
        data: "U2FsdGVkX1/o+77Af32tGpUDiFujpg9yQLsduYFzcPLdThZYGquOu6/rcvSFEeLlAP1cHT1xmVFZI2qVp2uHisAZiB8g5hQRUX+jIKv0IPRSnsxxbCRO2dlcoZP8TGibyv0Kyw5X37bTsySL8dSOC1vWrNf5BV3PHA+eWjkdkelqsS04ARMQyuh9Bb5k7udISkZ0ru5xR3w2vRXCCGmH1qwZIRqer4g2246NPeJRpLkk2P+XIr6L/uuxfwRl2k/IlGg7jxpkAZsUlBIV7aifdZsQG4wFXrq72kqccIFrYJJlFr6AUn08U59TMdrD1ha8hQY8XO4y+hQnh5GfbWHaRr7Tv30ia5+QY9JvXu4ctMk="
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

