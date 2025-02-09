# WebRTC Video Call App

## Backend Setup

This document outlines the setup and implementation of the backend for the WebRTC-based video calling application.

### Required Dependencies

- [Socket.io](https://www.npmjs.com/package/socket.io) - Real-time bidirectional event-based communication

#### Code Implementation : `src/socket/socket.js`
```javascript
const { Server } = require('socket.io');

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join Socket
    socket.on('join-socket', (userID) => {
      console.log(`Join Socket: ${userID}`);
      socket.join(userID);
    });

    // Leave Socket
    socket.on('leave-socket', (userID) => {
      console.log(`Leave Socket: ${userID}`);
      socket.leave(userID);
    });

    // Broadcast offer to peer
    socket.on('offer', (data) => {
      console.log(`Offer : ${JSON.stringify(data)}`)
      io.to(data.to).emit('offer', data);
    });

    // Broadcast answer to peer
    socket.on('answer', (data) => {
      console.log(`Answer : ${JSON.stringify(data)}`)
      io.to(data.to).emit('answer', data);
    });

    // Hangup Call
    socket.on('hangup', (data) => {
      console.log(`Hang Up : ${JSON.stringify(data)}`)
      io.to(data.to).emit('hangup', data);
    });

    // Handle ICE candidate
    socket.on('candidate', (data) => {
      console.log(`Candidate : ${JSON.stringify(data)}`)
      io.to(data.to).emit('candidate', data);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
  return io;

}

module.exports = initializeSocket;
```

#### Explanation
- Establishes a WebSocket connection using `socket.io`.
- Handles joining and leaving of sockets.
- Facilitates WebRTC signaling by emitting `offer`, `answer`, `hangup`, and `candidate` events.
- Cleans up on user disconnect.