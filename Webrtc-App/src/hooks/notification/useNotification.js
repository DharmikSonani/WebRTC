import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { useCallNotification } from '../video-call/useCallNotification';

export const useNotification = ({
    navigationRef,
}) => {

    var timeoutId = '';

    const {
        displayCallNotification,
        handleCallAccept,
        handleCallReject
    } = useCallNotification({ navigationRef });

    // Filter notification based on type of notification received by backend
    const handleNotification = async (remoteMessage) => {
        const data = remoteMessage?.data?.data && JSON.parse(remoteMessage?.data?.data);

        data?.type === 'incoming-call' && await displayCallNotification(remoteMessage);
    }


    // Foreground Notification Handler
    messaging().onMessage(async (remoteMessage) => {
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


    // Background Notification Handler
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        // handleNotification(remoteMessage);
    });

    // Background Nofication Press
    messaging().onNotificationOpenedApp(remoteMessage => {
        handleCallAccept(remoteMessage);
    });

    notifee.onBackgroundEvent(async ({ type, detail }) => {
        // if (type === EventType.ACTION_PRESS) {
        //     if (detail.pressAction?.id === 'accept') {
        //         handleCallAccept(detail.notification?.data);
        //     } else if (detail.pressAction?.id === 'reject') {
        //         handleCallReject(detail.notification?.data);
        //     }
        //     await notifee.cancelNotification(detail.notification?.id);
        // }
        // if (type === EventType.DISMISSED) {
        //     handleCallReject(detail.notification?.data);
        //     await notifee.cancelNotification(detail.notification?.id);
        // }
    });


    // App Kill Mode Notification Press
    messaging().getInitialNotification().then(async (remoteMessage) => {
        if (navigationRef?.current == null) {
            timeoutId && clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                clearTimeout(timeoutId);
                handleCallAccept(remoteMessage);
            }, 1000);
        } else {
            handleCallAccept(remoteMessage);
        }
    });

    return {}
};