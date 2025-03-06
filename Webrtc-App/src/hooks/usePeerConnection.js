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
                // Below Links are From (TURN Server) : https://xirsys.com/ 
                {
                    urls: "stun:ss-turn1.xirsys.com",
                },
                {
                    username: "s1bcM4nAetHabJlPDjVJpniUbdH6CuZhQnr3mlPCsVV7xmIzP8VXlam0pAONUdBBAAAAAGfJc0BEaGFybWlr",
                    credential: "6fe030a8-fa72-11ef-a4f9-0242ac140004",
                    urls: [
                        "turn:ss-turn1.xirsys.com:80?transport=udp",
                        "turn:ss-turn1.xirsys.com:3478?transport=udp",
                        "turn:ss-turn1.xirsys.com:80?transport=tcp",
                        "turn:ss-turn1.xirsys.com:3478?transport=tcp",
                        "turns:ss-turn1.xirsys.com:443?transport=tcp",
                        "turns:ss-turn1.xirsys.com:5349?transport=tcp"
                    ]
                }
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