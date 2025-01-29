import InCallManager from "react-native-incall-manager";
import notifee, { AndroidImportance } from '@notifee/react-native';
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