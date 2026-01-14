import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Dynamically determine the backend URL
const getBackendUrl = () => {
    // 1. Try to get IP from Expo's debugger host (works for LAN/WiFi switching)
    try {
        const debuggerHost = Constants.expoConfig?.hostUri;
        if (debuggerHost) {
            const ip = debuggerHost.split(':')[0];
            return `http://${ip}:8000`;
        }
    } catch (error) {
        console.log('Failed to detect debugger host, falling back to static IP', error);
    }

    // 2. Fallback to hardcoded IP (useful if debugger is detached or prod build)
    return Platform.select({
        web: 'http://localhost:8000',
        android: 'http://192.168.1.9:8000',
        ios: 'http://192.168.1.9:8000',
        default: 'http://192.168.1.9:8000',
    });
};

export const API_URL = getBackendUrl();
