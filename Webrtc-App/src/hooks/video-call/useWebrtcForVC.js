import { useEffect, useState } from "react";
import InCallManager from 'react-native-incall-manager';
import { mediaDevices } from "react-native-webrtc";
import { videoResolutions } from "../../utils/helper";
import { useIsFocused } from "@react-navigation/native";
import { usePeerConnection } from "./usePeerConnection";
import { useVideoCallPermissions } from "./useVideoCallPermissions";

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

            const stream = localStream != null ? localStream : await mediaDevices.getUserMedia({
                audio: true,
                video: videoResolutions.UHD_8K,
            });

            localStream == null && setLocalStream(stream);

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

            const stream = localStream != null ? localStream : await mediaDevices.getUserMedia({
                audio: true,
                video: videoResolutions.UHD_8K,
            });

            localStream == null && setLocalStream(stream);

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

    const startLocalStream = async () => {
        const stream = await mediaDevices.getUserMedia({
            audio: true,
            video: videoResolutions.UHD_8K,
        });

        setLocalStream(stream);
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
        startLocalStream,
    }
}