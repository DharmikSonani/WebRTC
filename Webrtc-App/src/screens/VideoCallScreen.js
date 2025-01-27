import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import useVideoCallPermissions from '../hooks/useVideoCallPermissions'
import { mediaDevices, RTCView } from 'react-native-webrtc';
import { videoResolutions } from '../utils/helper';
import socketServices from '../api/socketServices';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { usePeerConnection } from '../hooks/usePeerConnection';
import DraggableView from '../components/DraggableView';
import InCallManager from 'react-native-incall-manager';

const { width, height } = Dimensions.get('screen');

const VideoCallScreen = () => {

    const route = useRoute();
    const navigation = useNavigation();
    const isFocus = useIsFocused();
    const { localUserId, remoteUserId } = route?.params;
    const [callConnected, setCallConnected] = useState(false);
    const [isBigScaleLocalView, setIsBigScaleLocalView] = useState(false);

    // Custom Hooks
    const { permissionsGranted, checkAndRequestPermissions } = useVideoCallPermissions();
    const { peerConnection } = usePeerConnection({});

    // Local User
    const [localStream, setLocalStream] = useState(null);

    // Remote User
    const [remoteStream, setRemoteStream] = useState(null);

    // Peer Connection (For Remote Stream)
    useEffect(() => {
        const pc = peerConnection.current;

        pc && (pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            }
        });

        pc && (pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketServices.emit('candidate', {
                    from: localUserId,
                    to: remoteUserId,
                    candidate: event.candidate,
                });
            }
        });
    }, [])

    // Socket
    useEffect(() => {
        socketServices.emit('JoinSocket', localUserId);

        socketServices.on('offer', handleIncomingCall);
        socketServices.on('answer', handleAnswer);
        socketServices.on('candidate', handleCandidate);
        socketServices.on('hangup', handleRemoteHangup);

        return () => {
            socketServices.emit('LeaveSocket', localUserId);
            socketServices.removeListener('offer');
            socketServices.removeListener('answer');
            socketServices.removeListener('candidate');
            socketServices.removeListener('hangup');
        }
    }, [])

    useEffect(() => { !isFocus && cleanUpStream() }, [isFocus])

    const onStartCall = async () => {
        try {
            if (!permissionsGranted) {
                const permission = checkAndRequestPermissions();
                if (!permission) return;
            };

            InCallManager.setSpeakerphoneOn(true);
            InCallManager.start({ media: 'video' });

            const stream = await mediaDevices.getUserMedia({
                audio: true,
                video: videoResolutions.QHD_1440p,
            });
            setLocalStream(stream);
            peerConnection.current && stream.getTracks().length > 0 && stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));
            createOffer();
        } catch (error) {
            console.log('Local Stream error:', error);
        }
    }

    const createOffer = async () => {
        const offer = await peerConnection.current.createOffer();

        await peerConnection.current.setLocalDescription(offer);

        socketServices.emit('offer', {
            from: localUserId,
            to: remoteUserId,
            offer,
        });
    }

    const handleIncomingCall = (data) => {
        Alert.alert('Incoming Call', 'Accept the call?', [
            {
                text: 'Reject',
                onPress: onHangUpPress,
                style: 'cancel',
            },
            {
                text: 'Accept',
                onPress: async () => {
                    try {
                        await peerConnection.current.setRemoteDescription(data.offer);

                        InCallManager.setSpeakerphoneOn(true);
                        InCallManager.start({ media: 'video' });

                        const stream = await mediaDevices.getUserMedia({
                            audio: true,
                            video: videoResolutions.QHD_1440p,
                        });

                        setLocalStream(stream);

                        stream.getTracks().forEach((track) => {
                            peerConnection.current.addTrack(track, stream);
                        });

                        const answer = await peerConnection.current.createAnswer();

                        await peerConnection.current.setLocalDescription(answer);

                        socketServices.emit('answer', {
                            from: localUserId,
                            to: data.from,
                            answer,
                        });

                        setCallConnected(true);
                    } catch (error) {
                        console.log(`Handle Incoming Call Error: ${error}`);
                    }
                },
            },
        ]);
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
            data?.from == remoteUserId && data?.candidate && peerConnection.current.addIceCandidate(data.candidate);
        } catch (error) {
            console.log(`Handle Candidate Error: ${error}`)
        }
    }

    const handleRemoteHangup = () => {
        try {
            Alert.alert('Call Ended', 'Call has been ended.');
            navigation.canGoBack() && navigation.goBack();
        } catch (error) {
            console.log(`Handle Remote Hangup Error: ${error}`)
        }
    }

    const cleanUpStream = async () => {
        stopMediaStream(localStream);
        stopMediaStream(remoteStream);
        setLocalStream(null);
        setRemoteStream(null);
        InCallManager.stop();
    }

    const stopMediaStream = (stream) => { stream && stream.getTracks().forEach((track) => { track.stop() }) };

    const onHangUpPress = () => {
        socketServices.emit('hangup', { from: localUserId, to: remoteUserId });
        navigation.canGoBack() && navigation.goBack();
    };

    const onBigScale = () => {
        setIsBigScaleLocalView(pre => !pre);
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
                                mirror={true}
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
                                    onPress={onBigScale}
                                >
                                    <RTCView
                                        streamURL={isBigScaleLocalView ? remoteStream.toURL() : localStream.toURL()}
                                        style={styles.RTCViewStyle}
                                        objectFit="cover"
                                        mirror={true}
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
                            mirror={true}
                        />
                    </View>
            }

            {
                (remoteStream || localStream) ?
                    <TouchableOpacity style={[styles.Button, styles.HangUpButton]} onPress={onHangUpPress}>
                        <Text style={styles.ButtonText}>Hang Up</Text>
                    </TouchableOpacity>
                    :
                    <TouchableOpacity style={styles.Button} onPress={onStartCall}>
                        <Text style={styles.ButtonText}>Start</Text>
                    </TouchableOpacity>
            }
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
    Button: {
        backgroundColor: '#4CAF50',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 50,
        zIndex: 10,
        alignSelf: 'center',
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