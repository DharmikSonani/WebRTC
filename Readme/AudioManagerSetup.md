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
### 1. Add `AudioDeviceModule.swift`
#### **File:** [`ios/AudioDeviceModule.swift`](https://github.com/DharmikSonani/WebRTC/blob/Audio-Manager/Webrtc-App/ios/AudioDeviceModule.swift)

```swift
//
//  AudioDeviceModule.swift
//  WebRTC
//
//  Created by Dharmik Sonani on 3/25/25.
//

import Foundation
import AVFoundation
import React

@objc(AudioDeviceModule)
class AudioDeviceModule: NSObject, RCTBridgeModule {

  static func moduleName() -> String {
    return "AudioDeviceModule"
  }

  @objc
  func switchAudioOutput(_ deviceType: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    do {
      let audioSession = AVAudioSession.sharedInstance()
      try audioSession.setActive(true)

      switch deviceType.uppercased() {
      case "SPEAKER":
        try audioSession.setCategory(.playAndRecord, mode: .videoChat, options: [.defaultToSpeaker])
        try audioSession.overrideOutputAudioPort(.speaker)

      case "BLUETOOTH":
        let availableInputs = audioSession.availableInputs ?? []
        let bluetoothDevice = availableInputs.first(where: {
            $0.portType == .bluetoothHFP || $0.portType == .bluetoothA2DP
        })
        
        if bluetoothDevice != nil {
          try audioSession.setCategory(.playAndRecord, mode: .videoChat, options: [.allowBluetooth, .allowBluetoothA2DP])
        }

      case "WIRED_HEADSET":
        let availableInputs = audioSession.availableInputs ?? []
        let wiredHeadset = availableInputs.first(where: {
            $0.portType == .headphones || $0.portType == .usbAudio
        })
        
        if let wiredHeadset = wiredHeadset {
          try audioSession.setCategory(.playAndRecord, mode: .videoChat, options: [])
          try audioSession.setPreferredInput(wiredHeadset)
        }

      default:
        try audioSession.setCategory(.playAndRecord, mode: .default, options: [])
      }

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
#### **File:** [`ios/<YourApplicationName>-Bridging-Header.h`](https://github.com/DharmikSonani/WebRTC/blob/Audio-Manager/Webrtc-App/ios/WebrtcApp-Bridging-Header.h)

```objc
//
//  Use this file to import your target's public headers that you would like to expose to Swift.
//

#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"
```

### 3. Create the Objective-C Interface
#### **File:** [`ios/AudioDeviceModule.m`](https://github.com/DharmikSonani/WebRTC/blob/Audio-Manager/Webrtc-App/ios/AudioDeviceModule.m)

```objc
//
//  AudioDeviceModule.m
//  WebRTC
//
//  Created by Dharmik Sonani on 3/25/25.
//

#import <Foundation/Foundation.h>
#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_MODULE(AudioDeviceModule, RCTEventEmitter)
RCT_EXTERN_METHOD(switchAudioOutput:(NSString *)deviceType resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
@end
```

### 4. Rebuild the Project
#### After adding the native module, rebuild the project to apply the changes:

```sh
cd ios && pod install && cd ..
npx react-native run-ios
```

#### Your iOS audio device management module is now set up and ready to use!
#### Trubleshoot: [`Watch Video`](https://youtu.be/9YgzPibLtjA?si=FM7PcdBkSCkBKtoD)

## Usage - useAudioDeviceManager hook
#### Required Dependencies
- **[react-native-device-info](https://www.npmjs.com/package/react-native-device-info)** - Provides device-related information, including detecting connected audio devices such as Bluetooth and wired headsets.

#### Code Implementation [`src/hooks/video-call/useAudioDeviceManager.js`](https://github.com/DharmikSonani/WebRTC/blob/Audio-Manager/Webrtc-App/src/hooks/video-call/useAudioDeviceManager.js)

```javascript
import { useEffect, useState } from 'react';
import { NativeModules } from 'react-native';
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
    const [wiredHeadsetConnected, setWiredHeadsetConnected] = useState(false);

    const [audioOutput, setAudioOutput] = useState(audioDevices.speaker);
    const [availableDevices, setAvailableDevices] = useState([audioDevices.speaker]);

    useEffect(() => {
        const deviceCheckInterval = setInterval(async () => {
            const isBluetoothConnected = await DeviceInfo.isBluetoothHeadphonesConnected();
            const isWiredHeadphonesConnected = await DeviceInfo.isWiredHeadphonesConnected();
            setBluetoothConnected(isBluetoothConnected);
            setWiredHeadsetConnected(isWiredHeadphonesConnected);
        }, 1500);

        return () => { clearInterval(deviceCheckInterval); };
    }, []);

    useEffect(() => { checkAudioDevice(); }, [bluetoothConnected, wiredHeadsetConnected])

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
        checkAudioDevice,
        switchAudioOutput: setAudioOutput,
    };
};
```

#### Explanation
- **State Initialization:**
  - `audioOutput`: Tracks the current active audio output device (speaker, wired headset, or Bluetooth).
  - `availableDevices`: Stores a list of available audio devices that can be switched to.

- **useEffect:**
  - Calls `checkAudioDevice` on mount to detect available audio devices.
  - Checks for Bluetooth device connection every second using `setInterval`.
  - Cleans up listeners and intervals on unmount.

- **Methods:**
  - `checkAudioDevice`: Checks which audio devices are currently connected (Bluetooth, wired headset, or speaker) and updates the available devices.
  - `switchAudioOutput`: Switches the audio output to the selected device using the native module.
