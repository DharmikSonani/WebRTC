var admin = require("firebase-admin");

const serviceAccount = require("../../webrtc-video-call-notification-firebase.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

async function sendPushNotification(token, data = {}, title = 'WebRTC', body = 'Incoming Call Notification') {
    const message = {
        notification: {
            title: title,
            // body: body,
            body: `Incoming Video Call From ${data.from}`,
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

module.exports = { sendPushNotification };