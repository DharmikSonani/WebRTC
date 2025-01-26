import React from 'react'
import VideoCallScreen from './screens/VideoCallScreen'
import { StatusBar } from 'react-native'

const App = () => {
  return (
    <>
      <StatusBar
        hidden
        translucent
        backgroundColor={'#00000000'}
      />
      <VideoCallScreen />
    </>
  )
}

export default App