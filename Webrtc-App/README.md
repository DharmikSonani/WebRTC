# 1. `usePeerConnection` WebRTC Peer Connection Hook Setup Guide

## Overview
This guide explains how to use the `usePeerConnection` hook to manage a WebRTC peer connection in a React Native application. The hook sets up a peer connection with ICE servers and provides methods for creating, managing, and closing the connection.

## Prerequisites
Before you start using this hook, ensure the following dependencies are installed:

1. **React Native** - For building your mobile application.
2. **react-native-webrtc** - A package for implementing WebRTC functionalities in React Native.

### Install Dependencies

```bash
npm install react-native-webrtc
```

## How the Hook Works

The `usePeerConnection` hook handles the creation and cleanup of the WebRTC peer connection. It uses `RTCPeerConnection` from the `react-native-webrtc` package to manage the connection lifecycle, including ICE server setup.

### Hook Implementation

The hook provides the following functionalities:

- **Setup of Peer Connection**
- **Close Peer Connection**
- **Ref Access to Peer Connection**

### Code Breakdown

```javascript
import { useEffect, useRef } from 'react';
import { RTCPeerConnection } from 'react-native-webrtc';

export const usePeerConnection = () => {
    const peerConnection = useRef(null); // Reference to hold the peer connection

    useEffect(() => {
        setupPeerConnection(); // Initialize peer connection on mount
        return () => { closePeerConnection(); }; // Cleanup on unmount
    }, []);

    // Setup Peer Connection
    const setupPeerConnection = () => {
        const connection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
            ],
        });
        peerConnection.current = connection; // Save peer connection reference
    };

    // Close Peer Connection
    const closePeerConnection = () => {
        if (peerConnection.current) {
            peerConnection.current.close(); // Close the connection
            peerConnection.current = null; // Clear the reference
        }
    };

    return {
        peerConnection, // Provides reference to the peer connection
        setupPeerConnection, // Method to manually setup the connection
        closePeerConnection, // Method to manually close the connection
    };
};
```

### Key Features

1. **`peerConnection` (Ref)**: A reference to the `RTCPeerConnection` instance. It can be used to access the peer connection object in other parts of the code.
2. **`setupPeerConnection`**: Initializes a new `RTCPeerConnection` with predefined ICE servers for STUN (Session Traversal Utilities for NAT). This allows the WebRTC client to connect to the remote peer.
3. **`closePeerConnection`**: Closes the peer connection and clears the reference when the component is unmounted.

### ICE Servers Configuration

The `usePeerConnection` hook uses Google’s publicly available STUN servers:

```json
{
    "urls": [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302"
    ]
}
```

These STUN servers are used for NAT (Network Address Translation) traversal, helping peers find each other and establish a direct connection.

## How to Use the Hook

### 1. Import the Hook

To use the hook in your component, import it as shown below:

```javascript
import { usePeerConnection } from './path-to-your-hook';
```

### 2. Initialize Peer Connection in Your Component

You can now use the hook in any functional component to handle peer connection creation and cleanup:

```javascript
import React, { useEffect } from 'react';
import { usePeerConnection } from './path-to-your-hook';

const VideoCallComponent = () => {
    const { peerConnection, setupPeerConnection, closePeerConnection } = usePeerConnection();

    useEffect(() => {
        // Example: Use peerConnection for signaling or data transfer
        if (peerConnection.current) {
            console.log('Peer connection established:', peerConnection.current);
        }

        // Cleanup on unmount
        return () => {
            closePeerConnection(); // Ensure the connection is closed when component unmounts
        };
    }, [peerConnection]);

    return (
        <View>
            <Text>Video Call</Text>
            {/* Additional UI elements for video call */}
        </View>
    );
};

export default VideoCallComponent;
```

### 3. Accessing Peer Connection

You can access the `peerConnection` ref to interact with the connection object directly (e.g., adding tracks, creating offers/answers):

```javascript
if (peerConnection.current) {
    peerConnection.current.addTrack(localStream.getTracks()[0], localStream);
}
```

### 4. Cleanup on Component Unmount

The hook automatically cleans up the peer connection when the component is unmounted or when the peer connection is no longer needed:

