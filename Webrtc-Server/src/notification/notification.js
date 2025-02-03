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
        data: { data: JSON.stringify(data) },
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
        data: { data: JSON.stringify(data) },
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