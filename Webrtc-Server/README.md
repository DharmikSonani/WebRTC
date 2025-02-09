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