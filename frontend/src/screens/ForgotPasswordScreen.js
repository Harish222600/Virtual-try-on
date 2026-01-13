import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { COLORS } from '../theme/theme';
import { verifyEmail, resetPasswordDirect } from '../services/auth';

export const ForgotPasswordScreen = ({ onNavigate }) => {
    const [step, setStep] = useState(1); // 1: Email verification, 2: Password reset
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleVerifyEmail = async () => {
        if (!email) {
            setError('Please enter your email');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await verifyEmail(email);
            setStep(2); // Move to password reset step
            setError(''); // Clear any previous errors
        } catch (err) {
            // Display specific error message
            const errorMessage = err.message || 'Unable to verify email. Please try again.';
            setError(errorMessage);
            // Don't show alert for errors, just display in the error text
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            await resetPasswordDirect(email, newPassword, confirmPassword);
            // Show success message
            setSuccessMessage('Password reset successfully! Redirecting to login...');
            // Navigate to login after showing success message
            setTimeout(() => {
                onNavigate('Login');
            }, 2000); // 2 second delay to show success message
        } catch (err) {
            // Display specific error message
            const errorMessage = err.message || 'Failed to reset password. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };


    return (
        <View style={styles.container}>
            <View style={styles.formContainer}>
                <TouchableOpacity
                    onPress={() => step === 1 ? onNavigate('Login') : setStep(1)}
                    style={styles.backButton}
                >
                    <ArrowLeft size={24} color={COLORS.primary} />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>
                    {step === 1 ? 'Forgot Password' : 'Reset Password'}
                </Text>

                <Text style={styles.subtitle}>
                    {step === 1
                        ? 'Enter your email to verify your account'
                        : 'Enter your new password'}
                </Text>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

                {step === 1 ? (
                    <>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#666"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                        />

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleVerifyEmail}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Verify Email</Text>
                            )}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', padding: 0, paddingHorizontal: 15 }]}>
                            <TextInput
                                style={{ flex: 1, color: '#fff', paddingVertical: 15, fontSize: 16 }}
                                placeholder="New Password"
                                placeholderTextColor="#666"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showNewPassword}
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                {showNewPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', padding: 0, paddingHorizontal: 15 }]}>
                            <TextInput
                                style={{ flex: 1, color: '#fff', paddingVertical: 15, fontSize: 16 }}
                                placeholder="Confirm Password"
                                placeholderTextColor="#666"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleResetPassword}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Reset Password</Text>
                            )}
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: COLORS.background,
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
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backText: {
        color: COLORS.primary,
        fontSize: 16,
        marginLeft: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#999',
        marginBottom: 30,
        textAlign: 'center',
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
        marginTop: 10,
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
    successText: {
        color: '#4CAF50',
        marginBottom: 15,
        textAlign: 'center',
        fontWeight: '600',
    },
});
