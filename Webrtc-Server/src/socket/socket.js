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
      socket.join(userID);
    });

    // Leave Socket
    socket.on('LeaveSocket', (userID) => {
      socket.leave(userID);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
  return io;

}

module.exports = initializeSocket;