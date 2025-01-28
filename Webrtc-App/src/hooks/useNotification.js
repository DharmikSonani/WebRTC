import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import InCallManager from 'react-native-incall-manager';

export const useNotification = () => {
    const displayCallNotification = async (remoteMessage) => {
        InCallManager.stopRingtone();
        InCallManager.startRingtone();

        const channelId = await notifee.createChannel({
            id: remoteMessage.from.toString(),
            name: 'WebRTC',
            lights: false,
            vibration: false,
            importance: AndroidImportance.HIGH,
        });

        await notifee.displayNotification({
            title: remoteMessage.notification?.title || 'Incoming Call',
            body: remoteMessage.notification?.body || 'You have an incoming call',
            android: {
                channelId,
                importance: AndroidImportance.HIGH,
                ongoing: true,
                autoCancel: false,
                actions: [
                    {
                        title: 'Accept',
                        pressAction: { id: 'accept' },
                    },
                    {
                        title: 'Reject',
                        pressAction: { id: 'reject' },
                    },
                ],
            },
            data: remoteMessage,
        });
    };

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        // console.log('Background message received:', remoteMessage);
        // onNotificationReceive(remoteMessage);
    });

    messaging().onMessage(async (remoteMessage) => {
        // console.log('Foreground message received:', remoteMessage);
        onNotificationReceive(remoteMessage);
    });

    const onNotificationReceive = async (remoteMessage) => {
        const data = remoteMessage?.data?.data && JSON.parse(remoteMessage?.data?.data);
        if (data?.type === 'call') {
            await displayCallNotification(remoteMessage);
        }
    }

    notifee.onBackgroundEvent(async ({ type, detail }) => { });
};