import React, { useEffect } from 'react'
import { StatusBar } from 'react-native'
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { NavigationHandler } from './routes';
import socketServices from './api/socketServices';
import { useNotification } from './hooks/useNotification';
import { Screens } from './routes/helper';
import messaging from '@react-native-firebase/messaging';
import InCallManager from 'react-native-incall-manager';
import notifee, { EventType } from '@notifee/react-native';

useNotification();

const App = () => {

  const navigationRef = createNavigationContainerRef(null);

  useEffect(() => {
    socketServices.initializeSocket();

    const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      // console.log('Notification caused app to open from background state:', remoteMessage);
      handleNotificationPress(remoteMessage);
    });

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          InCallManager.stopRingtone();
          // console.log('Notification caused app to open from quit state:', remoteMessage);
          handleNotificationPress(remoteMessage);
        }
      });

    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        // console.log('Notification pressed:', detail.notification.data);
        handleNotificationPress(detail.notification.data);
      }
    });

    return () => {
      unsubscribeNotifee();
      unsubscribeNotificationOpened();
    };
  }, [])

  const handleNotificationPress = (remoteMessage) => {
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