```javascript
useEffect(() => {
    return () => {
        closePeerConnection(); // Automatically closes the peer connection on unmount
    };
}, []);
```

## Customization

You can customize the ICE server configuration by passing your own list of STUN/TURN servers:

```javascript
const setupPeerConnection = () => {
    const connection = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:your-custom-stun-server.com:19302' },
            { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'password' },
        ],
    });
    peerConnection.current = connection;
};
```

## Troubleshooting

- **Connection Issues**: If the connection is not being established, check if the STUN server is accessible. If you're behind a strict firewall, consider setting up a TURN server.
- **ICE Candidate Collection**: You may need to listen to the `onicecandidate` event on the `peerConnection` object to handle candidates for establishing the connection.

## Conclusion

With this setup, the `usePeerConnection` hook simplifies the process of managing a WebRTC peer connection. It abstracts the complexity of setting up and cleaning up the peer connection, making it easy to integrate into your React Native application.

--------------------------------------------------------------------------------------------------------------------------------------------

# 2. `useVideoCallPermissions` Video Call Permissions Hook Setup Guide

## Overview
This guide explains how to use the `useVideoCallPermissions` hook to manage the permissions required for a video call in a React Native application. The hook handles requesting and checking permissions for the camera and microphone on both Android and iOS platforms.

## Prerequisites
Before you start using this hook, ensure the following dependencies are installed:

1. **React Native** - For building your mobile application.
2. **react-native-permissions** - A package that simplifies permission management for both iOS and Android in React Native.

### Install Dependencies

To install the required dependencies, run the following command:

```bash
npm install react-native-permissions
```

## How the Hook Works

The `useVideoCallPermissions` hook is responsible for checking and requesting the necessary permissions to use the camera and microphone for video calls. It works across both Android and iOS platforms.

### Code Breakdown

```javascript
import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const useVideoCallPermissions = () => {
    const [permissionsGranted, setPermissionsGranted] = useState(false);

    const checkAndRequestPermissions = async () => {
        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                ]);

                const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
                const micGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
                setPermissionsGranted(cameraGranted && micGranted);
                return cameraGranted && micGranted;
            } else if (Platform.OS === 'ios') {
                const cameraStatus = await check(PERMISSIONS.IOS.CAMERA);
                const micStatus = await check(PERMISSIONS.IOS.MICROPHONE);

                if (cameraStatus !== RESULTS.GRANTED) await request(PERMISSIONS.IOS.CAMERA);
                if (micStatus !== RESULTS.GRANTED) await request(PERMISSIONS.IOS.MICROPHONE);

                const updatedCameraStatus = await check(PERMISSIONS.IOS.CAMERA);
                const updatedMicStatus = await check(PERMISSIONS.IOS.MICROPHONE);

                setPermissionsGranted(
                    updatedCameraStatus === RESULTS.GRANTED && updatedMicStatus === RESULTS.GRANTED
                );
                return updatedCameraStatus === RESULTS.GRANTED && updatedMicStatus === RESULTS.GRANTED;
            }
        } catch (error) {
            console.log('Error checking or requesting permissions:', error);
        }
    };

    useEffect(() => {
        checkAndRequestPermissions();
    }, []);

    return { permissionsGranted, checkAndRequestPermissions };
};

export default useVideoCallPermissions;
```

### Key Features

1. **`permissionsGranted`**: A state variable that stores whether both the camera and microphone permissions are granted (`true` if both are granted, `false` otherwise).
2. **`checkAndRequestPermissions`**: An async function that checks and requests permissions for both the camera and microphone based on the platform. It returns `true` if both permissions are granted, otherwise `false`.
3. **`useEffect`**: The hook calls `checkAndRequestPermissions` automatically when the component using this hook is mounted, ensuring that the permissions are checked and requested at the start.

### Platform-Specific Logic

- **Android**: The `PermissionsAndroid.requestMultiple` function is used to request both the camera and microphone permissions on Android devices.
- **iOS**: The `react-native-permissions` package's `check` and `request` functions are used to check and request camera and microphone permissions.

### Permission Flow

1. **Android**: 
   - Requests camera and microphone permissions.
   - If permissions are granted, `permissionsGranted` is set to `true`.
   - If any permission is denied, it will be set to `false`.

