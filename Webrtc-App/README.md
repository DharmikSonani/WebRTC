#  Frontend For Webrtc(React Native)

# 1. `usePeerConnection` Hook for React Native WebRTC

This `usePeerConnection` hook provides a simple interface for managing WebRTC Peer Connections in React Native. It utilizes the `RTCPeerConnection` from the `react-native-webrtc` library to establish a connection for WebRTC-based communication, handling the setup and teardown of the connection when needed.

## Features

- **Automatic Peer Connection Setup:** Automatically sets up a `RTCPeerConnection` with common STUN servers.
- **Automatic Cleanup:** Cleans up the connection when the component using the hook is unmounted.
- **Customizable Ice Servers:** Allows you to configure your own STUN/TURN servers.

## Prerequisites

Ensure you have the following dependencies in your React Native project:

- **react-native-webrtc**: This library provides WebRTC functionality for React Native apps.

To install the necessary dependencies, run the following command:

```bash
npm install react-native-webrtc
```

or

```bash
yarn add react-native-webrtc
```

Make sure to follow any additional setup steps for `react-native-webrtc` as mentioned in their [documentation](https://github.com/react-native-webrtc/react-native-webrtc).

## Usage

1. **Import the Hook:**

   First, import the `usePeerConnection` hook into your component.

   ```javascript
   import { usePeerConnection } from './path/to/usePeerConnection';
   ```

2. **Use the Hook:**

   Inside your functional component, call `usePeerConnection` to get access to the peer connection, and its setup and close methods.

   ```javascript
   import React, { useEffect } from 'react';
   import { usePeerConnection } from './path/to/usePeerConnection';

   const VideoCallComponent = () => {
     const { peerConnection, setupPeerConnection, closePeerConnection } = usePeerConnection();

     useEffect(() => {
       // Setup the connection when the component mounts
       setupPeerConnection();

       // Close the connection when the component unmounts
       return () => closePeerConnection();
     }, []);

     return (
       <View>
         <Text>Video Call</Text>
         {/* Your video call UI components here */}
       </View>
     );
   };

   export default VideoCallComponent;
   ```

3. **Customization:**

   You can modify the `iceServers` array inside the `setupPeerConnection` function if you'd like to use custom STUN or TURN servers for the connection. Currently, it uses Google’s public STUN servers by default.

## API Reference

### `usePeerConnection`

This hook returns an object with the following properties:

- `peerConnection`: A reference to the `RTCPeerConnection` instance, which can be used for further WebRTC operations.
- `setupPeerConnection`: A function to manually set up the peer connection (though it's automatically called in the `useEffect`).
- `closePeerConnection`: A function to manually close the peer connection, which is also automatically called when the component unmounts.

### `setupPeerConnection`

Sets up the `RTCPeerConnection` with default STUN servers. It returns the peer connection instance.

```javascript
setupPeerConnection();
```

### `closePeerConnection`

Closes the peer connection and cleans up the resources.

```javascript
closePeerConnection();
```

## Example

```javascript
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { usePeerConnection } from './usePeerConnection';

const VideoCallComponent = () => {
  const { setupPeerConnection, closePeerConnection } = usePeerConnection();

  useEffect(() => {
    setupPeerConnection();

    return () => {
      closePeerConnection();
    };
  }, []);

  return (
    <View>
      <Text>Video Call is Ongoing</Text>
      {/* Video Call UI goes here */}
    </View>
  );
};

export default VideoCallComponent;
```

## Notes

- This hook does not handle media (audio/video) tracks, it only manages the peer connection itself. You will need to add media stream handling (e.g., using `getUserMedia`) to your WebRTC implementation.
- This setup uses Google's public STUN servers, but for production use, you may want to include your own TURN servers for NAT traversal.

