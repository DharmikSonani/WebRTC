import InCallManager from "react-native-incall-manager";
import notifee, { AndroidCategory, AndroidImportance, AndroidStyle, AndroidVisibility } from '@notifee/react-native';
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
            bypassDnd: true,
            visibility: AndroidVisibility.PUBLIC,
        });

        const data = remoteMessage?.data?.data && JSON.parse(remoteMessage?.data?.data);

        const { from, to } = data;

        await notifee.displayNotification({
            title: 'Incoming call',
            body: 'Tap to answer',
            android: {
                channelId,
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
                ongoing: true,
                autoCancel: false,
                showTimestamp: true,
                category: AndroidCategory.CALL,
                lightUpScreen: true,
                smallIcon: 'ic_video_call_icon',
                style: {
                    type: AndroidStyle.MESSAGING,
                    person: {
                        name: to ?? 'WebRTC',
                    },
                    messages: [
                        {
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