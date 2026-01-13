import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './global.css'; // Required for NativeWind Web
import { HomeScreen } from './src/screens/HomeScreen';
import { TryOnScreen } from './src/screens/TryOnScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignupScreen } from './src/screens/SignupScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { AdminDashboardScreen } from './src/screens/AdminDashboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { COLORS } from './src/theme/theme';

export default function App() {
    const [currentScreen, setCurrentScreen] = useState('Login');
    const [token, setToken] = useState(null);

    const handleLoginSuccess = async (accessToken, role) => {
        // Save token to AsyncStorage for API calls
        try {
            await AsyncStorage.setItem('token', accessToken);
            await AsyncStorage.setItem('role', role);
        } catch (error) {
            console.error('Error saving token:', error);
        }

        setToken(accessToken);
        if (role === 'admin') {
            setCurrentScreen('AdminDashboard');
        } else {
            setCurrentScreen('Home');
        }
    };

    const renderScreen = () => {
        switch (currentScreen) {
            case 'Login':
                return <LoginScreen onNavigate={setCurrentScreen} onLoginSuccess={handleLoginSuccess} />;
            case 'Signup':
                return <SignupScreen onNavigate={setCurrentScreen} />;
            case 'ForgotPassword':
                return <ForgotPasswordScreen onNavigate={setCurrentScreen} />;
            case 'Home':
                return <HomeScreen onNavigate={setCurrentScreen} />;
            case 'TryOn':
                return <TryOnScreen onNavigate={setCurrentScreen} />;
            case 'Profile':
                return <ProfileScreen onNavigate={setCurrentScreen} token={token} />;
            case 'AdminDashboard':
                return <AdminDashboardScreen onNavigate={setCurrentScreen} token={token} />;
            case 'Settings':
                return <SettingsScreen onNavigate={setCurrentScreen} token={token} />;
            default:
                return <HomeScreen onNavigate={setCurrentScreen} />;
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="dark" backgroundColor={COLORS.white} />
            <View style={styles.container}>
                {renderScreen()}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
});
