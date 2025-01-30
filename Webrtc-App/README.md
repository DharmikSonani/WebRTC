# Errors

## [TypeError: Cannot read property 'then' of undefined] (Android : Solution)

### File : node_modules/react-native/Libraries/ReactNative/AppRegistry.js
    - Find : taskProvider()(data)
      .then
    - Replace with : taskProvider()(data)
      ?.then