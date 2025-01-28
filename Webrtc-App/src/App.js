import React, { useEffect } from 'react'
import { StatusBar } from 'react-native'
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { NavigationHandler } from './routes';
import socketServices from './api/socketServices';
import { useNotification } from './hooks/useNotification';
import { Screens } from './routes/helper';
import InCallManager from 'react-native-incall-manager';
import notifee, { EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

useNotification();

const App = () => {

  const navigationRef = createNavigationContainerRef(null);

  useEffect(() => {
    socketServices.initializeSocket();

    // notifee.onBackgroundEvent(async ({ type, detail }) => {
    //   if (type === EventType.ACTION_PRESS) {
    //     if (detail.pressAction?.id === 'accept') {
    //       onAcceptCall(detail.notification?.data);
    //     } else if (detail.pressAction?.id === 'reject') {
    //       socketServices.initializeSocket();
    //       onRejectCall(detail.notification?.data);
    //     }
    //     await notifee.cancelNotification(detail.notification?.id);
    //   }
    //   if (type === EventType.DISMISSED) {
    //     onRejectCall(detail.notification?.data);
    //     await notifee.cancelNotification(detail.notification?.id);
    //   }
    // });

    const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      onAcceptCall(remoteMessage);
    });


    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          onAcceptCall(remoteMessage);
        }
      });

    const unsubscribeNotifee = notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.ACTION_PRESS) {
        if (detail.pressAction?.id === 'accept') {
          onAcceptCall(detail.notification?.data);
        } else if (detail.pressAction?.id === 'reject') {
          onRejectCall(detail.notification?.data);
        }
        await notifee.cancelNotification(detail.notification?.id);
      }
      if (type === EventType.DISMISSED) {
        onRejectCall(detail.notification?.data);
        await notifee.cancelNotification(detail.notification?.id);
      }
    });

    return () => {
      unsubscribeNotifee();
      unsubscribeNotificationOpened();
    };
  }, [])

  const onAcceptCall = (remoteMessage) => {
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

  const onRejectCall = (remoteMessage) => {
    InCallManager.stopRingtone();
    const data = remoteMessage?.data?.data && JSON.parse(remoteMessage?.data?.data);
    if (data) {
      const { from, to } = data;
      socketServices.emit('hangup', { from: to, to: from });
    }
  };

  return (
    <>
      <StatusBar
        hidden
        translucent
        backgroundColor={'#00000000'}
      />
      <NavigationContainer ref={navigationRef}>
        <NavigationHandler />
      </NavigationContainer>
    </>
  )
}

export default App