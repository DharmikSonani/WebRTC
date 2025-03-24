package com.webrtcapp

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
