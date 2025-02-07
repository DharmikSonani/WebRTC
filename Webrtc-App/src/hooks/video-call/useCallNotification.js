import InCallManager from "react-native-incall-manager";
import notifee, { AndroidCategory, AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import socketServices from "../../api/socketServices";
import { Screens } from "../../routes/helper";
import { Platform } from "react-native";
import { sockets } from "../../api/helper";

const profilePlaceholder = 'https://cdn-icons-png.flaticon.com/512/4433/4433850.png';

// List of screen which you want to avoid for video call
const notAllowedScreensForCalling = [
    Screens.VideoCallScreen,
]

export const useCallNotification = ({
    navigationRef,
    clearIncomingCallNotification = (channelId) => { console.log(`Initial clear incoming call notification: ${channelId}`); }
}) => {

    const handleIncomingCallNotification = async (data) => {
        try {

            InCallManager.stopRingtone();
            InCallManager.startRingtone();

            clearIncomingCallNotification('incoming-call');

            const channelId = await notifee.createChannel({
                id: 'incoming-call',
                name: 'WebRTC',
                lights: false,
                vibration: false,
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
            });

            const { username, profileImage } = data;

            if (Platform.OS == 'ios') {
                await notifee.setNotificationCategories([
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
            }

            await notifee.displayNotification({
                title: username ? username : 'WebRTC',
                body: `📹 Incoming video call`,
                ios: {
                    categoryId: 'incoming-call',
                    // attachments: [
                    //     {
                    //         url: profileImage ? profileImage : profilePlaceholder,
                    //     },
                    // ],
                },
                android: {
                    channelId,
                    importance: AndroidImportance.HIGH,
                    visibility: AndroidVisibility.PUBLIC,
                    showTimestamp: true,
                    category: AndroidCategory.CALL,
                    lightUpScreen: true,
                    autoCancel: false,
                    ongoing: false,
                    smallIcon: 'ic_video_call_icon',
                    largeIcon: profileImage ? profileImage : profilePlaceholder, // User Profile Image
                    timeoutAfter: 1000 * 60, // Swipe notification after ms
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
                data: data,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const handleMissCallNotification = async (data) => {
        try {

            InCallManager.stopRingtone();

            clearIncomingCallNotification('incoming-call');

            const channelId = await notifee.createChannel({
                id: 'miss-call',
                name: 'WebRTC',
                lights: false,
                vibration: false,
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
            });

            const { username, profileImage } = data;

            await notifee.displayNotification({
                title: username ? username : 'WebRTC',
                body: `Missed video call`,
                android: {
                    channelId,
                    importance: AndroidImportance.HIGH,
                    visibility: AndroidVisibility.PUBLIC,
                    showTimestamp: true,
                    category: AndroidCategory.CALL,
                    largeIcon: profileImage ? profileImage : profilePlaceholder, // User Profile Image
                    lightUpScreen: true,
                    autoCancel: false,
                    ongoing: false,
                },
            });
        } catch (error) {
            console.log(error);
        }
    };

    const handleCallAccept = (data) => {
        InCallManager.stopRingtone();
        if (data) {
            const { _from, _to } = data;
            if (_from && _to) {
                if (!notAllowedScreensForCalling.includes(navigationRef?.current?.getCurrentRoute()?.name)) {
                    navigationRef?.current?.navigate(Screens.VideoCallScreen, {
                        localUserId: _to,
                        remoteUserId: _from,
                        type: 'callee',
                    });
                } else {
                    console.log('Not able to connect.');
                }
            }
        }
    };

    const handleCallReject = (data) => {
        InCallManager.stopRingtone();
        if (data) {
            const { _from, _to } = data;
            !socketServices?.socket?.connected && socketServices.initializeSocket();
            socketServices.emit(sockets.VideoCall.declineCall, { _from: _to, _to: _from });
        }
    };

    return {
        handleIncomingCallNotification,
        handleMissCallNotification,
        handleCallAccept,
        handleCallReject,
    }
}