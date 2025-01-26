import React, { useEffect } from 'react'
import { StatusBar } from 'react-native'
import { NavigationContainer } from '@react-navigation/native';
import { NavigationHandler } from './routes';
import socketServices from './api/socketServices';

const App = () => {

  useEffect(() => {
    socketServices.initializeSocket();
  }, [])

  return (
    <>
      <StatusBar
        hidden
        translucent
        backgroundColor={'#00000000'}
      />
      <NavigationContainer>
        <NavigationHandler />
      </NavigationContainer>
    </>
  )
}

export default App