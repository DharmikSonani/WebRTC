import React, { useEffect } from 'react'
import { StatusBar } from 'react-native'
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { NavigationHandler } from './routes';
import socketServices from './api/socketServices';
import { useNotification } from './hooks/notification/useNotification';
import notifee from '@notifee/react-native';

const navigationRef = createNavigationContainerRef();

useNotification({ navigationRef });

const App = () => {

  useEffect(() => {
    !socketServices?.socket?.connected && socketServices.initializeSocket();
    requestNotificationPermission()
    return () => { socketServices?.socket?.connected && socketServices?.socket?.disconnect(); }
  }, [])

  const requestNotificationPermission = async () => { await notifee.requestPermission() };

  return (
    <>
      <StatusBar hidden translucent />
      <NavigationContainer ref={navigationRef}>
        <NavigationHandler />
      </NavigationContainer>
    </>
  )
}

export default App