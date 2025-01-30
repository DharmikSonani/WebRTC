import InCallManager from "react-native-incall-manager";
import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';
import socketServices from "../../api/socketServices";
import { Screens } from "../../routes/helper";

export const useCallNotification = ({
    navigationRef
}) => {

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

        const data = remoteMessage?.data?.data && JSON.parse(remoteMessage?.data?.data);

        const { from, to } = data;

        await notifee.displayNotification({
            title: 'WebRTC',
            body: 'WebRTC',
            android: {
                channelId,
                importance: AndroidImportance.HIGH,
                ongoing: true,
                autoCancel: false,
                style: {
                    type: AndroidStyle.MESSAGING,
                    person: {
                        name: to ?? 'WebRTC',
                        // icon: 'https://img.freepik.com/premium-photo/high-quality-digital-image-wallpaper_783884-112874.jpg',
                    },
                    messages: [
                        {
                            // text: remoteMessage.notification?.body || 'You have an incoming call',
                            text: '📹 Incoming video call',
                            timestamp: Date.now(),
                            person: {
                                name: from ?? 'WebRTC',
                                icon: 'https://img.freepik.com/premium-photo/high-quality-digital-image-wallpaper_783884-112874.jpg',
                            },
                        },
                    ],
                },
                actions: [
                    {
                        title: 'Join',
                        pressAction: {
                            id: 'accept',
                            launchActivity: 'default', // Launch app from background or kill mode
                        },
                    },
                    {
                        title: 'Decline',
                        pressAction: { id: 'reject' },
                    },
                ],
            },
            data: remoteMessage,
        });
    };

    const handleCallAccept = (remoteMessage) => {
        InCallManager.stopRingtone();
        const data = remoteMessage?.data?.data && JSON.parse(remoteMessage?.data?.data);
        if (data) {
            const { from, to, offer } = data;
            if (from && to && offer) {
                navigationRef?.current?.navigate(Screens.VideoCallScreen, {
                    localUserId: to,
                    remoteUserId: from,
                    offer: offer,
                });
            }
        }
    };

    const handleCallReject = (remoteMessage) => {
        InCallManager.stopRingtone();
        const data = remoteMessage?.data?.data && JSON.parse(remoteMessage?.data?.data);
        if (data) {
            const { from, to } = data;
            !socketServices.socket && socketServices.initializeSocket();
            socketServices.emit('hangup', { from: to, to: from });
        }
    };

    return {
        displayCallNotification,
        handleCallAccept,
        handleCallReject,
    }
}