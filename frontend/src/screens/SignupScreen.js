import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Image, Platform } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { COLORS } from '../theme/theme';
import { signup } from '../services/auth';
import * as ImagePicker from 'expo-image-picker';

export const SignupScreen = ({ onNavigate }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('');
    const [height, setHeight] = useState('');
    const [bodyType, setBodyType] = useState('');
    const [clothingSize, setClothingSize] = useState('');
    const [jewelryPreference, setJewelryPreference] = useState('');

    const [profileImage, setProfileImage] = useState(null);
    const [tryonImage, setTryonImage] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const pickImage = async (setImage) => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSignup = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            setError('Please fill in all mandatory fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('full_name', fullName);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('confirm_password', confirmPassword);

            if (phone) formData.append('phone', phone);
            if (gender) formData.append('gender', gender);
            if (height) formData.append('height', height);
            if (bodyType) formData.append('body_type', bodyType);
            if (clothingSize) formData.append('clothing_size', clothingSize);
            if (jewelryPreference) formData.append('jewelry_preference', jewelryPreference);

            if (profileImage) {
                if (Platform.OS === 'web') {
                    const response = await fetch(profileImage);
                    const blob = await response.blob();
                    formData.append('profile_image', blob, 'profile_image.jpg');
                } else {
                    const filename = profileImage.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : `image`;

                    formData.append('profile_image', {
                        uri: Platform.OS === 'ios' ? profileImage.replace('file://', '') : profileImage,
                        name: filename,
                        type,
                    });
                }
            }

            if (tryonImage) {
                if (Platform.OS === 'web') {
                    const response = await fetch(tryonImage);
                    const blob = await response.blob();
                    formData.append('tryon_image', blob, 'tryon_image.jpg');
                } else {
                    const filename = tryonImage.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : `image`;

                    formData.append('tryon_image', {
                        uri: Platform.OS === 'ios' ? tryonImage.replace('file://', '') : tryonImage,
                        name: filename,
                        type,
                    });
                }
            }

            const data = await signup(formData);
            console.log('Signup success:', data);
            Alert.alert('Success', 'Account created successfully! Please login.');
            onNavigate('Login');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Signup failed');
            Alert.alert('Error', err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Create Account</Text>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {/* Mandatory Fields */}
                    <Text style={styles.sectionHeader}>Mandatory Details</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name *"
                        placeholderTextColor="#666"
                        value={fullName}
                        onChangeText={setFullName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email *"
                        placeholderTextColor="#666"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', padding: 0, paddingHorizontal: 15 }]}>
                        <TextInput
                            style={{ flex: 1, color: '#fff', paddingVertical: 15, fontSize: 16 }}
                            placeholder="Password *"
                            placeholderTextColor="#666"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', padding: 0, paddingHorizontal: 15 }]}>
                        <TextInput
                            style={{ flex: 1, color: '#fff', paddingVertical: 15, fontSize: 16 }}
                            placeholder="Confirm Password *"
                            placeholderTextColor="#666"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
                        </TouchableOpacity>
                    </View>

                    {/* Optional Fields */}
                    <Text style={styles.sectionHeader}>Optional Details</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Phone Number"
                        placeholderTextColor="#666"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Gender"
                        placeholderTextColor="#666"
                        value={gender}
                        onChangeText={setGender}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Height (cm)"
                        placeholderTextColor="#666"
                        value={height}
                        onChangeText={setHeight}
                        keyboardType="numeric"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Body Type (Slim/Average/Athletic/Plus)"
                        placeholderTextColor="#666"
                        value={bodyType}
                        onChangeText={setBodyType}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Clothing Size"
                        placeholderTextColor="#666"
                        value={clothingSize}
                        onChangeText={setClothingSize}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Jewelry Preference"
                        placeholderTextColor="#666"
                        value={jewelryPreference}
                        onChangeText={setJewelryPreference}
                    />

                    {/* Image Pickers */}
                    <Text style={styles.sectionHeader}>Profile Images</Text>

                    <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage(setProfileImage)}>
                        <Text style={styles.imagePickerText}>{profileImage ? 'Change Profile Photo' : 'Upload Profile Photo'}</Text>
                    </TouchableOpacity>
                    {profileImage && <Image source={{ uri: profileImage }} style={styles.previewImage} />}

                    <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage(setTryonImage)}>
                        <Text style={styles.imagePickerText}>{tryonImage ? 'Change Try-On Image' : 'Upload Try-On Image'}</Text>
                    </TouchableOpacity>
                    {tryonImage && <Image source={{ uri: tryonImage }} style={styles.previewImage} />}

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Sign Up</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => onNavigate('Login')} style={styles.linkButton}>
                        <Text style={styles.linkText}>Already have an account? Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContainer: {
        padding: 20,
    },
    formContainer: {
        backgroundColor: '#1E1E1E',
        padding: 20,
        borderRadius: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
    },
    sectionHeader: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
        marginTop: 15,
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#2A2A2A',
        color: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: COLORS.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#ff4444',
        marginBottom: 15,
        textAlign: 'center',
    },
    linkButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkText: {
        color: COLORS.primary,
        fontSize: 14,
    },
    imagePicker: {
        backgroundColor: '#2A2A2A',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#444',
        borderStyle: 'dashed',
    },
    imagePickerText: {
        color: '#ccc',
    },
    previewImage: {
        width: 100,
        height: 100,
        borderRadius: 10,
        marginBottom: 15,
        alignSelf: 'center',
    },
});
