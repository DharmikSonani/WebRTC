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
        socketServices.on(sockets.VideoCall.candidate, (data) => { handleCandidate(remoteUserId, data) });
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