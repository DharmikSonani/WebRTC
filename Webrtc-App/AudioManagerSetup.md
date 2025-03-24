# Audio Device Management for Video Calls

This section explains the setup and implementation for managing audio devices in your application using WebRTC.

## Android Setup (Required)

This section explains how to set up and integrate the `AudioDeviceModule` for managing audio output devices natively in an Android application.

### 1. Add following permissions in menifest file
#### **File:** [`android/app/src/main/AndroidManifest.xml`](https://github.com/DharmikSonani/WebRTC/blob/Audio-Manager/Webrtc-App/android/app/src/main/AndroidManifest.xml)

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-feature android:name="android.hardware.audio.output" />
    <uses-feature android:name="android.hardware.microphone" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
</manifest>
```

### 2. Create the Native Module
#### **File:** [`android/app/src/main/java/com/<package-name>/AudioDeviceModule.kt`](https://github.com/DharmikSonani/WebRTC/blob/Audio-Manager/Webrtc-App/android/app/src/main/java/com/webrtcapp/AudioDeviceModule.kt)

```kotlin
package com.<package-name>

import android.content.Context
import android.media.AudioManager
import android.util.Log
import com.facebook.react.bridge.*

class AudioDeviceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val audioManager: AudioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    override fun getName(): String {
        return "AudioDeviceModule"
    }

    @ReactMethod
    fun switchAudioOutput(deviceType: String, promise: Promise) {
        try {
            when (deviceType) {
                "SPEAKER" -> {
                    audioManager.isSpeakerphoneOn = true
                    audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
                }
                "BLUETOOTH" -> {
                    audioManager.startBluetoothSco()
                    audioManager.isBluetoothScoOn = true
                }
                "WIRED_HEADSET" -> {
                    audioManager.isSpeakerphoneOn = false
                    audioManager.stopBluetoothSco()
                    audioManager.isBluetoothScoOn = false
                    audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
                }
                else -> {
                    audioManager.mode = AudioManager.MODE_NORMAL
                }
            }
            promise.resolve("$deviceType")
        } catch (e: Exception) {
            promise.reject("AUDIO_ERROR", "Failed to switch audio: ${e.message}")
        }
    }
}
```

### 3. Create the React Package
#### **File:** [`android/app/src/main/java/com/<package-name>/AudioDevicePackage.kt`](https://github.com/DharmikSonani/WebRTC/blob/Audio-Manager/Webrtc-App/android/app/src/main/java/com/webrtcapp/AudioDevicePackage.kt)

```kotlin
package com.<package-name>

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class AudioDevicePackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(AudioDeviceModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
```

### 4. Register the Package in `MainApplication.kt`
#### **File:** [`android/app/src/main/java/com/<package-name>/MainApplication.kt`](https://github.com/DharmikSonani/WebRTC/blob/Audio-Manager/Webrtc-App/android/app/src/main/java/com/webrtcapp/MainApplication.kt)

Modify the `MainApplication.kt` file to include the `AudioDevicePackage`.

```kotlin
class MainApplication : Application(), ReactApplication {
    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    add(AudioDevicePackage()) // Add this line For Audio Device Manager
                }
        }
}
```

### 5. Rebuild the Project
After adding the native module, rebuild the project to apply the changes:

```sh
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

## iOS Setup (Required)

### Create the Audio Device Manager Module
### 1. Add `AudioDeviceManager.swift`
##### Create a new file at `ios/AudioDeviceManager.swift` and add the following code:

```swift
import AVFoundation
import React

@objc(AudioDeviceManager)
class AudioDeviceManager: NSObject, RCTBridgeModule {
  
  static func moduleName() -> String {
    return "AudioDeviceManager"
  }
  
  @objc
  func switchAudioOutput(_ deviceType: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    do {
      let audioSession = AVAudioSession.sharedInstance()
      
      try audioSession.setActive(true)
      
      switch deviceType {
      case "SPEAKER":
        try audioSession.overrideOutputAudioPort(.speaker)
        try audioSession.setCategory(.playAndRecord, mode: .videoChat, options: [.defaultToSpeaker])
        
      case "BLUETOOTH":
        let availableRoutes = audioSession.currentRoute.outputs
        let bluetoothRoutes = availableRoutes.filter { $0.portType == .bluetoothA2DP || $0.portType == .bluetoothHFP }
        
        if !bluetoothRoutes.isEmpty {
          try audioSession.setCategory(.playAndRecord, mode: .videoChat, options: [.allowBluetooth, .allowBluetoothA2DP])
        }
        
      case "WIRED_HEADSET":
        try audioSession.setCategory(.playAndRecord, mode: .videoChat, options: [])
        
      default:
        try audioSession.setCategory(.playAndRecord, mode: .default, options: [])
      }
      
      try audioSession.setActive(true)
      resolver("\(deviceType)")
      
    } catch let error {
      rejecter("AUDIO_ERROR", "Failed to switch audio: \(error.localizedDescription)", error)
    }
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
```

### 2. Create the Bridging Header
##### Create a file named `ios/<YourApplicationName>-Bridging-Header.h` and add:

```objc
#import "React/RCTBridgeModule.h"
```

### 3. Create the Objective-C Interface
##### Create a file named `ios/AudioDeviceManager.m` and add:

```objc
#import "React/RCTBridgeModule.h"

@interface RCT_EXTERN_MODULE(AudioDeviceManager, NSObject)
RCT_EXTERN_METHOD(switchAudioOutput:(NSString *)deviceType resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
@end
```

### 4. Rebuild the Project
##### After adding the native module, rebuild the project to apply the changes:

```sh
cd ios && pod install && cd ..
npx react-native run-ios
```

##### Your iOS audio device management module is now set up and ready to use!

## Usage - useAudioDeviceManager hook
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