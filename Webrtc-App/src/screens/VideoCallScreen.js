import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import useVideoCallPermissions from '../hooks/useVideoCallPermissions'
import { mediaDevices, RTCView } from 'react-native-webrtc';
import { videoResolutions } from '../utils/helper';
import socketServices from '../api/socketServices';
import { useNavigation, useRoute } from '@react-navigation/native';
import { usePeerConnection } from '../hooks/usePeerConnection';

const VideoCallScreen = () => {

    const route = useRoute();
    const navigation = useNavigation();
    const { localUserId, remoteUserId } = route?.params;

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
            cleanUpStream();
        }
    }, [])

    const onStartCall = async () => {
        try {
            if (!permissionsGranted) {
                const permission = checkAndRequestPermissions();
                if (!permission) return;
            };
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
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach((track) => track.stop());
            setRemoteStream(null);
        }
    }

    const onHangUpPress = () => {
        cleanUpStream();
        socketServices.emit('hangup', { from: localUserId, to: remoteUserId });
        navigation.canGoBack() && navigation.goBack();
    };

    return (
        <View style={styles.Container}>
            {
                remoteStream && (
                    <View style={styles.RemoteVideo}>
                        <RTCView
                            streamURL={remoteStream.toURL()}
                            style={styles.RTCViewStyle}
                            objectFit="cover"
                            mirror={true}
                        />
                    </View>
                )
            }

            {
                localStream && (
                    <View style={styles.LocalVideo}>
                        <RTCView
                            streamURL={localStream.toURL()}
                            style={styles.RTCViewStyle}
                            objectFit="cover"
                            mirror={true}
                        />
                    </View>
                )
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
    LocalVideo: {
        width: 100,
        aspectRatio: 1 / 1.5,
        position: 'absolute',
        top: 60,
        right: 25,
        borderRadius: 20,
        overflow: 'hidden',
        zIndex: 2,
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