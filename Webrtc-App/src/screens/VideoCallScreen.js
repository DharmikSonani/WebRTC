import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import useVideoCallPermissions from '../hooks/useVideoCallPermissions'
import { mediaDevices, RTCView } from 'react-native-webrtc';
import { videoResolutions } from '../utils/helper';

const VideoCallScreen = () => {

    const { permissionsGranted, checkAndRequestPermissions } = useVideoCallPermissions();
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    const onGetLocalStreamPress = async () => {
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
            setRemoteStream(stream);
        } catch (error) {
            console.log('Local Stream error:', error);
        }
    }

    const onHangUpPress = () => {
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach((track) => track.stop());
            setRemoteStream(null);
        }
    };

    useEffect(() => {
        return () => {
            onHangUpPress();
        }
    }, [])

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
                remoteStream && localStream ?
                    <TouchableOpacity style={[styles.Button, styles.HangUpButton]} onPress={onHangUpPress}>
                        <Text style={styles.ButtonText}>Hang Up</Text>
                    </TouchableOpacity>
                    :
                    <TouchableOpacity style={styles.Button} onPress={onGetLocalStreamPress}>
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
        justifyContent: 'center',
        alignItems: 'center',
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