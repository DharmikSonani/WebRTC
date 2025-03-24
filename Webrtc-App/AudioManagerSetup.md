## Audio Device Management for Video Calls

This section explains the setup and implementation for managing audio devices in your application using WebRTC.

### Native Setup

#### Required Dependencies
- **[react-native-device-info](https://www.npmjs.com/package/react-native-device-info)** - Provides device-related information, including detecting connected audio devices such as Bluetooth and wired headsets.

#### Code Implementation [`src/hooks/video-call/useAudioDeviceManager.js`](https://github.com/DharmikSonani/WebRTC/blob/Audio-Manager/Webrtc-App/src/hooks/video-call/useAudioDeviceManager.js)

```javascript
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
        const result = await AudioDeviceModule.switchAudioOutput(device);
        setAudioOutput(result);
    };

    return {
        audioOutput,
        availableDevices,
        switchAudioOutput,
    };
};
```

#### Explanation
- **State Initialization:**
  - `audioOutput`: Tracks the current active audio output device (speaker, wired headset, or Bluetooth).
  - `availableDevices`: Stores a list of available audio devices that can be switched to.

- **useEffect:**
  - Calls `checkAudioDevice` on mount to detect available audio devices.
  - Listens for changes in wired headset connection using `DeviceEventEmitter`.
  - Checks for Bluetooth device connection every second using `setInterval`.
  - Cleans up listeners and intervals on unmount.

- **Methods:**
  - `checkAudioDevice`: Checks which audio devices are currently connected (Bluetooth, wired headset, or speaker) and updates the available devices.
  - `switchAudioOutput`: Switches the audio output to the selected device using the native module.