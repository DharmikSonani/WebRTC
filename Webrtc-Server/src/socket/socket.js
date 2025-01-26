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
    socket.on('JoinSocket', (userID) => {
      console.log(`Join Socket: ${userID}`);
      socket.join(userID);
    });

    // Leave Socket
    socket.on('LeaveSocket', (userID) => {
      console.log(`Leave Socket: ${userID}`);
      socket.leave(userID);
    });

    // Broadcast offer to peer
    socket.on('offer', (data) => {
      console.log(`Offer : ${JSON.stringify(data)}`)
      io.to(data.to).emit('offer', { offer: data.offer, from: data.from });
    });

    // Broadcast answer to peer
    socket.on('answer', (data) => {
      console.log(`Answer : ${JSON.stringify(data)}`)
      io.to(data.to).emit('answer', { answer: data.answer, from: data.from });
    });

    socket.on('hangup', (data) => {
      console.log(`Hang Up : ${JSON.stringify(data)}`)
      io.to(data.to).emit('hangup', { from: data.from });
    });

    // Handle ICE candidate
    socket.on('candidate', (data) => {
      console.log(`Candidate : ${JSON.stringify(data)}`)
      io.to(data.to).emit('candidate', { candidate: data.candidate, from: data.from });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
  return io;

}

module.exports = initializeSocket;