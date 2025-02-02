import InCallManager from "react-native-incall-manager";
import notifee, { AndroidCategory, AndroidImportance, AndroidStyle, AndroidVisibility } from '@notifee/react-native';
import socketServices from "../../api/socketServices";
import { Screens } from "../../routes/helper";
import { Platform } from "react-native";
import { sockets } from "../../api/helper";

export const useCallNotification = ({
    navigationRef
}) => {

    const displayCallNotification = async (remoteMessage) => {
        try {

            InCallManager.stopRingtone();
            InCallManager.startRingtone();

            await notifee.cancelAllNotifications();

            const channelId = await notifee.createChannel({
                id: remoteMessage?.messageId?.toString(),
                name: 'WebRTC',
                lights: false,
                vibration: false,
                importance: AndroidImportance.HIGH,
                bypassDnd: true,
                visibility: AndroidVisibility.PUBLIC,
            });

            const data = remoteMessage?.data?.data && JSON.parse(remoteMessage?.data?.data);

            const { from, to } = data;

            Platform.OS == 'ios' && await notifee.setNotificationCategories([
                {
                    id: 'incoming-call',
                    actions: [
                        {
                            title: `Join`,
                            id: 'accept',
                            foreground: true,
                        },
                        {
                            title: `Decline`,
                            id: 'reject',
                        },
                    ],
                },
            ]);

            await notifee.displayNotification({
                title: Platform.OS == 'android' ? `Incoming call` : from ?? 'WebRTC',
                body: Platform.OS == 'android' ? 'Tap to answer' : `📹 Incoming video call`,
                ios: {
                    categoryId: 'incoming-call',
                    attachments: [
                        {
                            url: 'https://img.freepik.com/premium-photo/high-quality-digital-image-wallpaper_783884-112874.jpg',
                        },
                    ],
                },
                android: {
                    channelId,
                    importance: AndroidImportance.HIGH,
                    visibility: AndroidVisibility.PUBLIC,
                    ongoing: true,
                    autoCancel: false,
                    showTimestamp: true,
                    category: AndroidCategory.CALL,
                    lightUpScreen: true,
                    fullScreenAction: {
                        id: 'default',
                    },
                    smallIcon: 'ic_video_call_icon',
                    color: '#4CAF50',
                    colorized: true,
                    timeoutAfter: 1000 * 60, // Swipe notification after ms
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
                                    important: true,
                                },
                            },
                        ],
                    },
                    actions: [
                        {
                            title: `<p style="color: #4CAF50;"><b>Join</b></p>`,
                            pressAction: {
                                id: 'accept',
                                launchActivity: 'default', // Launch app from background or kill mode
                            },
                        },
                        {
                            title: `<p style="color: #F44336;"><b>Decline</b></p>`,
                            pressAction: { id: 'reject' },
                        },
                    ],
                },
                data: remoteMessage,
            });
        } catch (error) {
            console.log(error);
        }
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
            !socketServices?.socket?.connected && socketServices.initializeSocket();
            socketServices.emit(sockets.VideoCall.hangup, { from: to, to: from });
        }
    };

    return {
        displayCallNotification,
        handleCallAccept,
        handleCallReject,
    }
}