import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { useCallNotification } from '../video-call/useCallNotification';
import { Platform } from 'react-native';

export const useNotification = ({
    navigationRef,
}) => {

    var timeoutId = '';

    const clearNotificationByChannelId = async (channelId) => {
        const notifications = await notifee.getDisplayedNotifications();

        const incomingCallNotifications = notifications.filter((notification) => {
            if (Platform.OS == 'android') { return notification.notification.android.channelId == channelId }
            if (Platform.OS == 'ios') { return notification.notification.ios.categoryId == channelId }
        });

        for (const notification of incomingCallNotifications) {
            await notifee.cancelNotification(notification.id);
        }
    }

    const {
        handleIncomingCallNotification,
        handleMissCallNotification,
        handleCallAccept,
        handleCallReject
    } = useCallNotification({
        navigationRef,
        clearIncomingCallNotification: clearNotificationByChannelId,
    });

    // Filter notification based on type of notification received by backend
    const handleNotification = async (remoteMessage) => {
        const data = remoteMessage?.data?.data && JSON.parse(remoteMessage?.data?.data);

        switch (data?.type) {
            case 'incoming-call':
                await handleIncomingCallNotification(remoteMessage)
                break;
            case 'miss-call':
                await handleMissCallNotification(remoteMessage)
                break;
            default:
                break;
        }
    }


    // Foreground Notification Handler
    messaging().onMessage((remoteMessage) => {
        handleNotification(remoteMessage);
    });

    // Foreground Nofication Press
    notifee.onForegroundEvent(async ({ type, detail }) => {
        if (type === EventType.ACTION_PRESS) {
            if (detail.pressAction?.id === 'accept') {
                handleCallAccept(detail.notification?.data);
            } else if (detail.pressAction?.id === 'reject') {
                handleCallReject(detail.notification?.data);
            }
            await notifee.cancelNotification(detail.notification?.id);
        }
        if (type === EventType.DISMISSED) {
            handleCallReject(detail.notification?.data);
            await notifee.cancelNotification(detail.notification?.id);
        }
    });


    // Background Notification Handler (To resolve automatic call of messaging().setBackgroundMessageHandler follow 1st solution of error-fix.md)
    messaging().setBackgroundMessageHandler((remoteMessage) => {
        handleNotification(remoteMessage);
        return Promise.resolve();
    });

    // Background Nofication Press
    // messaging().onNotificationOpenedApp(remoteMessage => { });

    notifee.onBackgroundEvent(async ({ type, detail }) => {
        if (type === EventType.ACTION_PRESS) {
            if (detail.pressAction?.id === 'accept') {
                if (navigationRef?.current == null) {
                    timeoutId && clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => {
                        clearTimeout(timeoutId);
                        handleCallAccept(detail.notification?.data);
                    }, 1000);
                } else {
                    handleCallAccept(detail.notification?.data);
                }
            } else if (detail.pressAction?.id === 'reject') {
                handleCallReject(detail.notification?.data);
            }
            await notifee.cancelNotification(detail.notification?.id);
        }
        if (type === EventType.DISMISSED) {
            handleCallReject(detail.notification?.data);
            await notifee.cancelNotification(detail.notification?.id);
        }
    });


    // App Kill Mode Notification Press
    // messaging().getInitialNotification()?.then(async (remoteMessage) => { });

    return {}
};