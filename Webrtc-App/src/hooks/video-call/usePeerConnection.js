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
