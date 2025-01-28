import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import InCallManager from 'react-native-incall-manager';

export const useNotification = () => {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
        InCallManager.stopRingtone();
        if (remoteMessage?.data?.data) {
            // console.log('Message handled in the background!', remoteMessage.data.data && JSON.parse(remoteMessage.data.data));
            InCallManager.startRingtone();
        } else {
            console.log('Message handled in the background!', remoteMessage);
        }
    });

    notifee.onBackgroundEvent((remoteMessage) => { })

    messaging().getInitialNotification(async remoteMessage => {
        InCallManager.stopRingtone();
        if (remoteMessage?.data?.data) {
            // console.log('Message handled in the Kill Mode', remoteMessage.data.data && JSON.parse(remoteMessage.data.data));
            InCallManager.startRingtone();
        } else {
            console.log('Message handled in the Kill Mode', remoteMessage);
        }
    });

    messaging().onMessage(async remoteMessage => {
        // Request permissions (required for iOS)
        await notifee.requestPermission();
        InCallManager.stopRingtone();
        // Create a channel (required for Android)
        const channelId = await notifee.createChannel({
            id: remoteMessage.from.toString(),
            name: 'WebRTC',
            lights: false,
            vibration: false,
            importance: AndroidImportance.HIGH,
        });

        if (remoteMessage?.data?.data) {
            // console.log('Message handled', remoteMessage.data.data && JSON.parse(remoteMessage.data.data));
            InCallManager.startRingtone();
        } else {
            console.log('Message handled', remoteMessage);
        }

        // Display a notification
        await notifee.displayNotification({
            title: remoteMessage.notification.title.toString(),
            body: remoteMessage.notification.body.toString(),
            android: {
                channelId,
            },
            data: remoteMessage,
        });
    });
};
