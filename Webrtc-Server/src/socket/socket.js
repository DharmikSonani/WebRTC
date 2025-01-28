const { Server } = require('socket.io');
const { sendPushNotification } = require('../notification/notification');

let io;

const fcmTokens = {}

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join Socket
    socket.on('JoinSocket', (data) => {
      const { userId, fcmToken } = data;
      fcmTokens[userId] = fcmToken;
      console.log(`Join Socket: ${userId}`);
      socket.join(userId);
    });

    // Leave Socket
    socket.on('LeaveSocket', (userId) => {
      console.log(`Leave Socket: ${userId}`);
      socket.leave(userId);
    });

    // Broadcast offer to peer
    socket.on('offer', async (data) => {
      // console.log(`Offer : ${JSON.stringify(data)}`);
      fcmTokens[data.to] != fcmTokens[data.from] ? await sendPushNotification(fcmTokens[data.to], { ...data, type: 'call' }) : delete fcmTokens[data.from];
      io.to(data.to).emit('offer', { offer: data.offer, from: data.from });
    });

    // Broadcast answer to peer
    socket.on('answer', (data) => {
      // console.log(`Answer : ${JSON.stringify(data)}`);
      io.to(data.to).emit('answer', { answer: data.answer, from: data.from });
    });

    // Hangup Call
    socket.on('hangup', (data) => {
      // console.log(`Hang Up : ${JSON.stringify(data)}`);
      io.to(data.to).emit('hangup', { from: data.from });
    });

    // Handle ICE candidate
    socket.on('candidate', (data) => {
      // console.log(`Candidate : ${JSON.stringify(data)}`);
      io.to(data.to).emit('candidate', { candidate: data.candidate, from: data.from });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
  return io;

}

module.exports = initializeSocket;