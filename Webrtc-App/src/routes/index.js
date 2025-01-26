import { createStackNavigator } from '@react-navigation/stack';
import VideoCallScreen from '../screens/VideoCallScreen';
import { Screens } from './helper';
import JoinCallScreen from '../screens/JoinCallScreen';

const Stack = createStackNavigator();

export const NavigationHandler = () => {
    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={Screens.JoinCallScreen}
        >
            <Stack.Screen name={Screens.JoinCallScreen} component={JoinCallScreen} />
            <Stack.Screen name={Screens.VideoCallScreen} component={VideoCallScreen} />
        </Stack.Navigator>
    );
}