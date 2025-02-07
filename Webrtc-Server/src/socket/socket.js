const { Server } = require('socket.io');
const { sendDataOnlyNotification } = require('../notification/notification');
const { userImages } = require('../temp');

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
    socket.on('join-socket', (data) => {
      const { userId, fcmToken } = data;
      fcmTokens[userId] = fcmToken;
      console.log(`Join Socket: ${userId}`);
      socket.join(userId);
    });

    // Leave Socket
    socket.on('leave-socket', (userId) => {
      console.log(`Leave Socket: ${userId}`);
      socket.leave(userId);
    });

    // ------------------------ For Video Call [Start] ------------------------

    // Send Incoming Call Notification
    socket.on('incoming-call-notification', async (data) => {
      // console.log(`Incoming Call Notification : ${JSON.stringify(data)}`);
      const notificationData = {
        username: data._from,
        profileImage: userImages[data._from],
        type: 'incoming-call',
        ...data,
      }

      fcmTokens[data._to] != fcmTokens[data._from] ? (fcmTokens[data._to] && await sendDataOnlyNotification(fcmTokens[data._to], notificationData)) : delete fcmTokens[data._from];

      io.to(data._to).emit('incoming-call-notification', { data: notificationData });
    });

    // Miss Call Notification
    socket.on('miss-call-notification', async (data) => {
      // console.log(`Miss Call Notification: ${JSON.stringify(data)}`);
      const notificationData = {
        username: data._from,
        profileImage: userImages[data._from],
        type: 'miss-call',
        ...data,
      }

      fcmTokens[data._to] != fcmTokens[data._from] ? (fcmTokens[data._to] && await sendDataOnlyNotification(fcmTokens[data._to], notificationData)) : delete fcmTokens[data._from];

      io.to(data._to).emit('miss-call-notification', { data: notificationData });
    });

    // Accept Call
    socket.on('accept-call', async (data) => {
      // console.log(`Accept Call : ${JSON.stringify(data)}`);
      io.to(data._to).emit('accept-call', data);
    });

    // Decline Call
    socket.on('decline-call', async (data) => {
      // console.log(`Decline Call : ${JSON.stringify(data)}`);
      io.to(data._to).emit('decline-call', data);
    });

    // ------------------------ For Video Call [End] ------------------------

    // ------------------------ For WebRTC [Start] ------------------------

    // Broadcast offer to peer
    socket.on('offer', async (data) => {
      // console.log(`Offer : ${JSON.stringify(data)}`);
      io.to(data._to).emit('offer', data);
    });

    // Broadcast answer to peer
    socket.on('answer', (data) => {
      // console.log(`Answer : ${JSON.stringify(data)}`);
      io.to(data._to).emit('answer', data);
    });

    // Hangup Call
    socket.on('hangup', (data) => {
      // console.log(`Hang Up : ${JSON.stringify(data)}`);
      io.to(data._to).emit('hangup', data);
    });

    // Handle ICE candidate
    socket.on('candidate', (data) => {
      // console.log(`Candidate : ${JSON.stringify(data)}`);
      io.to(data._to).emit('candidate', data);
    });

    // ------------------------ For WebRTC [End] ------------------------

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
  return io;

}

module.exports = initializeSocket;