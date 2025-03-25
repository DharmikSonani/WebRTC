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
