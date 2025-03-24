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
