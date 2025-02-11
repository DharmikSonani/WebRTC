import { useState } from 'react';
import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export const useVideoCallPermissions = () => {
    const [permissionsGranted, setPermissionsGranted] = useState(false);

    const checkAndRequestPermissions = async () => {
        try {
            const cameraPermission = Platform.OS == 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
            const micPermission = Platform.OS == 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO;

            const cameraStatus = await check(cameraPermission);
            const micStatus = await check(micPermission);

            if (cameraStatus !== RESULTS.GRANTED) await request(cameraPermission);
            if (micStatus !== RESULTS.GRANTED) await request(micPermission);

            const updatedCameraStatus = await check(cameraPermission);
            const updatedMicStatus = await check(micPermission);

            setPermissionsGranted(updatedCameraStatus === RESULTS.GRANTED && updatedMicStatus === RESULTS.GRANTED);
            return updatedCameraStatus === RESULTS.GRANTED && updatedMicStatus === RESULTS.GRANTED;
        } catch (error) {
            console.log('Error checking or requesting permissions:', error);
        }
    };

    return { permissionsGranted, checkAndRequestPermissions };
};