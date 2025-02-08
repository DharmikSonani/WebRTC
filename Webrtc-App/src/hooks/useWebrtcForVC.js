import { useEffect, useState } from "react";
import useVideoCallPermissions from "./useVideoCallPermissions";
import { usePeerConnection } from "./usePeerConnection";
import InCallManager from 'react-native-incall-manager';
import { mediaDevices } from "react-native-webrtc";
import { videoResolutions } from "../utils/helper";
import { useIsFocused } from "@react-navigation/native";

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

    const handleCandidate = (remoteUser, data) => {
        try {
            data?.from == remoteUser && data?.candidate && peerConnection.current.addIceCandidate(data.candidate);
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
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            audioTrack && (audioTrack.enabled = !audioTrack.enabled)
        }
    }

    const onToggleCamera = async () => {
        setCameraEnable(pre => !pre);
        const videoTrack = localStream.getVideoTracks()[0];
        videoTrack && (videoTrack.enabled = !videoTrack.enabled)
    }

    const onSwitchCameraMode = async () => {
        try {
            const videoTrack = localStream?.getVideoTracks()[0];

            if (videoTrack && videoTrack.getSettings().facingMode) {
                await videoTrack.applyConstraints({ facingMode: videoTrack.getSettings().facingMode === 'user' ? 'environment' : 'user', });
            }
        } catch (error) {
            console.log("Error switching camera:", error);
        }
    }

    return {
        localStream,
        remoteStream,
        callConnected,
        isBigScaleLocalView,
        micEnable,
        speakerEnable,
        cameraEnable,

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