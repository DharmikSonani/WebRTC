# WebRTC Video Call App

## Frontend Setup

This document outlines the setup and implementation of the frontend for the WebRTC-based video calling application.

### Required Dependencies

- [react-native-permissions](https://www.npmjs.com/package/react-native-permissions) - Handles runtime permissions for accessing the microphone and camera on both Android and iOS devices.
- [react-native-webrtc](https://github.com/react-native-webrtc/react-native-webrtc) - WebRTC implementation for React Native, used for establishing peer-to-peer video and audio connections.
- [react-native-incall-manager](https://github.com/react-native-webrtc/react-native-incall-manager) - Manages audio/video call settings such as controlling the speakerphone and ringtone during an ongoing call.
- [socket.io-client](https://www.npmjs.com/package/socket.io-client) - Client-side WebSocket library, used for real-time communication via sockets (sending and receiving video call events).
- [socketServices](https://github.com/DharmikSonani/WebRTC/blob/Push-Notification/Webrtc-App/src/api/socketServices.js) - For socket communication and sending video call events.
- [@react-native-firebase/messaging](https://rnfirebase.io/messaging/usage) - Firebase Cloud Messaging (FCM) for handling push notifications related to calls and messages in the app.
- [notifee](https://docs.page/invertase/notifee/react-native/installation) - Manages and displays local notifications for incoming, ongoing, or missed calls.
- [useFCM Hook](https://github.com/DharmikSonani/WebRTC/blob/Push-Notification/Webrtc-App/src/hooks/notification/useFCM.js) - Firebase Cloud Messaging (FCM) for push notifications.

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
import { useState } from 'react';
import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export const useVideoCallPermissions = () => {
    const [permissionsGranted, setPermissionsGranted] = useState(false);

    const checkAndRequestPermissions = async () => {
        try {
            const cameraPermission = Platform.OS == 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
            const micPermission = Platform.OS == 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO;

            const cameraStatus = await check(cameraPermission);
            const micStatus = await check(micPermission);

            if (cameraStatus !== RESULTS.GRANTED) await request(cameraPermission);
            if (micStatus !== RESULTS.GRANTED) await request(micPermission);

            const updatedCameraStatus = await check(cameraPermission);
            const updatedMicStatus = await check(micPermission);

            setPermissionsGranted(updatedCameraStatus === RESULTS.GRANTED && updatedMicStatus === RESULTS.GRANTED);
            return updatedCameraStatus === RESULTS.GRANTED && updatedMicStatus === RESULTS.GRANTED;
        } catch (error) {
            console.log('Error checking or requesting permissions:', error);
        }
    };

    return { permissionsGranted, checkAndRequestPermissions };
};
```

#### Explanation
- **State Initialization:** 
  - `permissionsGranted`: Tracks whether the camera and microphone permissions are granted. Initially set to `false`.

- **`checkAndRequestPermissions` Function:** 
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

### 5. Call Notification Setup

This section explains the setup and implementation of handling call notifications in the WebRTC app.

#### Required Dependencies
- **[react-native-incall-manager](https://github.com/react-native-webrtc/react-native-incall-manager)** - To manage the call ringtone and stop/start ringtone during an incoming or ongoing call.
- **[@notifee/react-native](https://notifee.app/react-native/docs/installation)** - To handle local notifications for incoming and missed calls.
- **[socketServices](https://github.com/DharmikSonani/WebRTC/blob/Push-Notification/Webrtc-App/src/api/socketServices.js)** - For socket communication and sending video call events.

#### Code Implementation [`src/hooks/useCallNotification.js`](https://github.com/DharmikSonani/WebRTC/blob/Push-Notification/Webrtc-App/src/hooks/video-call/useCallNotification.js)
```javascript
import InCallManager from "react-native-incall-manager";
import notifee, { AndroidCategory, AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import socketServices from "../../api/socketServices";
import { Screens } from "../../routes/helper";
import { Platform } from "react-native";
import { sockets } from "../../api/helper";
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const profilePlaceholder = 'https://cdn-icons-png.flaticon.com/512/4433/4433850.png';

// List of screen which you want to avoid for video call
const notAllowedScreensForCalling = [
    Screens.VideoCallScreen,
]

export const useCallNotification = ({
    navigationRef,
    clearIncomingCallNotification = (channelId) => { console.log(`Initial clear incoming call notification: ${channelId}`); }
}) => {

    const handleIncomingCallNotification = async (data) => {
        try {

            InCallManager.stopRingtone();
            InCallManager.startRingtone();

            clearIncomingCallNotification('incoming-call');

            const channelId = await notifee.createChannel({
                id: 'incoming-call',
                name: 'WebRTC',
                lights: false,
                vibration: false,
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
            });

            const { username, profileImage } = data;

            if (Platform.OS == 'ios') {
                await notifee.setNotificationCategories([
                    {
                        id: 'incoming-call',
                        actions: [
                            {
                                title: `Join`,
                                id: 'accept',
                                foreground: true,
                            },
                            {
                                title: `Decline`,
                                id: 'reject',
                            },
                        ],
                    },
                ]);
            }

            await notifee.displayNotification({
                title: username ? username : 'WebRTC',
                body: `📹 Incoming video call`,
                ios: {
                    categoryId: 'incoming-call',
                    // attachments: [
                    //     {
                    //         url: profileImage ? profileImage : profilePlaceholder,
                    //     },
                    // ],
                },
                android: {
                    channelId,
                    importance: AndroidImportance.HIGH,
                    visibility: AndroidVisibility.PUBLIC,
                    showTimestamp: true,
                    category: AndroidCategory.CALL,
                    lightUpScreen: true,
                    autoCancel: false,
                    ongoing: false,
                    smallIcon: 'ic_video_call_icon',
                    largeIcon: profileImage ? profileImage : profilePlaceholder, // User Profile Image
                    timeoutAfter: 1000 * 60, // Swipe notification after ms
                    actions: [
                        {
                            title: `<p style="color: #4CAF50;"><b>Join</b></p>`,
                            pressAction: {
                                id: 'accept',
                                launchActivity: 'default', // Launch app from background or kill mode
                            },
                        },
                        {
                            title: `<p style="color: #F44336;"><b>Decline</b></p>`,
                            pressAction: { id: 'reject' },
                        },
                    ],
                },
                data: data,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const handleMissCallNotification = async (data) => {
        try {

            InCallManager.stopRingtone();

            clearIncomingCallNotification('incoming-call');

            const channelId = await notifee.createChannel({
                id: 'miss-call',
                name: 'WebRTC',
                lights: false,
                vibration: false,
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
            });

            const { username, profileImage } = data;

            await notifee.displayNotification({
                title: username ? username : 'WebRTC',
                body: `Missed video call`,
                android: {
                    channelId,
                    importance: AndroidImportance.HIGH,
                    visibility: AndroidVisibility.PUBLIC,
                    showTimestamp: true,
                    category: AndroidCategory.CALL,
                    largeIcon: profileImage ? profileImage : profilePlaceholder, // User Profile Image
                    lightUpScreen: true,
                    autoCancel: false,
                    ongoing: false,
                },
            });
        } catch (error) {
            console.log(error);
        }
    };

    const handleCallAccept = async (data) => {
        InCallManager.stopRingtone();
        if (data) {
            const { _from, _to } = data;
            if (_from && _to) {
                if (!notAllowedScreensForCalling.includes(navigationRef?.current?.getCurrentRoute()?.name)) {
                    const granted = await checkAndRequestVideoCallPermissions();
                    if (granted) {
                        navigationRef?.current?.navigate(Screens.VideoCallScreen, {
                            localUserId: _to,
                            remoteUserId: _from,
                            type: 'callee',
                        });
                    } else {
                        handleCallReject(data);
                    }
                } else {
                    handleCallReject(data);
                    console.log('Not able to connect.');
                }
            }
        }
    };

    const handleCallReject = (data) => {
        InCallManager.stopRingtone();
        if (data) {
            const { _from, _to } = data;
            !socketServices?.socket?.connected && socketServices.initializeSocket();
            socketServices.emit(sockets.VideoCall.declineCall, { _from: _to, _to: _from });
        }
    };

    const checkAndRequestVideoCallPermissions = async () => {
        try {
            const cameraPermission = Platform.OS == 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
            const micPermission = Platform.OS == 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO;

            const cameraStatus = await check(cameraPermission);
            const micStatus = await check(micPermission);

            if (cameraStatus !== RESULTS.GRANTED) await request(cameraPermission);
            if (micStatus !== RESULTS.GRANTED) await request(micPermission);

            const updatedCameraStatus = await check(cameraPermission);
            const updatedMicStatus = await check(micPermission);

            return updatedCameraStatus === RESULTS.GRANTED && updatedMicStatus === RESULTS.GRANTED;
        } catch (error) {
            console.log('Error checking or requesting permissions:', error);
        }
    };

    return {
        handleIncomingCallNotification,
        handleMissCallNotification,
        handleCallAccept,
        handleCallReject,
    }
}
```

#### Explanation
- **State Initialization:** 
  - No explicit state is used in this hook, but functions to manage incoming call notifications are provided.

- **`handleIncomingCallNotification`:** 
  - Manages incoming call notifications and uses **notifee** to display notifications. It also handles ringtone actions with **InCallManager** and allows user interaction with the notification (Accept or Decline).
  - iOS support for notification categories is included for call actions (Accept and Decline).

- **`handleMissCallNotification`:** 
  - Manages missed call notifications, stopping any active ringtone and displaying a notification using **notifee**.

- **`handleCallAccept`:** 
  - Accepts the incoming call and navigates to the video call screen unless the current screen is not allowed for video calls.

- **`handleCallReject`:** 
  - Rejects the call and emits the call rejection event to the server using **socketServices**.

- **Return Values:** 
  - Returns functions for handling incoming call notifications, missed call notifications, call accept, and call reject actions. 

#### Screens To Avoid
- `notAllowedScreensForCalling`: A list of screens where video calls are not allowed (currently, `VideoCallScreen` is excluded).

------

### 6. WebRTC for Video Call Setup

This section explains the setup and implementation for handling video calls using WebRTC in your application.

#### Required Dependencies
- **[react-native-incall-manager](https://github.com/react-native-webrtc/react-native-incall-manager)** - Manages in-call behaviors such as speakerphone and screen on during a call.
- **[react-native-webrtc](https://github.com/react-native-webrtc/react-native-webrtc)** - Provides WebRTC functionality, allowing peer-to-peer video and audio streaming.
- **[react-navigation](https://reactnavigation.org/docs/getting-started/)** - Used to manage screen focus to handle cleanup of resources when the screen is not in focus.

#### Code Implementation [`src/hooks/video-call/useWebrtcForVC.js`](https://github.com/DharmikSonani/WebRTC/blob/Push-Notification/Webrtc-App/src/hooks/video-call/useWebrtcForVC.js)

```javascript
import { useEffect, useState } from "react";
import InCallManager from 'react-native-incall-manager';
import { mediaDevices } from "react-native-webrtc";
import { useIsFocused } from "@react-navigation/native";
import { usePeerConnection } from "./usePeerConnection";
import { useVideoCallPermissions } from "./useVideoCallPermissions";

const videoResolutions = {
    // Different video resolutions for quality management
    SD_360p: { mandatory: { minWidth: 640, minHeight: 360, minFrameRate: 15 } },
    HD_720p: { mandatory: { minWidth: 1280, minHeight: 720, minFrameRate: 30 } },
    FHD_1080p: { mandatory: { minWidth: 1920, minHeight: 1080, minFrameRate: 30 } },
    QHD_1440p: { mandatory: { minWidth: 2560, minHeight: 1440, minFrameRate: 60 } },
    UHD_4K: { mandatory: { minWidth: 3840, minHeight: 2160, minFrameRate: 60 } },
    UHD_8K: { mandatory: { minWidth: 7680, minHeight: 4320, minFrameRate: 60 } },
};

export const useWebrtcForVC = ({
    onCreateOffer = (offer) => { console.log(`onCreateOffer : ${offer}`); },
    onAnswerOffer = (answer) => { console.log(`onAnswerOffer : ${answer}`); },
    onIceCandidate = (candidate) => { console.log(`onIceCandidate : ${candidate}`); },
}) => {
    // Variables
    const isFocus = useIsFocused();

    // Custom Hooks
    const { permissionsGranted, checkAndRequestPermissions } = useVideoCallPermissions();
    const { peerConnection } = usePeerConnection();

    // State
    const [localStream, setLocalStream] = useState(null); // Local User Stream
    const [remoteStream, setRemoteStream] = useState(null); // Remote User Stream
    const [callConnected, setCallConnected] = useState(false); // Call connection state
    const [isBigScaleLocalView, setIsBigScaleLocalView] = useState(false); // Local View Scale
    const [micEnable, setMicEnable] = useState(true); // Microphone status
    const [speakerEnable, setSpeakerEnable] = useState(true); // Speaker status
    const [cameraEnable, setCameraEnable] = useState(true); // Camera status
    const [frontCameraMode, setFrontCameraMode] = useState(true); // Camera mode (front/back)

    // useEffect
    useEffect(() => {
        const pc = peerConnection.current;
        if (pc) {
            pc.ontrack = (event) => { event.streams && event.streams[0] && setRemoteStream(event.streams[0]) };
            pc.onicecandidate = (event) => { event.candidate && onIceCandidate(event.candidate) };
            pc.oniceconnectionstatechange = () => { console.log('ICE Connection State:', pc.iceConnectionState); };
            pc.onconnectionstatechange = () => { console.log('Connection State:', pc.connectionState); };
            pc.onsignalingstatechange = () => { console.log('Signaling State:', pc.signalingState); };
        }
    }, []);

    useEffect(() => {
        if (!isFocus) cleanUpStream();
    }, [isFocus]);

    // Start Call (Caller)
    const onStartCall = async () => {
        try {
            if (!permissionsGranted) {
                const permission = await checkAndRequestPermissions();
                if (!permission) return;
            };

            InCallManager.setKeepScreenOn(true);
            InCallManager.setSpeakerphoneOn(true);
            InCallManager.start({ media: 'video' });

            const stream = localStream || await mediaDevices.getUserMedia({
                audio: true,
                video: videoResolutions.UHD_8K,
            });

            localStream == null && setLocalStream(stream);
            peerConnection.current && stream.getTracks().forEach(track => peerConnection.current.addTrack(track, stream));

            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);

            onCreateOffer(offer);
        } catch (error) {
            console.log('Local Stream error:', error);
        }
    };

    const handleAnswer = async (data) => {
        try {
            await peerConnection.current.setRemoteDescription(data.answer);
            setCallConnected(true);
        } catch (error) {
            console.log(`Handle Answer Error: ${error}`);
        }
    };

    const handleCandidate = (data) => {
        try {
            data?.candidate && peerConnection.current.addIceCandidate(data.candidate);
        } catch (error) {
            console.log(`Handle Candidate Error: ${error}`);
        }
    };

    // Accept Call (Callee)
    const onCallAccept = async (data) => {
        try {
            if (!permissionsGranted) {
                const permission = await checkAndRequestPermissions();
                if (!permission) return;
            };
            
            await peerConnection.current.setRemoteDescription(data.offer);

            InCallManager.setSpeakerphoneOn(true);
            InCallManager.setKeepScreenOn(true);
            InCallManager.start({ media: 'video' });

            const stream = localStream || await mediaDevices.getUserMedia({
                audio: true,
                video: videoResolutions.UHD_8K,
            });

            localStream == null && setLocalStream(stream);
            stream.getTracks().forEach(track => peerConnection.current.addTrack(track, stream));

            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            onAnswerOffer(answer);
            setCallConnected(true);
        } catch (error) {
            console.log(`Incoming Call Error: ${error}`);
        }
    };

    // Start Local Stream (after permissions granted)
    const startLocalStream = async () => {
        if (!permissionsGranted) {
            const permission = await checkAndRequestPermissions();
            if (!permission) return;
        };

        const stream = await mediaDevices.getUserMedia({
            audio: true,
            video: videoResolutions.UHD_8K,
        });
        setLocalStream(stream);
    };

    // Clean Up Resources (stop streams)
    const cleanUpStream = async () => {
        stopMediaStream(localStream);
        stopMediaStream(remoteStream);
        setLocalStream(null);
        setRemoteStream(null);
        InCallManager.setKeepScreenOn(false);
        InCallManager.stop();
    };

    const stopMediaStream = (stream) => { stream && stream.getTracks().forEach(track => track.stop()); };

    // Handle View Scaling
    const onViewScaleChange = () => { setIsBigScaleLocalView(prev => !prev); };

    // Toggle Audio/Mic & Speaker
    const onToggleMic = () => {
        setMicEnable(prev => !prev);
        toggleAudio(localStream);
    };

    const onToggleSpeaker = () => {
        setSpeakerEnable(prev => !prev);
        toggleAudio(remoteStream);
    };

    // Toggle Camera (Enable/Disable)
    const onToggleCamera = async () => {
        setCameraEnable(prev => !prev);
        if (localStream) localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
    };

    // Switch Camera Mode (Front/Back)
    const onSwitchCameraMode = async () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => track._switchCamera());
            if (cameraEnable) setFrontCameraMode(prev => !prev);
        };
    };

    // Helper function to toggle audio on stream
    const toggleAudio = (stream) => {
        if (stream) {
            stream?.getAudioTracks()?.forEach(track => { track.enabled = !track.enabled });
        }
    };

    return {
        localStream,
        remoteStream,
        callConnected,
        isBigScaleLocalView,
        micEnable,
        speakerEnable,
        cameraEnable,
        frontCameraMode,

        onStartCall,
        onCallAccept,
        onViewScaleChange,
        onToggleMic,
        onToggleSpeaker,
        onToggleCamera,
        onSwitchCameraMode,

        handleAnswer,
        handleCandidate,
        startLocalStream,
    };
};
```

#### Explanation
- **State Initialization:**
  - `localStream`: Tracks the local user's media stream (audio and video).
  - `remoteStream`: Tracks the remote user's media stream (audio and video).
  - `callConnected`: Indicates whether the call is connected.
  - `isBigScaleLocalView`: Determines whether to show a large local video stream.
  - `micEnable`, `speakerEnable`, `cameraEnable`: Track the status of microphone, speaker, and camera.
  - `frontCameraMode`: Tracks whether the front camera is being used.

- **Custom Hooks:**
  - `useVideoCallPermissions`: Manages and requests camera and microphone permissions.
  - `usePeerConnection`: Manages the WebRTC peer connection.

- **useEffect:**
  - Sets up WebRTC peer connection events, such as `ontrack`, `onicecandidate`, and others for managing the call's state.

- **Methods:**
  - `onStartCall`: Starts the video call and makes an offer.
  - `handleAnswer`: Handles answering the incoming video call.
  - `handleCandidate`: Handles ICE candidate events.
  - `onCallAccept`: Accepts an incoming call and starts the video stream.
  - `startLocalStream`: Starts the local video stream.
  - `cleanUpStream`: Cleans up media streams when the user navigates away.
  - `onViewScaleChange`: Toggles local view scaling.
  - `onToggleMic`, `onToggleSpeaker`, `onToggleCamera`: Toggles mic, speaker, and camera on/off.
  - `onSwitchCameraMode`: Switches the camera between front and back.

#### Usage
This hook is designed to manage the complete video call lifecycle, including permissions, stream management, and WebRTC signaling. Use it in your component by calling `useWebrtcForVC()` and passing the necessary callbacks for `onCreateOffer`, `onAnswerOffer`, and `onIceCandidate`.

------

### 7. App Component

This component is the entry point for the application, responsible for setting up global services such as socket connection and notification permissions. It also manages navigation using React Navigation.

#### Required Dependencies:
- **[@react-navigation/native](https://reactnavigation.org/docs/getting-started/)** - Navigation library used for managing app navigation.
- **[socket.io-client](https://www.npmjs.com/package/socket.io-client)** - Socket service for real-time communication.

#### Code Implementation [`src/App.js`](https://github.com/DharmikSonani/WebRTC/blob/Push-Notification/Webrtc-App/src/App.js)

```javascript
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { NavigationHandler } from './routes';
import socketServices from './api/socketServices';
import { useNotification } from './hooks/notification/useNotification';

const navigationRef = createNavigationContainerRef();

// Notification Permission Request
const { requestNotificationPermission } = useNotification({ navigationRef });

const App = () => {

  useEffect(() => {
    // Initialize Socket if not already connected
    if (!socketServices?.socket?.connected) {
      socketServices.initializeSocket();
    }
    // Request for Notification Permissions
    requestNotificationPermission();

    // Cleanup on unmount: Disconnect socket if connected
    return () => { 
      if (socketServices?.socket?.connected) {
        socketServices?.socket?.disconnect();
      }
    }
  }, []);

  return (
    <>
      {/* Hides the status bar and makes it translucent */}
      <StatusBar hidden translucent />
      
      {/* Navigation Container: Manages the app's navigation */}
      <NavigationContainer ref={navigationRef}>
        <NavigationHandler />
      </NavigationContainer>
    </>
  );
};

export default App;
```

#### Explanation:

1. **Navigation Setup:**
   - `createNavigationContainerRef`: Creates a reference for the navigation container, allowing you to control navigation from anywhere in the app.
   - `NavigationContainer`: Wraps the entire app's navigation setup to manage navigation state.
   - `NavigationHandler`: A component (defined in your `routes.js`) that handles routing logic based on the navigation state.

2. **Socket Services:**
   - `socketServices.initializeSocket()`: Initializes the socket connection if it's not already connected.
   - Inside the `useEffect`, the socket is initialized when the app starts, and the cleanup function disconnects it when the app is unmounted to prevent memory leaks and unnecessary connections.

3. **Notification Permissions:**
   - `requestNotificationPermission`: Requests permission to send notifications to the user, defined in the [`useNotification`](https://github.com/DharmikSonani/WebRTC/blob/Push-Notification/Webrtc-App/src/hooks/notification/useNotification.js) custom hook.

4. **StatusBar:**
   - The `StatusBar` component is used to hide the status bar and make it translucent, ensuring that it doesn't interfere with the app's UI.

#### Usage
This file is the root component of your app and integrates the socket service, notification permissions, and navigation management. It should be used as the main entry point in your app’s entry file (e.g., `index.js`).

#### Flow:
- On app load:
  1. It checks if the socket is connected, and if not, it initializes the socket connection.
  2. Requests permission for notifications.
  3. Manages the status bar to be hidden and translucent.

- On cleanup (app unmount):
  1. Disconnects the socket connection if it's active.

------

### 8. **VideoCallScreen Component**

This component represents a video call screen for both the caller and the receiver. It handles the local and remote video streams, call controls (e.g., mic, speaker, hang up), and socket events for a real-time video call experience.

#### Required Dependencies:
- **[react-native-webrtc](https://github.com/react-native-webrtc/react-native-webrtc)** - WebRTC implementation for React Native
- **[socket.io-client](https://www.npmjs.com/package/socket.io-client)** - Client-side WebSocket library
- **[react-native-incall-manager](https://github.com/react-native-webrtc/react-native-incall-manager)** - Manages audio/video call settings
- **[useFCM Hook](https://github.com/DharmikSonani/WebRTC/blob/Push-Notification/Webrtc-App/src/hooks/notification/useFCM.js)** - Firebase Cloud Messaging (FCM) for push notifications.

#### Code Implementation [`src/screens/VideoCallScreen.js`](https://github.com/your-repo/Project-Name/src/screens/VideoCallScreen.js)

```javascript
import { Alert, Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect } from 'react';
import { RTCView } from 'react-native-webrtc';
import socketServices from '../api/socketServices';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import DraggableView from '../components/DraggableView';
import InCallManager from 'react-native-incall-manager';
import { useFCM } from '../hooks/notification/useFCM';
import { useWebrtcForVC } from '../hooks/video-call/useWebrtcForVC';
import { sockets } from '../api/helper';

const { width, height } = Dimensions.get('window');

const VideoCallScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { localUserId, remoteUserId, type } = route?.params;

    const {
        localStream,
        remoteStream,
        callConnected,
        isBigScaleLocalView,
        micEnable,
        speakerEnable,
        frontCameraMode,
        onStartCall,
        onCallAccept,
        onViewScaleChange,
        onToggleMic,
        onToggleSpeaker,
        handleAnswer,
        handleCandidate,
        startLocalStream,
    } = useWebrtcForVC({
        onIceCandidate: (candidate) => socketServices.emit(sockets.VideoCall.candidate, { _from: localUserId, _to: remoteUserId, candidate }),
        onCreateOffer: (offer) => socketServices.emit(sockets.VideoCall.offer, { _from: localUserId, _to: remoteUserId, offer }),
        onAnswerOffer: (answer) => socketServices.emit(sockets.VideoCall.answer, { _from: localUserId, _to: remoteUserId, answer }),
    });

    const { fcmToken } = useFCM();

    // Socket Connection and Event Handlers
    useEffect(() => {
        if (fcmToken || Platform.OS == 'ios') {
            socketServices.emit(sockets.JoinSocket, { userId: localUserId, fcmToken: fcmToken ?? '' });

            socketServices.on(sockets.VideoCall.answer, handleAnswer);
            socketServices.on(sockets.VideoCall.candidate, handleCandidate);
            socketServices.on(sockets.VideoCall.hangup, handleRemoteHangup);

            if (type === 'callee') {
                startLocalStream();
                InCallManager.stopRingtone();
                socketServices.emit(sockets.VideoCall.acceptCall, { _from: localUserId, _to: remoteUserId });
                socketServices.on(sockets.VideoCall.offer, (data) => onCallAccept({ offer: data?.offer }));
            }

            if (type === 'caller') {
                socketServices.on(sockets.VideoCall.acceptCall, onStartCall);
                socketServices.on(sockets.VideoCall.declineCall, handleRemoteHangup);
            }

            return () => {
                socketServices.emit(sockets.LeaveSocket, localUserId);
                socketServices.removeListener(sockets.VideoCall.acceptCall);
                socketServices.removeListener(sockets.VideoCall.declineCall);
                socketServices.removeListener(sockets.VideoCall.offer);
                socketServices.removeListener(sockets.VideoCall.answer);
                socketServices.removeListener(sockets.VideoCall.candidate);
                socketServices.removeListener(sockets.VideoCall.hangup);
            };
        }
    }, [fcmToken]);

    useEffect(() => {
        if (!isFocused) onHangUp();
    }, [isFocused]);

    // Handle Remote Hang Up
    const handleRemoteHangup = () => {
        try {
            Alert.alert('Call Ended', 'Call has been ended.');
            navigation.canGoBack() && navigation.goBack();
        } catch (error) {
            console.log(`Handle Remote Hangup Error: ${error}`);
        }
    };

    // Start the call or initiate incoming call request
    const onSendCallRequest = () => {
        startLocalStream();
        socketServices.emit(sockets.VideoCall.incomingCallNotification, { _from: localUserId, _to: remoteUserId });
    };

    // Hang Up Functionality
    const onHangUp = () => {
        InCallManager.stopRingtone();
        socketServices.emit(sockets.VideoCall.hangup, { _from: localUserId, _to: remoteUserId });
        if (!callConnected) socketServices.emit(sockets.VideoCall.missCallNotification, { _from: localUserId, _to: remoteUserId });
    };

    const onHangUpPress = () => {
        navigation.canGoBack() && navigation.goBack();
    };

    return (
        <View style={styles.Container}>
            {
                (callConnected && localStream && remoteStream) ?
                    <>
                        <View style={styles.RemoteVideo}>
                            <RTCView
                                streamURL={isBigScaleLocalView ? localStream.toURL() : remoteStream.toURL()}
                                style={styles.RTCViewStyle}
                                objectFit="cover"
                                mirror={isBigScaleLocalView ? frontCameraMode : false}
                            />
                        </View>
                        <View style={styles.LocalViewContainer}>
                            <DraggableView
                                x={width}
                                y={height - 140}
                                border={25}
                                bounceHorizontal
                                bounceVertical
                            >
                                <TouchableOpacity
                                    style={styles.LocalVideo}
                                    activeOpacity={1}
                                    onPress={onViewScaleChange}
                                >
                                    <RTCView
                                        streamURL={isBigScaleLocalView ? remoteStream.toURL() : localStream.toURL()}
                                        style={styles.RTCViewStyle}
                                        objectFit="cover"
                                        mirror={isBigScaleLocalView ? false : frontCameraMode}
                                    />
                                </TouchableOpacity>
                            </DraggableView>
                        </View>
                    </>
                    :
                    localStream &&
                    <View style={styles.RemoteVideo}>
                        <RTCView
                            streamURL={localStream.toURL()}
                            style={styles.RTCViewStyle}
                            objectFit="cover"
                            mirror={frontCameraMode}
                        />
                    </View>
            }

            <View style={styles.ButtonContainer}>
                {
                    (remoteStream || localStream) ?
                        <>
                            <TouchableOpacity style={[styles.Button, !speakerEnable && styles.HangUpButton]} onPress={onToggleSpeaker} activeOpacity={1}>
                                <Text style={styles.ButtonText}>{speakerEnable ? 'SE' : 'SD'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.Button, styles.HangUpButton]} onPress={onHangUpPress}>
                                <Text style={styles.ButtonText}>Hang Up</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.Button, !micEnable && styles.HangUpButton]} onPress={onToggleMic} activeOpacity={1}>
                                <Text style={styles.ButtonText}>{micEnable ? 'ME' : 'MD'}</Text>
                            </TouchableOpacity>
                        </>
                        :
                        <TouchableOpacity style={styles.Button} onPress={onSendCallRequest}>
                            <Text style={styles.ButtonText}>Start</Text>
                        </TouchableOpacity>
                }
            </View>
        </View>
    );
};

export default VideoCallScreen;

const styles = StyleSheet.create({
    Container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    RTCViewStyle: {
        width: '100%',
        height: '100%',
    },
    RemoteVideo: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        zIndex: 1,
    },
    LocalViewContainer: {
        width: width,
        marginTop: 45,
        position: 'absolute',
        zIndex: 10,
        padding: 25,
        height: height - 140,
    },
    LocalVideo: {
        width: 100,
        aspectRatio: 1 / 1.5,
        borderRadius: 20,
        overflow: 'hidden',
        zIndex: 100,
    },
    ButtonContainer: {
        zIndex: 10,
        position: 'absolute',
        bottom: 50,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        width: '100%',
    },
    Button: {
        backgroundColor: '#4CAF50',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    HangUpButton: {
        backgroundColor: '#F44336',
    },
    ButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
});
```

#### Explanation:

1. **WebRTC Setup:**
   - **`RTCView`** is used to display local and remote video streams.
   - **`useWebrtcForVC`** custom hook handles setting up local and remote streams, managing microphone and speaker, and other video call functionalities.

2. **Socket Event Handling:**
   - The component listens for socket events related to video call offers, answers, candidates, and hangups. It sends appropriate data through sockets to establish the video call.

3. **UI Elements:**
   - The [`DraggableView`](https://github.com/DharmikSonani/WebRTC/blob/Push-Notification/Webrtc-App/src/components/DraggableView.js) component allows the local video to be draggable on the screen, and its size can be toggled by clicking on it.
   - Buttons for starting the call, toggling microphone/speaker, and hanging up are provided at the bottom of the screen.

4. **Call Management:**
   - Handles incoming call requests, call acceptance, and hangups, with notifications being sent to the server and FCM tokens used for incoming notifications.