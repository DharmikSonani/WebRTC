import React, { memo, useEffect } from 'react'
import { StatusBar } from 'react-native'
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { NavigationHandler } from './routes';
import socketServices from './api/socketServices';
import { useNotification } from './hooks/notification/useNotification';

const navigationRef = createNavigationContainerRef();

useNotification({ navigationRef });

const App = () => {

  useEffect(() => {
    socketServices.initializeSocket();
  }, [])

  return (
    <>
      <StatusBar hidden translucent />
      <NavigationContainer ref={navigationRef}>
        <NavigationHandler />
      </NavigationContainer>
    </>
  )
}

export default memo(App)