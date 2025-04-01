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
