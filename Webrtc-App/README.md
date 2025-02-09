# WebRTC Video Call App

## Frontend Setup

This document outlines the setup and implementation of the frontend for the WebRTC-based video calling application.

### Required Dependencies

- [react-native-webrtc](https://github.com/react-native-webrtc/react-native-webrtc) - WebRTC implementation for React Native
- [socket.io-client](https://www.npmjs.com/package/socket.io-client) - Client-side WebSocket library
- [react-native-incall-manager](https://github.com/react-native-webrtc/react-native-incall-manager) - Manages audio/video call settings
- [react-native-permissions](https://www.npmjs.com/package/react-native-permissions) - Handles runtime permissions for accessing the microphone and camera on both Android and iOS

### Code Implementation

#### File: `src/hooks/useVideoCallPermissions.js`
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
                return cameraGranted && micGranted
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

#### File: `src/hooks/usePeerConnection.js`
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

#### File: `src/hooks/useWebrtcForVC.js`
```javascript
import { useEffect, useState } from "react";
import useVideoCallPermissions from "./useVideoCallPermissions";
import { usePeerConnection } from "./usePeerConnection";
import InCallManager from 'react-native-incall-manager';
import { mediaDevices } from "react-native-webrtc";
import { useIsFocused } from "@react-navigation/native";

const videoResolutions = {
    SD_360p: {
        mandatory: {
            minWidth: 640,
            minHeight: 360,
            minFrameRate: 15,
        },
    },
    HD_720p: {
        mandatory: {
            minWidth: 1280,
            minHeight: 720,
            minFrameRate: 30,
        },
    },
    FHD_1080p: {
        mandatory: {
            minWidth: 1920,
            minHeight: 1080,
            minFrameRate: 30,
        },
    },
    QHD_1440p: {
        mandatory: {
            minWidth: 2560,
            minHeight: 1440,
            minFrameRate: 60,
        },
    },
    UHD_4K: {
        mandatory: {
            minWidth: 3840,
            minHeight: 2160,
            minFrameRate: 60,
        },
    },
    UHD_8K: {
        mandatory: {
            minWidth: 7680,
            minHeight: 4320,
            minFrameRate: 60,
        },
    },
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
    const [localStream, setLocalStream] = useState(null); // Local User
    const [remoteStream, setRemoteStream] = useState(null); // Remote User
    const [callConnected, setCallConnected] = useState(false);
    const [isBigScaleLocalView, setIsBigScaleLocalView] = useState(false);
    const [micEnable, setMicEnable] = useState(true);
    const [speakerEnable, setSpeakerEnable] = useState(true);
    const [cameraEnable, setCameraEnable] = useState(true);
    const [frontCameraMode, setFrontCameraMode] = useState(true);

    // useEffect
    useEffect(() => {
        // Peer Connection (For Remote Stream)
        const pc = peerConnection.current;
        if (pc && pc != null) {
            pc.ontrack = (event) => { event.streams && event.streams[0] && setRemoteStream(event.streams[0]) }
            pc.onicecandidate = (event) => { event.candidate && onIceCandidate(event.candidate) }
            pc.oniceconnectionstatechange = () => { console.log('ICE Connection State:', pc.iceConnectionState); }
            pc.onconnectionstatechange = () => { console.log('Connection State:', pc.connectionState); }
            pc.onsignalingstatechange = () => { console.log('Signaling State:', pc.signalingState); }
        }
    }, [])

    useEffect(() => { !isFocus && cleanUpStream() }, [isFocus])

    // Caller (Make)
    const onStartCall = async () => {
        try {
            if (!permissionsGranted) {
                const permission = checkAndRequestPermissions();
                if (!permission) return;
            };

            InCallManager.setKeepScreenOn(true);
            InCallManager.setSpeakerphoneOn(true);
            InCallManager.start({ media: 'video' });

            const stream = await mediaDevices.getUserMedia({
                audio: true,
                video: videoResolutions.UHD_8K,
            });
            setLocalStream(stream);
            peerConnection.current && stream.getTracks().length > 0 && stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));
            const offer = await peerConnection.current.createOffer();

            await peerConnection.current.setLocalDescription(offer);

            onCreateOffer(offer);
        } catch (error) {
            console.log('Local Stream error:', error);
        }
    }

    const handleAnswer = async (data) => {
        try {
            await peerConnection.current.setRemoteDescription(data.answer);
            setCallConnected(true);
        } catch (error) {
            console.log(`Handle Answer Error: ${error}`)
        }
    }

    const handleCandidate = (data) => {
        try {
            data?.candidate && peerConnection.current.addIceCandidate(data.candidate);
        } catch (error) {
            console.log(`Handle Candidate Error: ${error}`)
        }
    }

    // Callee (Receive)
    const onCallAccept = async (data) => {
        try {
            await peerConnection.current.setRemoteDescription(data.offer);

            InCallManager.setSpeakerphoneOn(true);
            InCallManager.setKeepScreenOn(true);
            InCallManager.start({ media: 'video' });

            const stream = await mediaDevices.getUserMedia({
                audio: true,
                video: videoResolutions.UHD_8K,
            });

            setLocalStream(stream);

            stream.getTracks().forEach((track) => {
                peerConnection.current.addTrack(track, stream);
            });

            const answer = await peerConnection.current.createAnswer();

            await peerConnection.current.setLocalDescription(answer);

            onAnswerOffer(answer);

            setCallConnected(true);
        } catch (error) {
            console.log(`Incoming Call Error: ${error}`);
        }
    }

    // Resource Method
    const cleanUpStream = async () => {
        stopMediaStream(localStream);
        stopMediaStream(remoteStream);
        setLocalStream(null);
        setRemoteStream(null);
        InCallManager.setKeepScreenOn(false);
        InCallManager.stop();
    }

    const stopMediaStream = (stream) => { stream && stream.getTracks().forEach((track) => { track.stop() }) };

    const onViewScaleChange = () => { setIsBigScaleLocalView(pre => !pre) }

    const onToggleMic = () => {
        setMicEnable(pre => !pre);
        toggleAudio(localStream);
    }

    const onToggleSpeaker = () => {
        setSpeakerEnable(pre => !pre);
        toggleAudio(remoteStream);
    }

    const toggleAudio = (stream) => {
        if (stream) stream?.getAudioTracks()?.forEach(track => { track.enabled = !track.enabled });
    }

    const onToggleCamera = async () => {
        setCameraEnable(pre => !pre);
        if (localStream) localStream?.getVideoTracks()?.forEach(track => { track.enabled = !track.enabled });
    }

    const onSwitchCameraMode = async () => {
        if (localStream) {
            localStream?.getVideoTracks()?.forEach(track => { track._switchCamera(); })
            if (cameraEnable) setFrontCameraMode(pre => !pre);
        };
    }

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
    }
}
```

#### File: `src/screens/VideoCallScreen.js`
```javascript
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect } from 'react'
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

    // Socket
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
        }
    }, [])

    const onHangUpPress = () => {
        InCallManager.stopRingtone();
        socketServices.emit(sockets.VideoCall.hangup, { from: localUserId, to: remoteUserId });
        navigation.canGoBack() && navigation.goBack();
    };

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

export default VideoCallScreen

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
})
```