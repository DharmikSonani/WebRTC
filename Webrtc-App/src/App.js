import React from 'react'
import { StatusBar } from 'react-native'
import { NavigationContainer } from '@react-navigation/native';
import { NavigationHandler } from './routes';

const App = () => {
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