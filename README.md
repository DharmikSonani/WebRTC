# WebRTC Video Call App

## Backend Setup - Node JS

This document outlines the setup and implementation of the backend for the WebRTC-based video calling application.

### Required Dependencies

- [Socket.io](https://www.npmjs.com/package/socket.io) - Real-time bidirectional event-based communication

#### Code Implementation : `src/socket/socket.js`
```javascript
const { Server } = require('socket.io');

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join Socket
    socket.on('join-socket', (userID) => {
      console.log(`Join Socket: ${userID}`);
      socket.join(userID);
    });

    // Leave Socket
    socket.on('leave-socket', (userID) => {
      console.log(`Leave Socket: ${userID}`);
      socket.leave(userID);
    });

    // Broadcast offer to peer
    socket.on('offer', (data) => {
      console.log(`Offer : ${JSON.stringify(data)}`)
      io.to(data.to).emit('offer', data);
    });

    // Broadcast answer to peer
    socket.on('answer', (data) => {
      console.log(`Answer : ${JSON.stringify(data)}`)
      io.to(data.to).emit('answer', data);
    });

    // Hangup Call
    socket.on('hangup', (data) => {
      console.log(`Hang Up : ${JSON.stringify(data)}`)
      io.to(data.to).emit('hangup', data);
    });

    // Handle ICE candidate
    socket.on('candidate', (data) => {
      console.log(`Candidate : ${JSON.stringify(data)}`)
      io.to(data.to).emit('candidate', data);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
  return io;

}

module.exports = initializeSocket;
```

#### Explanation
- Establishes a WebSocket connection using `socket.io`.
- Handles joining and leaving of sockets.
- Facilitates WebRTC signaling by emitting `offer`, `answer`, `hangup`, and `candidate` events.
- Cleans up on user disconnect.

------

## Frontend Setup - React Native

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
- **react-native-permissions:** To manage and request permissions for camera and microphone.

#### Code Implementation `src/hooks/useVideoCallPermissions.js`
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

- **Error Handling:** 
  - Logs any errors that occur while checking or requesting permissions.

- **`useEffect`:** 
  - Calls `checkAndRequestPermissions` on component mount to ensure permissions are checked and requested if needed.

- **Return Values:** 
  - Returns `permissionsGranted` (status) and `checkAndRequestPermissions` (function to manually trigger permission checks/requests).

------

### 2. Peer Connection Hook

This section explains the setup and implementation of the WebRTC peer connection in the WebRTC video call app.

#### Required Dependencies
- **react-native-webrtc:** For WebRTC functionality such as establishing peer-to-peer connections.

#### Code Implementation `src/hooks/usePeerConnection.js`
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

### 3. WebRTC Setup for Video Call

This section explains how WebRTC is configured for making and receiving video calls in the WebRTC-based video call app. The hook handles permissions, media streams, peer connections, and call management.

#### Required Dependencies
- **react-native-incall-manager:** Manages the in-call status (such as speakerphone and screen settings).
- **react-native-webrtc:** Provides WebRTC functionalities for media streaming and peer connection.
- **react-navigation:** Used for handling focus state in navigation.
- **useVideoCallPermissions:** Custom hook to manage permissions.
- **usePeerConnection:** Custom hook to manage peer connection.

#### Code Implementation `src/hooks/useWebrtcForVC.js`
```javascript
import { useEffect, useState } from "react";
import useVideoCallPermissions from "./useVideoCallPermissions";
import { usePeerConnection } from "./usePeerConnection";
import InCallManager from 'react-native-incall-manager';
import { mediaDevices } from "react-native-webrtc";
import { useIsFocused } from "@react-navigation/native";

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

    // States and Hooks
    const isFocus = useIsFocused(); // For navigation focus tracking
    const { permissionsGranted, checkAndRequestPermissions } = useVideoCallPermissions();
    const { peerConnection } = usePeerConnection();

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callConnected, setCallConnected] = useState(false);
    const [isBigScaleLocalView, setIsBigScaleLocalView] = useState(false);
    const [micEnable, setMicEnable] = useState(true);
    const [speakerEnable, setSpeakerEnable] = useState(true);
    const [cameraEnable, setCameraEnable] = useState(true);
    const [frontCameraMode, setFrontCameraMode] = useState(true);

    // Handle peer connection states
    useEffect(() => {
        const pc = peerConnection.current;
        if (pc) {
            pc.ontrack = (event) => { setRemoteStream(event.streams[0]); };
            pc.onicecandidate = (event) => { event.candidate && onIceCandidate(event.candidate); };
            pc.oniceconnectionstatechange = () => { console.log('ICE Connection State:', pc.iceConnectionState); };
            pc.onconnectionstatechange = () => { console.log('Connection State:', pc.connectionState); };
            pc.onsignalingstatechange = () => { console.log('Signaling State:', pc.signalingState); };
        }
    }, []);

    // Cleanup when the component loses focus
    useEffect(() => { if (!isFocus) cleanUpStream(); }, [isFocus]);

    // Handle outgoing call (Caller)
    const onStartCall = async () => {
        try {
            if (!permissionsGranted) {
                const permission = await checkAndRequestPermissions();
                if (!permission) return;
            }

            InCallManager.setKeepScreenOn(true);
            InCallManager.setSpeakerphoneOn(true);
            InCallManager.start({ media: 'video' });

            const stream = await mediaDevices.getUserMedia({ audio: true, video: videoResolutions.UHD_8K });
            setLocalStream(stream);

            stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));

            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);

            onCreateOffer(offer);
        } catch (error) {
            console.log('Local Stream error:', error);
        }
    };

    // Handle incoming call (Callee)
    const onCallAccept = async (data) => {
        try {
            await peerConnection.current.setRemoteDescription(data.offer);
            InCallManager.setSpeakerphoneOn(true);
            InCallManager.setKeepScreenOn(true);
            InCallManager.start({ media: 'video' });

            const stream = await mediaDevices.getUserMedia({ audio: true, video: videoResolutions.UHD_8K });
            setLocalStream(stream);

            stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));

            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            onAnswerOffer(answer);
            setCallConnected(true);
        } catch (error) {
            console.log('Incoming Call Error:', error);
        }
    };

    // Answer the call
    const handleAnswer = async (data) => {
        try {
            await peerConnection.current.setRemoteDescription(data.answer);
            setCallConnected(true);
        } catch (error) {
            console.log('Handle Answer Error:', error);
        }
    };

    // Handle ICE candidate
    const handleCandidate = (data) => {
        try {
            data?.candidate && peerConnection.current.addIceCandidate(data.candidate);
        } catch (error) {
            console.log('Handle Candidate Error:', error);
        }
    };

    // Clean up media streams
    const cleanUpStream = async () => {
        stopMediaStream(localStream);
        stopMediaStream(remoteStream);
        setLocalStream(null);
        setRemoteStream(null);
        InCallManager.setKeepScreenOn(false);
        InCallManager.stop();
    };

    const stopMediaStream = (stream) => { stream && stream.getTracks().forEach((track) => track.stop()); };

    // Toggle controls (microphone, speaker, camera)
    const onToggleMic = () => { setMicEnable((prev) => !prev); toggleAudio(localStream); };
    const onToggleSpeaker = () => { setSpeakerEnable((prev) => !prev); toggleAudio(remoteStream); };
    const onToggleCamera = async () => { setCameraEnable((prev) => !prev); toggleVideo(localStream); };
    const onSwitchCameraMode = async () => {
        if (localStream) {
            localStream?.getVideoTracks()?.forEach(track => track._switchCamera());
            setFrontCameraMode((prev) => !prev);
        }
    };

    const toggleAudio = (stream) => { if (stream) stream.getAudioTracks().forEach(track => track.enabled = !track.enabled); };
    const toggleVideo = (stream) => { if (stream) stream.getVideoTracks().forEach(track => track.enabled = !track.enabled); };

    // View scaling for local video
    const onViewScaleChange = () => { setIsBigScaleLocalView((prev) => !prev); };

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
    };
};
```

#### Explanation

- **State Variables:**
  - Manages state for local and remote video streams, call connection status, and video/audio controls like microphone, speaker, and camera.

- **`useEffect` Hooks:**
  - Handles setting up the peer connection and managing states like track changes, ICE candidates, and connection statuses.
  - Cleans up media streams and stops the call when the component loses focus.

- **Peer Connection:**
  - Uses `RTCPeerConnection` to handle signaling, tracks, and media streaming.

- **Media Stream Management:**
  - Manages both local and remote streams using `getUserMedia` to access video/audio and updates `RTCPeerConnection` tracks.

- **Permissions & Call Setup:**
  - Ensures that required permissions (audio/video) are granted before starting the call.
  - Starts the call with media settings and sets up the local peer connection.

- **Call Control:**
  - Includes functions for toggling microphone, speaker, camera, and camera mode, as well as controlling video scaling and switching between front/back cameras.

This hook encapsulates the logic for both initiating and receiving video calls with WebRTC, managing video streams, and controlling call settings.

------
### 4. Video Call Screen Setup

This section explains the setup and implementation of the video call UI in the WebRTC app.

#### Required Dependencies
- **react-native-webrtc:** To handle video and audio streams for WebRTC.
- **react-native-incall-manager:** To manage incoming call sounds (e.g., ringtone).
- **react-navigation:** For navigating between screens.
- **react-native-permissions:** To handle permissions for camera and microphone (if required).

#### Code Implementation `src/screens/VideoCallScreen.js`
```javascript
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect } from 'react';
import { RTCView } from 'react-native-webrtc';
import socketServices from '../api/socketServices';
import { useNavigation, useRoute } from '@react-navigation/native';
import DraggableView from '../components/DraggableView';
import { useWebrtcForVC } from '../hooks/useWebrtcForVC';
import InCallManager from 'react-native-incall-manager';
import { sockets } from '../api/helper';

const { width, height } = Dimensions.get('screen');

const VideoCallScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();

    const { localUserId, remoteUserId } = route?.params;

    // Socket events for video call signaling
    const onCreateOffer = (offer) => {
        socketServices.emit(sockets.VideoCall.offer, {
            from: localUserId,
            to: remoteUserId,
            offer: offer,
        });
    }

    const onAnswerOffer = (answer) => {
        socketServices.emit(sockets.VideoCall.answer, {
            from: localUserId,
            to: remoteUserId,
            answer: answer,
        });
    }

    const onIceCandidate = (candidate) => {
        socketServices.emit(sockets.VideoCall.candidate, {
            from: localUserId,
            to: remoteUserId,
            candidate: candidate,
        });
    }

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
    } = useWebrtcForVC({
        onIceCandidate,
        onCreateOffer,
        onAnswerOffer,
    });

    // Socket communication setup
    useEffect(() => {
        socketServices.emit(sockets.JoinSocket, localUserId);
        socketServices.on(sockets.VideoCall.offer, handleIncomingCall);
        socketServices.on(sockets.VideoCall.answer, handleAnswer);
        socketServices.on(sockets.VideoCall.candidate, handleCandidate);
        socketServices.on(sockets.VideoCall.hangup, handleRemoteHangup);

        return () => {
            socketServices.emit(sockets.LeaveSocket, localUserId);
            socketServices.removeListener(sockets.VideoCall.offer);
            socketServices.removeListener(sockets.VideoCall.answer);
            socketServices.removeListener(sockets.VideoCall.candidate);
            socketServices.removeListener(sockets.VideoCall.hangup);
        };
    }, []);

    // Handle hangup action
    const onHangUpPress = () => {
        InCallManager.stopRingtone();
        socketServices.emit(sockets.VideoCall.hangup, { from: localUserId, to: remoteUserId });
        navigation.canGoBack() && navigation.goBack();
    };

    // Handle incoming call alert
    const handleIncomingCall = (data) => {
        InCallManager.startRingtone();
        Alert.alert('Incoming Call', 'Accept the call?', [
            {
                text: 'Reject',
                onPress: onHangUpPress,
                style: 'cancel',
            },
            {
                text: 'Accept',
                onPress: () => { onCallAccept(data), InCallManager.stopRingtone(); },
            },
        ]);
    }

    // Handle remote user hangup
    const handleRemoteHangup = () => {
        try {
            Alert.alert('Call Ended', 'Call has been ended.');
            navigation.canGoBack() && navigation.goBack();
        } catch (error) {
            console.log(`Handle Remote Hangup Error: ${error}`)
        }
    }

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
                        <TouchableOpacity style={styles.Button} onPress={onStartCall}>
                            <Text style={styles.ButtonText}>Start</Text>
                        </TouchableOpacity>
                }
            </View>
        </View>
    )
}

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

#### Explanation
- **State and Variables:**
  - `localUserId` and `remoteUserId`: Retrieved from the route params to handle signaling between two users.
  - `localStream`, `remoteStream`, `callConnected`: Managed by `useWebrtcForVC` to track media streams and call state.
  - `isBigScaleLocalView`, `micEnable`, `speakerEnable`, `frontCameraMode`: State variables controlling the appearance and functionality of the call (e.g., mirror effect, scaling).
  
- **Socket Communication (`useEffect`):**
  - Emits socket events to join and leave the call room and sets up listeners for incoming call signaling (offer, answer, candidate, hangup).
  - Ensures that the relevant socket listeners are removed when the component unmounts.

- **Video Call Flow:**
  - `onCreateOffer`, `onAnswerOffer`, `onIceCandidate`: Functions to handle WebRTC signaling for offer creation, offer answering, and ICE candidate exchange.
  - `onHangUpPress`: Ends the call by emitting a `hangup` signal and navigating back to the previous screen.
  - `handleIncomingCall`: Handles incoming call notifications, showing an alert for the user to accept or reject the call.
  - `handleRemoteHangup`: Displays an alert when the remote user ends the call.

- **UI Elements:**
  - **RTCView Components:** Display the local and remote video streams using `RTCView`.
  - **Draggable Local View:** The local video view can be dragged around the screen using `DraggableView`.
  - **Call Control Buttons:** Buttons for toggling microphone, speaker, and ending the call. The buttons change their appearance based on the current state (enabled/disabled).

- **Style:** 
  - Custom styles for layout and button design, including a floating local video view and call control buttons at the bottom of the screen.

This file is a complete UI and logic setup for a video call, including signaling, media streaming, and call controls.

------