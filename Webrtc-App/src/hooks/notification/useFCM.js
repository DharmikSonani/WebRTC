import { useState, useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';

export const useFCM = () => {
    const [fcmToken, setFcmToken] = useState('');

    useEffect(() => {
        messaging()
            .requestPermission()
            ?.then(async () => {
                messaging()
                    ?.getToken()
                    ?.then(token => {
                        setFcmToken(token);
                    })
                    ?.catch(error => {
                        console.log('Error getting FCM token:', error);
                    });
            })
            ?.catch(error => {
                console.log('Notification permission denied', error);
            });
    }, []);

    return { fcmToken };
};