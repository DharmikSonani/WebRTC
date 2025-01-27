import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { TextInput } from 'react-native-gesture-handler';
import { Screens } from '../routes/helper';

const JoinCallScreen = () => {

    const navigation = useNavigation();
    const [currentUserId, setCurrentUserId] = useState('');
    const [remoteUserId, setRemoteUserId] = useState('');

    const isJoinEnabled = currentUserId && remoteUserId;

    const onJoinPress = () => {
        navigation.navigate(Screens.VideoCallScreen, {
            localUserId: currentUserId.trim(),
            remoteUserId: remoteUserId.trim(),
        });
    }

    return (
        <View style={styles.Container}>
            <Text style={styles.Title}>Join Video Call</Text>

            <TextInput
                style={styles.Input}
                placeholder="Enter Current User ID"
                value={currentUserId}
                onChangeText={setCurrentUserId}
                maxLength={1}
            />

            <TextInput
                style={styles.Input}
                placeholder="Enter Remote User ID"
                value={remoteUserId}
                onChangeText={setRemoteUserId}
                maxLength={1}
            />

            <TouchableOpacity
                style={[styles.JoinButton, isJoinEnabled ? styles.EnabledButton : styles.DisabledButton]}
                onPress={onJoinPress}
                disabled={!isJoinEnabled}
            >
                <Text style={styles.ButtonText}>Join</Text>
            </TouchableOpacity>
        </View>
    )
}

export default JoinCallScreen

const styles = StyleSheet.create({
    Container: {
        flex: 1,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    Title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    Input: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 15,
        marginBottom: 15,
        paddingVertical: 15,
        paddingHorizontal: 15,
        width: '100%',
        color: '#000',
        textAlign: 'center',
    },
    JoinButton: {
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingVertical: 12,
        marginTop: 20,
    },
    EnabledButton: {
        backgroundColor: '#4CAF50',
    },
    DisabledButton: {
        backgroundColor: '#A5D6A7',
    },
    ButtonText: {
        fontSize: 18,
        color: '#FFF',
        fontWeight: 'bold',
    },
})