2. **iOS**: 
   - Checks the status of the camera and microphone permissions.
   - Requests the permissions if they are not granted.
   - Sets the state of `permissionsGranted` based on whether both permissions are granted.

## How to Use the Hook

### 1. Import the Hook

To use the hook in your component, import it as shown below:

```javascript
import useVideoCallPermissions from './path-to-your-hook';
```

### 2. Use the Hook in Your Component

You can now use the hook in any functional component to manage the permissions for a video call:

```javascript
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import useVideoCallPermissions from './path-to-your-hook';

const VideoCallComponent = () => {
    const { permissionsGranted, checkAndRequestPermissions } = useVideoCallPermissions();

    useEffect(() => {
        if (!permissionsGranted) {
            console.log('Permissions are not granted. Requesting...');
            checkAndRequestPermissions();
        } else {
            console.log('Permissions granted!');
        }
    }, [permissionsGranted]);

    return (
        <View>
            <Text>{permissionsGranted ? 'Permissions granted!' : 'Permissions not granted.'}</Text>
        </View>
    );
};

export default VideoCallComponent;
```

### 3. Handling Permissions Status

- **When Permissions Are Granted**: If the permissions for the camera and microphone are granted, the component will show that the permissions are granted.
- **When Permissions Are Not Granted**: If the permissions are not granted, the component will prompt the user to request permissions.

### 4. Manually Checking/Requesting Permissions

You can manually check or request permissions by calling the `checkAndRequestPermissions` function:

```javascript
const requestPermissions = async () => {
    const granted = await checkAndRequestPermissions();
    if (granted) {
        console.log('Permissions granted!');
    } else {
        console.log('Permissions denied.');
    }
};
```

## Troubleshooting

- **Permissions Not Being Requested**: If permissions are not being requested, ensure that the app has the correct permissions set in the `AndroidManifest.xml` (for Android) and `Info.plist` (for iOS).
- **Permissions Not Being Granted**: If permissions are not granted, the user may have denied them previously. You can guide the user to manually enable permissions through the device's settings.

### Android (AndroidManifest.xml)

