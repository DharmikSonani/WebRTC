import { useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter, NativeModules } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const { AudioDeviceModule } = NativeModules;

export const useAudioDeviceManager = () => {
    const audioDevices = {
        speaker: 'SPEAKER',
        wiredHeadset: 'WIRED_HEADSET',
        bluetooth: 'BLUETOOTH',
    };

    const bluetoothConnected = useRef(false);

    const [audioOutput, setAudioOutput] = useState(audioDevices.speaker);
    const [availableDevices, setAvailableDevices] = useState([audioDevices.speaker]);

    useEffect(() => {
        checkAudioDevice();

        const deviceListener = DeviceEventEmitter.addListener(
            'RNDeviceInfo_headphoneConnectionDidChange',
            checkAudioDevice
        );

        const bluetoothCheckInterval = setInterval(async () => {
            const isBluetoothConnected = await DeviceInfo.isBluetoothHeadphonesConnected();
            if (isBluetoothConnected != bluetoothConnected.current) {
                bluetoothConnected.current = isBluetoothConnected;
                checkAudioDevice();
            }
        }, 1000);

        return () => {
            deviceListener.remove();
            clearInterval(bluetoothCheckInterval);
        };
    }, []);

    const checkAudioDevice = async () => {
        const isBluetoothConnected = await DeviceInfo.isBluetoothHeadphonesConnected();
        const isWiredHeadsetConnected = await DeviceInfo.isWiredHeadphonesConnected();

        let devices = [audioDevices.speaker];

        if (isBluetoothConnected) {
            devices.push(audioDevices.bluetooth);
        }
        if (isWiredHeadsetConnected) {
            devices.push(audioDevices.wiredHeadset);
        }

        setAvailableDevices(devices);

        if (isBluetoothConnected) {
            switchAudioOutput(audioDevices.bluetooth);
        } else if (isWiredHeadsetConnected) {
            switchAudioOutput(audioDevices.wiredHeadset);
        } else {
            switchAudioOutput(audioDevices.speaker);
        }
    };

    const switchAudioOutput = async (device) => {
        if (device != audioOutput) {
            const result = await AudioDeviceModule.switchAudioOutput(device);
            setAudioOutput(result);
        }
    };

    return {
        audioOutput,
        availableDevices,
        switchAudioOutput,
    };
};
