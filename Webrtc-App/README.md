# Errors

### 1. [TypeError: Cannot read property 'then' of undefined] (Android : Solution)

- **Go To File**
```
node_modules/react-native/Libraries/ReactNative/AppRegistry.js
```

- **Find**
```
taskProvider()(data)
.then
```

- **Replace With**
```
taskProvider()(data)
?.then
```