import { Alert, Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect } from 'react'
import { RTCView } from 'react-native-webrtc';
import socketServices from '../api/socketServices';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import DraggableView from '../components/DraggableView';
import InCallManager from 'react-native-incall-manager';
import { useFCM } from '../hooks/notification/useFCM';
import { useWebrtcForVC } from '../hooks/video-call/useWebrtcForVC';
import { sockets } from '../api/helper';

const { width, height } = Dimensions.get('screen');

const VideoCallScreen = () => {

    const route = useRoute();
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    const { localUserId, remoteUserId, type } = route?.params;

    const onCreateOffer = (offer) => {
        socketServices.emit(sockets.VideoCall.offer, {
            _from: localUserId,
            _to: remoteUserId,
            offer: offer,
        });
    }

    const onAnswerOffer = (answer) => {
        socketServices.emit(sockets.VideoCall.answer, {
            _from: localUserId,
            _to: remoteUserId,
            answer: answer,
        });
    }

    const onIceCandidate = (candidate) => {
        socketServices.emit(sockets.VideoCall.candidate, {
            _from: localUserId,
            _to: remoteUserId,
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

        onStartCall,
        onCallAccept,
        onViewScaleChange,
        onToggleMic,
        onToggleSpeaker,

        handleAnswer,
        handleCandidate,
        startLocalStream,
    } = useWebrtcForVC({
        onIceCandidate,
        onCreateOffer,
        onAnswerOffer,
    });

    const { fcmToken } = useFCM();

    // Socket
    useEffect(() => {
        if (fcmToken || Platform.OS == 'ios') {
            socketServices.emit(sockets.JoinSocket, {
                userId: localUserId,
                fcmToken: fcmToken ?? '',
            });

            socketServices.on(sockets.VideoCall.answer, handleAnswer);
            socketServices.on(sockets.VideoCall.candidate, handleCandidate);
            socketServices.on(sockets.VideoCall.hangup, handleRemoteHangup);

            if (type == 'callee') {
                startLocalStream();
                InCallManager.stopRingtone();
                socketServices.emit(sockets.VideoCall.acceptCall, {
                    _from: localUserId,
                    _to: remoteUserId,
                });
                socketServices.on(sockets.VideoCall.offer, (data) => { onCallAccept({ offer: data?.offer }) });
            }

            if (type == 'caller') {
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
            }
        }
    }, [fcmToken])

    useEffect(() => {
        if (!isFocused) onHangUp();
    }, [isFocused])

    const onHangUp = () => {
        InCallManager.stopRingtone();
        socketServices.emit(sockets.VideoCall.hangup, { _from: localUserId, _to: remoteUserId });
        if (!callConnected) socketServices.emit(sockets.VideoCall.missCallNotification, { _from: localUserId, _to: remoteUserId });
    }

    const onHangUpPress = () => {
        navigation.canGoBack() && navigation.goBack();
    };

    const handleRemoteHangup = () => {
        try {
            Alert.alert('Call Ended', 'Call has been ended.');
            navigation.canGoBack() && navigation.goBack();
        } catch (error) {
            console.log(`Handle Remote Hangup Error: ${error}`)
        }
    }

    const onSendCallRequest = () => {
        startLocalStream();
        socketServices.emit(sockets.VideoCall.incomingCallNotification, {
            _from: localUserId,
            _to: remoteUserId,
        })
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
                                    onPress={onViewScaleChange}
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