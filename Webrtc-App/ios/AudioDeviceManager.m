#import "React/RCTBridgeModule.h"

@interface RCT_EXTERN_MODULE(AudioDeviceManager, NSObject)
RCT_EXTERN_METHOD(switchAudioOutput:(NSString *)deviceType resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
@end
