import { useEffect, useState } from 'react';
import { DeviceEventEmitter, NativeModules } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import inCallManager from 'react-native-incall-manager';

const { AudioDeviceModule } = NativeModules;

export const useAudioDeviceManager = () => {
    const audioDevices = {
        speaker: 'SPEAKER',
        wiredHeadset: 'WIRED_HEADSET',
        bluetooth: 'BLUETOOTH',
    };

    const [bluetoothConnected, setBluetoothConnected] = useState(false);

    const [audioOutput, setAudioOutput] = useState(audioDevices.speaker);
    const [availableDevices, setAvailableDevices] = useState([audioDevices.speaker]);

    useEffect(() => {
        const deviceListener = DeviceEventEmitter.addListener(
            'RNDeviceInfo_headphoneConnectionDidChange',
            checkAudioDevice
        );

        const bluetoothCheckInterval = setInterval(async () => {
            const isBluetoothConnected = await DeviceInfo.isBluetoothHeadphonesConnected();
            setBluetoothConnected(pre => pre != isBluetoothConnected ? isBluetoothConnected : pre);
        }, 1000);

        return () => {
            deviceListener.remove();
            clearInterval(bluetoothCheckInterval);
        };
    }, []);

    useEffect(() => { checkAudioDevice(); }, [bluetoothConnected])

    useEffect(() => { switchAudioOutput(audioOutput); }, [audioOutput, availableDevices])

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
            setAudioOutput(audioDevices.bluetooth);
        } else if (isWiredHeadsetConnected) {
            setAudioOutput(audioDevices.wiredHeadset);
        } else {
            setAudioOutput(audioDevices.speaker);
        }
    };

    const switchAudioOutput = async (device) => {
        inCallManager.setForceSpeakerphoneOn(device == audioDevices.speaker);
        inCallManager.setSpeakerphoneOn(device == audioDevices.speaker);
        await AudioDeviceModule.switchAudioOutput(device);
    };

    return {
        audioOutput,
        availableDevices,
        switchAudioOutput: setAudioOutput,
    };
};
