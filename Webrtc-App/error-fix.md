# Errors

### 1. Resolve the automatic call of messaging().setBackgroundMessageHandler

#### Android
- **android/gradle.properties**
```
newArchEnabled=false
```

#### IOS
- **ios/Podfile**
- above linkage = ENV['USE_FRAMEWORKS']
```
ENV['RCT_NEW_ARCH_ENABLED'] = '0'
```

--------------------------------------------------------------------------------------------------------------------------------------------

### 2. TypeError: Cannot read property 'then' of undefined

- **Find**
```
messaging().setBackgroundMessageHandler
```

- **Add return Promise.resolve();**
```
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    // Rest of the code
    return Promise.resolve(); // Add this line
});
```