Ensure you have the required permissions in your `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### iOS (Info.plist)

Ensure you have the required permissions in your `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Your app needs camera access for video calls.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Your app needs microphone access for video calls.</string>
```

## Conclusion

The `useVideoCallPermissions` hook simplifies managing the permissions required for video calls in a React Native application. It automatically handles the request process based on the platform and provides a simple interface for checking and requesting camera and microphone permissions.

--------------------------------------------------------------------------------------------------------------------------------------------

# 3. `useWebrtcForVC` WebRTC Video Call Setup Guide

## Overview
This guide provides instructions for setting up and using WebRTC for video calling in a React Native project. The provided hook (`useWebrtcForVC`) manages the necessary functionalities for initiating, accepting, and handling WebRTC video calls, including managing the local and remote video streams and handling microphone and speaker states.

## Prerequisites
Before using the hook in your project, make sure you have the following dependencies installed:

1. **React Native**
2. **react-native-webrtc**: For WebRTC functionalities like obtaining media streams.
3. **react-native-incall-manager**: For managing call behaviors such as keeping the screen on and controlling the speaker.
4. **@react-navigation/native**: For detecting whether the screen is focused.

### Install Dependencies

You can install the required packages by running the following commands:

```bash
npm install react-native-webrtc react-native-incall-manager @react-navigation/native
```

## Files and Structure

The `useWebrtcForVC` hook provides all the functionality to manage a WebRTC call, including:
- **Local Video Stream**
- **Remote Video Stream**
- **Call Connection Status**
- **Microphone and Speaker Toggle**

### Dependencies

- **`useVideoCallPermissions`**: A custom hook to handle video call permission requests.
- **`usePeerConnection`**: A custom hook that manages the peer connection.
- **`mediaDevices` from `react-native-webrtc`**: For accessing media devices like the camera and microphone.
- **`InCallManager` from `react-native-incall-manager`**: For managing in-call settings like the screen and speakerphone behavior.
- **`videoResolutions` from `../utils/helper`**: For managing the video resolution settings.
- **`useIsFocused` from `@react-navigation/native`**: For detecting whether the screen is in focus.

## How to Use

### Import the Hook

```javascript
import { useWebrtcForVC } from './path-to-your-hook';
```

### Use the Hook in Your Component

You can use the `useWebrtcForVC` hook to handle WebRTC-related functionality in your component. Here is an example:

```javascript
const MyComponent = () => {
    const {
        localStream,
        remoteStream,
        callConnected,
        isBigScaleLocalView,
        micEnable,
        speakerEnable,

        onStartCall,
        onCallAccept,
        onViewScaleChange,
        onToggleMic,
        onToggleSpeaker,

        handleAnswer,
        handleCandidate,
    } = useWebrtcForVC({
        onCreateOffer: (offer) => {
            console.log('Offer Created:', offer);
        },
        onAnswerOffer: (answer) => {
            console.log('Answer Received:', answer);
        },
        onIceCandidate: (candidate) => {
            console.log('ICE Candidate:', candidate);
        }
    });

    return (
        <View>
            {/* Display Video Streams */}
            <VideoView stream={localStream} isBigScale={isBigScaleLocalView} />
            <VideoView stream={remoteStream} />

            {/* Call Control Buttons */}
            <Button title="Start Call" onPress={onStartCall} />
            <Button title="Accept Call" onPress={() => onCallAccept(callData)} />

            {/* Toggle Mic and Speaker */}
            <Button title={`Mic ${micEnable ? 'Off' : 'On'}`} onPress={onToggleMic} />
            <Button title={`Speaker ${speakerEnable ? 'Off' : 'On'}`} onPress={onToggleSpeaker} />

            {/* Change Video View Scale */}
            <Button title={`Toggle View`} onPress={onViewScaleChange} />
        </View>
    );
};
```

### Functions

The hook exposes several functions to manage the call:

1. **`onStartCall`**: Starts the video call by requesting necessary permissions and getting the local media stream. It also creates an offer to send to the remote peer.
2. **`onCallAccept`**: Accepts an incoming call by setting the remote description, creating a local stream, and sending an answer to the remote peer.
3. **`onViewScaleChange`**: Toggles the local video view between big and small scale.
4. **`onToggleMic`**: Toggles the microphone on or off for the local stream.
5. **`onToggleSpeaker`**: Toggles the speaker on or off for the remote stream.
6. **`handleAnswer`**: Handles the incoming answer to a call.
7. **`handleCandidate`**: Handles the ICE candidates for the connection.

### State Variables

The hook provides the following state variables to manage the state of the call:

- **`localStream`**: The local media stream.
- **`remoteStream`**: The remote media stream.
- **`callConnected`**: A boolean indicating if the call is connected.
- **`isBigScaleLocalView`**: A boolean indicating whether the local video is displayed in big scale or small scale.
- **`micEnable`**: A boolean indicating whether the microphone is enabled or not.
- **`speakerEnable`**: A boolean indicating whether the speaker is enabled or not.

### Permission Handling

Before starting a call, the hook checks for permissions using the `checkAndRequestPermissions` method from the `useVideoCallPermissions` hook. Ensure you handle permission requests properly in your app.

### Cleanup

The hook provides a cleanup method (`cleanUpStream`) that stops the media stream and resets the state when the component is no longer in focus.

```javascript
useEffect(() => {
    // Clean up resources when the screen is no longer focused
    if (!isFocus) {
        cleanUpStream();
    }
}, [isFocus]);
```

## Customization

You can customize the hook by passing callback functions to handle the creation of the offer, answering the offer, and handling ICE candidates:

```javascript
const { onCreateOffer, onAnswerOffer, onIceCandidate } = useWebrtcForVC({
    onCreateOffer: (offer) => { console.log('Offer Created:', offer); },
    onAnswerOffer: (answer) => { console.log('Answer Received:', answer); },
    onIceCandidate: (candidate) => { console.log('ICE Candidate:', candidate); },
});
```

These functions allow you to manage offer/answer signaling and ICE candidate handling in your app.

## Conclusion

With this setup, you can easily manage WebRTC-based video calls in your React Native application. The hook provides an abstraction for peer connection handling, media stream management, and call control, allowing you to focus on building the UI and other features of your app.

--------------------------------------------------------------------------------------------------------------------------------------------

