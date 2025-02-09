# WebRTC Video Call App

## Backend Setup

This document outlines the setup and implementation of the backend for the WebRTC-based video calling application.

### Required Dependencies

- [Socket.io](https://www.npmjs.com/package/socket.io) - This is required to establish WebSocket connections for real-time communication between the server and the frontend.
- [Firebase-admin](https://www.npmjs.com/package/firebase-admin) - This is required for Firebase Cloud Messaging (FCM) to send push notifications.

### 1. Firebase Push Notification Setup

This section explains how to set up and implement Firebase push notifications in your WebRTC app.

#### Required Dependencies
- **[firebase-admin](https://www.npmjs.com/package/firebase-admin)** - To interact with Firebase Cloud Messaging (FCM) and send notifications.

#### Firebase Configuration

Make sure to initialize Firebase with your service account credentials. This is done using the Firebase Admin SDK.

```javascript
var admin = require('firebase-admin');
const serviceAccount = require('../../webrtc-video-call-notification-firebase.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
```

#### Code Implementation [`src/notification/notification.js`](https://github.com/DharmikSonani/WebRTC/blob/Push-Notification/Webrtc-Server/src/notification/notification.js)

```javascript
var admin = require('firebase-admin');

const serviceAccount = require('../../webrtc-video-call-notification-firebase.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Triggers system notifications for frontend
const sendPushNotification = async (token, data = {}, title = 'WebRTC', body = '') => {
    const message = {
        notification: {
            title: title,
            body: body,
        },
        token: token,
        data: data,
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Notification sent successfully:', response);
        return { success: true, response };
    } catch (error) {
        console.log('Error sending notification:', error);
    }
}

// Only wakes app in background for frontend
const sendDataOnlyNotification = async (token, data = {}) => {
    const message = {
        data: data,
        token: token,
        android: {
            priority: 'high',
        },
        apns: {
            headers: {
                'apns-priority': '10',
            },
            payload: {
                aps: {
                    'content-available': 1,
                },
            },
        },
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Data-Only Notification sent successfully:', response);
    } catch (error) {
        console.log('Error sending Data-Only Notification:', error);
    }
}

module.exports = { sendPushNotification, sendDataOnlyNotification };
```

#### Explanation
- **Firebase Admin Initialization:** 
  - The Firebase Admin SDK is initialized with your service account JSON file (`webrtc-video-call-notification-firebase.json`). This allows your backend to send push notifications through Firebase Cloud Messaging (FCM).

- **`sendPushNotification` Function:**
  - Sends a push notification to a specific device using a provided **FCM token**.
  - The notification includes a **title**, **body**, and any additional **data** that should accompany the notification.
  - If successful, it logs and returns the response from FCM.

- **`sendDataOnlyNotification` Function:**
  - Sends a "data-only" notification, which doesn't display an actual message but wakes the app in the background to handle the data.
  - This notification includes **high priority** settings for both Android and iOS, ensuring that the app is woken up quickly.
  - It sends data in the payload, which is passed to the frontend when the app is in the background.

- **Return Values:**
  - `sendPushNotification` returns an object indicating success or failure of the notification sending process.
  - `sendDataOnlyNotification` logs the success or failure of the operation but does not return any value.

#### Usage
- Import the `sendPushNotification` and `sendDataOnlyNotification` functions in your server-side logic where notifications need to be triggered.
- Call these functions with the required parameters (FCM token, notification data, title, body, etc.).

---

### 2. Socket Setup for Video Call Notifications

This section explains how to set up and implement real-time video call notifications using Socket.IO.

#### Required Dependencies
- **[socket.io](https://www.npmjs.com/package/socket.io)** - To handle WebSocket communication for real-time events.
- **[notification](https://github.com/DharmikSonani/WebRTC/blob/Push-Notification/Webrtc-Server/src/notification/notification.js)** - To send data-only notifications for incoming and missed calls.

#### Code Implementation [`src/socket/socket.js`](https://github.com/DharmikSonani/WebRTC/blob/Push-Notification/Webrtc-Server/src/socket/socket.js)

```javascript
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
      io.to(data._to).emit('accept-call', data);
    });

    // Decline Call
    socket.on('decline-call', async (data) => {
      io.to(data._to).emit('decline-call', data);
    });

    // ------------------------ For Video Call [End] ------------------------

    // ------------------------ For WebRTC [Start] ------------------------

    // Broadcast offer to peer
    socket.on('offer', async (data) => {
      io.to(data._to).emit('offer', data);
    });

    // Broadcast answer to peer
    socket.on('answer', (data) => {
      io.to(data._to).emit('answer', data);
    });

    // Hangup Call
    socket.on('hangup', (data) => {
      io.to(data._to).emit('hangup', data);
    });

    // Handle ICE candidate
    socket.on('candidate', (data) => {
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
```

#### Explanation
- **Socket.IO Server Initialization:**
  - The `Server` from `socket.io` is initialized on the provided HTTP server to allow WebSocket communication. It listens for connections and handles various events.
  
- **Event Listeners:**
  - **`connection`:** Handles the initial connection and provides a socket ID for each user.
  
  - **`join-socket`:** The user joins a specific room identified by their `userId`. The FCM token is stored in the `fcmTokens` object for later use.
  
  - **`leave-socket`:** Allows a user to leave a room using their `userId`.

  - **Video Call Notifications:**  
    - **`incoming-call-notification`:** Sends a notification to the receiving user about an incoming call, including the caller's username and profile image.
    - **`miss-call-notification`:** Sends a notification for missed calls to the user.
    - **`accept-call`:** Sends a notification to accept the call.
    - **`decline-call`:** Sends a notification to decline the call.

  - **WebRTC Event Handlers:**
    - **`offer`, `answer`, `hangup`, `candidate`:** These events are used to send WebRTC signaling data such as offer, answer, ICE candidates, and hang-up signals between peers.

- **FCM Token Management:**
  - The `fcmTokens` object stores the user's FCM tokens, which are used to send data-only push notifications when the app is in the background or inactive.

- **Return Values:**
  - The function `initializeSocket` sets up the Socket.IO server and returns the `io` instance to manage connections.

#### Usage
1. Ensure the `server` parameter is passed when calling `initializeSocket`, which is typically an HTTP or HTTPS server instance.
2. Listen for incoming events like incoming call notifications, missed call notifications, and WebRTC signaling data.