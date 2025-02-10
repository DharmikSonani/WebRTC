# WebRTC Video Call App

## Frontend Setup

This document outlines the setup and implementation of the frontend for the WebRTC-based video calling application.

### Required Dependencies

- [react-native-webrtc](https://github.com/react-native-webrtc/react-native-webrtc) - WebRTC implementation for React Native
- [socket.io-client](https://www.npmjs.com/package/socket.io-client) - Client-side WebSocket library
- [react-native-incall-manager](https://github.com/react-native-webrtc/react-native-incall-manager) - Manages audio/video call settings
- [react-native-permissions](https://www.npmjs.com/package/react-native-permissions) - Handles runtime permissions for accessing the microphone and camera on both Android and iOS

------

### 1. Frontend Permissions Setup

This section explains the setup and implementation of handling video call permissions in the WebRTC app.

#### Required Dependencies
- **[react-native-permissions](https://www.npmjs.com/package/react-native-permissions)** - To manage and request permissions for camera and microphone.

#### Required Permissions Setup : Android (AndroidManifest.xml)

Ensure you have the necessary permissions in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

#### Required Permissions Setup : iOS (Info.plist)

Add the following to `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Your app needs camera access for video calls.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Your app needs microphone access for video calls.</string>
```

#### Code Implementation [`src/hooks/useVideoCallPermissions.js`](https://github.com/DharmikSonani/WebRTC/blob/Push-Notification/Webrtc-App/src/hooks/video-call/useVideoCallPermissions.js)
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

#### Explanation
- **State Initialization:** 
  - `permissionsGranted`: Tracks whether the camera and microphone permissions are granted. Initially set to `false`.

- **`checkAndRequestPermissions` Function:** 
  - **Android:** 
    - Requests both `CAMERA` and `RECORD_AUDIO` permissions using `PermissionsAndroid.requestMultiple`.
    - Updates `permissionsGranted` based on whether both permissions are granted.
  - **iOS:** 
    - Checks the status of `CAMERA` and `MICROPHONE` permissions using `check`.
    - Requests permissions using `request` if they're not granted.
    - Updates `permissionsGranted` based on whether both permissions are granted.

- **`useEffect`:** 
  - Calls `checkAndRequestPermissions` on component mount to ensure permissions are checked and requested if needed.

- **Return Values:** 
  - Returns `permissionsGranted` (status) and `checkAndRequestPermissions` (function to manually trigger permission checks/requests).

------

### 2. Peer Connection Hook

This section explains the setup and implementation of the WebRTC peer connection in the WebRTC video call app.

#### Required Dependencies
- **[react-native-webrtc](https://github.com/react-native-webrtc/react-native-webrtc)** - For WebRTC functionality such as establishing peer-to-peer connections.

#### Code Implementation [`src/hooks/usePeerConnection.js`](https://github.com/DharmikSonani/WebRTC/blob/Push-Notification/Webrtc-App/src/hooks/video-call/usePeerConnection.js)
```javascript
import { useEffect, useRef } from 'react';
import { RTCPeerConnection } from 'react-native-webrtc';

export const usePeerConnection = () => {
    const peerConnection = useRef(null);

    useEffect(() => {
        setupPeerConnection();
        return () => { closePeerConnection(); };
    }, []);

    // Setup Peer Connection
    const setupPeerConnection = () => {
        // Only Work for same network provider
        const connection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: 'stun:stun.l.google.com:19302',
                },
                {
                    urls: 'stun:stun1.l.google.com:19302',
                },
                {
                    urls: 'stun:stun2.l.google.com:19302',
                },
                {
                    urls: 'stun:stun3.l.google.com:19302',
                },
                {
                    urls: 'stun:stun4.l.google.com:19302',
                },
            ],
        });

        peerConnection.current = connection;
    };

    // Close Peer Connection
    const closePeerConnection = () => {
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
    };

    return {
        peerConnection,
        setupPeerConnection,
        closePeerConnection,
    };
};
```

#### Explanation

- **State Initialization:** 
  - `peerConnection`: A `useRef` hook is used to store the peer connection object. It persists across renders but does not trigger re-renders.
  
- **`useEffect` Hook:** 
  - Runs `setupPeerConnection` when the component mounts to initialize the WebRTC connection.
  - Cleans up by calling `closePeerConnection` when the component unmounts to properly close the connection.

- **`setupPeerConnection` Function:** 
  - Creates a new `RTCPeerConnection` object using a set of STUN (Session Traversal Utilities for NAT) servers, which help in establishing peer-to-peer connections.
  - These STUN servers are used for ICE (Interactive Connectivity Establishment) to find the best route for peer communication.

- **`closePeerConnection` Function:** 
  - Closes the peer connection if it exists and nullifies the reference to clean up.

- **Return Values:** 
  - Returns `peerConnection` (reference to the peer connection), `setupPeerConnection` (function to set up the peer connection), and `closePeerConnection` (function to close the connection). 

This hook encapsulates the WebRTC peer connection logic and makes it reusable across components that need to manage WebRTC connections.

------

### 3. Firebase Cloud Messaging (FCM) Setup

This section explains the setup and implementation of handling push notifications in the React Native app using Firebase Cloud Messaging (FCM).

#### Required Dependencies
- **[@react-native-firebase/messaging](https://rnfirebase.io/messaging/usage)** - To handle push notifications in the React Native app.

#### Firebase Setup
Before implementing FCM, ensure that Firebase is properly set up in your React Native project:
1. Install Firebase dependencies:
   ```sh
   npm i @react-native-firebase/app @react-native-firebase/messaging
   ```
2. Configure Firebase in your project by adding the necessary Firebase configuration files (`google-services.json` for Android and `GoogleService-Info.plist` for iOS).
3. Enable Firebase Cloud Messaging in the Firebase console.

#### Code Implementation [`src/hooks/notification/useFCM.js`](https://github.com/DharmikSonani/WebRTC/blob/Push-Notification/Webrtc-App/src/hooks/notification/useFCM.js)
```javascript
import { useState, useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';

export const useFCM = () => {
    const [fcmToken, setFcmToken] = useState('');

    useEffect(() => {
        messaging()
            .requestPermission()
            ?.then(async () => {
                messaging()
                    ?.getToken()
                    ?.then(token => {
                        setFcmToken(token);
                    })
                    ?.catch(error => {
                        console.log('Error getting FCM token:', error);
                    });
            })
            ?.catch(error => {
                console.log('Notification permission denied', error);
            });
    }, []);

    return { fcmToken };
};
```

#### Explanation
- **State Initialization:**
  - `fcmToken`: Stores the Firebase Cloud Messaging token. Initially set to an empty string.

- **`useEffect` Hook:**
  - Requests notification permission when the component mounts.
  - If permission is granted, retrieves the FCM token using `messaging().getToken()`.
  - Stores the token in state (`setFcmToken`).
  - Logs errors if the request or token retrieval fails.

- **Return Values:**
  - Returns `fcmToken`, which contains the device's unique push notification token.

#### Additional Considerations
- **Handling Token Refresh:**
  - The FCM token may change over time. To handle token updates, listen for token refresh events:
    ```javascript
    useEffect(() => {
        const unsubscribe = messaging().onTokenRefresh(token => {
            setFcmToken(token);
        });
        return unsubscribe;
    }, []);
    ```
- **Handling Background and Quit State Notifications:**
  - To handle incoming notifications when the app is in the background or killed, set up appropriate listeners using `messaging().onNotificationOpenedApp` and `messaging().setBackgroundMessageHandler`.

This hook simplifies FCM token retrieval and ensures the app has the necessary permissions for push notifications.

------

### 4. Notification Handling Setup

This section explains the setup and implementation of handling notifications in the React Native app using Firebase Cloud Messaging (FCM) and Notifee.

#### Required Dependencies
- **[@react-native-firebase/messaging](https://rnfirebase.io/messaging/usage)** - To manage push notifications.
- **[notifee](https://notifee.app/react-native/docs/overview)** - To handle and display local notifications.

#### Code Implementation [`src/hooks/notification/useNotification.js`](https://github.com/DharmikSonani/WebRTC/blob/Push-Notification/Webrtc-App/src/hooks/notification/useNotification.js)
```javascript
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { useCallNotification } from '../video-call/useCallNotification';
import { Platform } from 'react-native';

export const useNotification = ({
    navigationRef,
}) => {
    var timeoutId = '';

    const clearNotificationByChannelId = async (channelId) => {
        const notifications = await notifee.getDisplayedNotifications();

        const incomingCallNotifications = notifications.filter((notification) => {
            if (Platform.OS == 'android') { return notification.notification.android.channelId == channelId }
            if (Platform.OS == 'ios') { return notification.notification.ios.categoryId == channelId }
        });

        for (const notification of incomingCallNotifications) {
            await notifee.cancelNotification(notification.id);
        }
    }

    const {
        handleIncomingCallNotification,
        handleMissCallNotification,
        handleCallAccept,
        handleCallReject
    } = useCallNotification({
        navigationRef,
        clearIncomingCallNotification: clearNotificationByChannelId,
    });

    const handleNotification = async (remoteMessage) => {
        const data = remoteMessage?.data;

        switch (data?.type) {
            case 'incoming-call':
                await handleIncomingCallNotification(data)
                break;
            case 'miss-call':
                await handleMissCallNotification(data)
                break;
            default:
                break;
        }
    }

    messaging().onMessage((remoteMessage) => {
        handleNotification(remoteMessage);
    });

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

    messaging().setBackgroundMessageHandler((remoteMessage) => {
        handleNotification(remoteMessage);
        return Promise.resolve();
    });

    notifee.onBackgroundEvent(async ({ type, detail }) => {
        if (type === EventType.ACTION_PRESS) {
            if (detail.pressAction?.id === 'accept') {
                if (timeoutId) clearTimeout(timeoutId);
                if (navigationRef?.current?.isReady()) {
                    handleCallAccept(detail.notification?.data, detail.notification?.id);
                } else {
                    timeoutId = setTimeout(() => {
                        handleCallAccept(detail.notification?.data);
                    }, 1000);
                }
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

    const requestNotificationPermission = async () => { await notifee.requestPermission() };

    return { requestNotificationPermission, }
};
```

#### Explanation
- **`clearNotificationByChannelId` Function:**
  - Fetches all displayed notifications and filters them based on channel ID.
  - Cancels notifications that match the channel ID.

- **Handling Different Notification Types:**
  - Uses `handleIncomingCallNotification` for incoming calls.
  - Uses `handleMissCallNotification` for missed calls.
  - Processes notifications using `handleNotification`.

- **Foreground Notification Handling:**
  - Uses `messaging().onMessage` to handle notifications while the app is open.
  - Uses `notifee.onForegroundEvent` to handle notification actions (accept/reject).

- **Background Notification Handling:**
  - Uses `messaging().setBackgroundMessageHandler` for background notifications.
  - Uses `notifee.onBackgroundEvent` to handle notification actions.

- **Requesting Notification Permissions:**
  - Uses `notifee.requestPermission` to request notification permissions.

- **Return Values:**
  - Returns `requestNotificationPermission` to manually request permissions.

This implementation ensures proper handling of notifications across different app states: foreground, background, and app kill mode.

------