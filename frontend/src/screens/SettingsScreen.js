import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert, Platform, Modal, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Save, User, Lock, Bell, Palette, Ruler, ScanFace, LogOut, Trash2, Camera, ChevronRight, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONTS } from '../theme/theme';
import { API_URL, getProfile } from '../services/auth';

const OPTIONS = {
    gender: ['Male', 'Female', 'Non-Binary', 'Other', 'Prefer not to say'],
    body_type: ['Slim', 'Athletic', 'Regular', 'Curvy', 'Plus Size', 'Muscular'],
    skin_tone: ['Fair', 'Light', 'Medium', 'Tan', 'Dark', 'Deep'],
    clothing_size: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
    fit_type: ['Slim Fit', 'Regular Fit', 'Loose Fit'],
    jewelry_preference: ['Earrings', 'Necklaces', 'Rings', 'Bracelets', 'Watches', 'Anklets'],
    preferred_categories: ['Casual', 'Formal', 'Party', 'Sports', 'Ethnic', 'Loungewear']
};

const SettingsScreen = ({ onNavigate, token }) => {
    // ... existing user, loading states
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    // Form States
    const [formData, setFormData] = useState({});
    const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' });
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Selection Modal State
    const [selectionModal, setSelectionModal] = useState({
        visible: false,
        title: '',
        options: [],
        field: '',
        multiSelect: false
    });

    useEffect(() => {
        loadUserProfile();
    }, []);

    const pickImage = async (type) => {
        // Request permissions
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "You need to allow access to your photos to upload images.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: type === 'profile' ? [1, 1] : [3, 4], // Square for profile, Portrait for Try-On
            quality: 0.8,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].uri, type);
        }
    };

    const uploadImage = async (uri, type) => {
        setLoading(true);
        const formData = new FormData();

        // Prepare file data
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const fileType = match ? `image/${match[1]}` : `image/jpeg`;

        if (Platform.OS === 'web') {
            try {
                const res = await fetch(uri);
                const blob = await res.blob();
                formData.append('file', blob, filename);
            } catch (error) {
                console.error("Error converting to blob:", error);
                Alert.alert("Error", "Failed to process image");
                setLoading(false);
                return;
            }
        } else {
            formData.append('file', {
                uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                name: filename,
                type: fileType,
            });
        }

        const endpoint = type === 'profile' ? '/users/me/profile-image' : '/users/me/tryon-image';

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // 'Content-Type': 'multipart/form-data', // Fetch handles this automatically with FormData
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                // Update local state
                if (type === 'profile') {
                    setFormData(prev => ({ ...prev, profile_image_url: data.url }));
                } else {
                    setFormData(prev => ({ ...prev, tryon_image_url: data.url }));
                }
                Alert.alert("Success", "Image uploaded successfully");
            } else {
                Alert.alert("Error", "Failed to upload image");
            }
        } catch (error) {
            console.error("Upload error:", error);
            Alert.alert("Error", "Network error during upload");
        } finally {
            setLoading(false);
        }
    };

    const loadUserProfile = async () => {
        try {
            const profile = await getProfile(token);
            setUser(profile);
            setFormData(profile);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to load user settings");
        }
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUser(updatedUser);
                Alert.alert("Success", "Settings updated successfully");
            } else {
                Alert.alert("Error", "Failed to update settings");
            }
        } catch (error) {
            Alert.alert("Error", "Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.new_password !== passwordData.confirm_password) {
            Alert.alert("Error", "New passwords do not match");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/users/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    old_password: passwordData.old_password,
                    new_password: passwordData.new_password
                })
            });

            if (response.ok) {
                Alert.alert("Success", "Password changed successfully");
                setShowPasswordModal(false);
                setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
            } else {
                const err = await response.json();
                Alert.alert("Error", err.detail || "Failed to change password");
            }
        } catch (error) {
            Alert.alert("Error", "Network error");
        }
    };

    const handleDeleteAccount = async () => {
        if (Platform.OS === 'web') {
            if (!confirm("Are you sure? This action is irreversible.")) return;
        }

        try {
            const response = await fetch(`${API_URL}/users/me`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                Alert.alert("Account Deleted", "Your account has been deleted.");
                onNavigate('Login');
            }
        } catch (error) {
            Alert.alert("Error", "Failed to delete account");
        }
    };

    // Helper to update nested fields or simple fields
    const updateField = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const openSelection = (title, field, options, multiSelect = false) => {
        setSelectionModal({
            visible: true,
            title,
            field,
            options,
            multiSelect
        });
    };

    const handleSelect = (option) => {
        const { field, multiSelect } = selectionModal;

        if (multiSelect) {
            let current = formData[field] || [];
            if (current.includes(option)) {
                updateField(field, current.filter(item => item !== option));
            } else {
                updateField(field, [...current, option]);
            }
        } else {
            updateField(field, option);
            setSelectionModal(prev => ({ ...prev, visible: false }));
        }
    };

    const SectionHeader = ({ icon: Icon, title }) => (
        <View style={styles.sectionHeader}>
            <Icon size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );

    const SelectionRow = ({ label, value, options, placeholder, multiSelect = false }) => (
        <View style={styles.rowInput}>
            <Text style={styles.rowLabel}>{label}</Text>
            <TouchableOpacity
                style={styles.selectTrigger}
                onPress={() => openSelection(`Select ${label}`, multiSelect ? (label === 'Clothing Categories' ? 'preferred_categories' : 'jewelry_preference') : options ? Object.keys(OPTIONS).find(key => OPTIONS[key] === options) : label.toLowerCase().replace(' ', '_'), options, multiSelect)}
            >
                <Text style={[styles.selectValue, !value && styles.placeholder]}>
                    {Array.isArray(value) ? (value.length > 0 ? value.join(', ') : placeholder) : (value || placeholder)}
                </Text>
                <ChevronRight size={16} color={COLORS.gray.medium} />
            </TouchableOpacity>
        </View>
    );

    // Explicit row mapping to fix dynamic key issues in the helper above
    const renderSelectRow = (label, fieldKey, optionsKey, placeholder, multi = false) => (
        <View style={styles.rowInput}>
            <Text style={styles.rowLabel}>{label}</Text>
            <TouchableOpacity
                style={styles.selectTrigger}
                onPress={() => openSelection(label, fieldKey, OPTIONS[optionsKey], multi)}
            >
                <Text style={[styles.selectValue, !formData[fieldKey] && styles.placeholder]} numberOfLines={1}>
                    {multi
                        ? (formData[fieldKey]?.length > 0 ? formData[fieldKey].join(', ') : placeholder)
                        : (formData[fieldKey] || placeholder)
                    }
                </Text>
                <ChevronRight size={16} color={COLORS.gray.medium} />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* ... Existing Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => onNavigate('Profile')} style={styles.backButton}>
                    <ChevronLeft size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <TouchableOpacity onPress={handleUpdate} disabled={loading}>
                    <Save size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* 1. Account Settings - KEEP TEXT INPUTS */}
                <View style={styles.section}>
                    <SectionHeader icon={User} title="Account Information" />
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.full_name}
                            onChangeText={t => updateField('full_name', t)}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address (Read Only)</Text>
                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={formData.email}
                            editable={false}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mobile Number</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.phone}
                            onChangeText={t => updateField('phone', t)}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <TouchableOpacity style={styles.rowButton} onPress={() => setShowPasswordModal(true)}>
                        <Lock size={18} color={COLORS.gray.medium} />
                        <Text style={styles.rowButtonText}>Change Password</Text>
                    </TouchableOpacity>

                    <View style={styles.rowSwitch}>
                        <Text style={styles.rowLabel}>Email Notifications</Text>
                        <Switch
                            value={formData.notification_email}
                            onValueChange={v => updateField('notification_email', v)}
                            trackColor={{ false: "#767577", true: COLORS.primary }}
                        />
                    </View>
                    <View style={styles.rowSwitch}>
                        <Text style={styles.rowLabel}>Push Notifications</Text>
                        <Switch
                            value={formData.notification_push}
                            onValueChange={v => updateField('notification_push', v)}
                            trackColor={{ false: "#767577", true: COLORS.primary }}
                        />
                    </View>
                </View>

                {/* 2. Profile & Appearance - USE DROPDOWNS */}
                <View style={styles.section}>
                    <SectionHeader icon={ScanFace} title="Profile & Appearance" />

                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            {formData.profile_image_url ? (
                                <Image source={{ uri: formData.profile_image_url }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                    <User size={40} color={COLORS.gray.medium} />
                                </View>
                            )}
                            <TouchableOpacity style={styles.editBadge} onPress={() => pickImage('profile')}>
                                <Camera size={14} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.avatarHelperText}>Tap icon to change profile photo</Text>
                    </View>

                    {renderSelectRow("Gender", "gender", "gender", "Select Gender")}

                    <View style={styles.rowInput}>
                        <Text style={styles.rowLabel}>Height (cm)</Text>
                        <TextInput
                            style={styles.rowTextInput}
                            value={formData.height ? String(formData.height) : ''}
                            onChangeText={t => updateField('height', parseInt(t) || 0)}
                            keyboardType="numeric"
                            placeholder="0"
                        />
                    </View>

                    {renderSelectRow("Body Type", "body_type", "body_type", "Select Body Type")}
                    {renderSelectRow("Skin Tone", "skin_tone", "skin_tone", "Select Skin Tone")}
                </View>

                {/* 3. Preferences - USE DROPDOWNS */}
                <View style={styles.section}>
                    <SectionHeader icon={Palette} title="Preferences" />

                    {renderSelectRow("Clothing Categories", "preferred_categories", "preferred_categories", "Select Categories", true)}
                    {/* Note: In model I used string for jewelry but usually multi is better. Assuming single string for now based on previous implementation or multi? Let's assume input text was comma separated, so lets try multi select or single text input? 
                    User image showed "Earrings, Necklaces...", likely multi. But DB model said Optional[str]. I will treat it as multi-select string in UI but join with comma for DB if needed, or update model in future. 
                    Wait, my previously updated `models.py` had `jewelry_preference: Optional[str]`. 
                    If I use multi-select UI, I should join them.
                    */}
                    {/* Actually, for simplicity and matching the "Input Text" style of previous implementation which was just a string, I will stick to single select or simple multi-select that saves as string? 
                    Let's save as string "A, B" for compatibility if model is string. 
                    */}
                    {/* I'll treat it as multi-select in UI but join it when saving/Rendering. 
                       Wait, `formData` holds the raw UserResponse. 
                       If `jewelry_preference` is a string in DB, I should split it when opening and join when saving.
                       OR just change model to List[str].
                       For now, let's just use single select to be safe, or multi select but handle the split/join.
                    */}
                    {/* Let's use Multi-select for Jewellery but manually handle string conversion if needed. 
                       Actually, `preferred_categories` IS a List[str] in my new model. 
                       `jewelry_preference` IS `Optional[str]`. 
                       I will make Jewelry a single select for now to avoid Type mismatch errors, or just comma separate it in the text input like before? 
                       User asked for DROPDOWN. So I will make it Single Select or Multi Select. 
                       Let's make it Multi-Select and I will handle array <-> string conversion in `handleSelect`.
                    */}
                    {/* For safer implementation given current state: Jewelry -> Single Select from a list. Categories -> Multi Select. */}
                    {renderSelectRow("Jewelry Preference", "jewelry_preference", "jewelry_preference", "Select Jewelry")}

                    {renderSelectRow("Clothing Size", "clothing_size", "clothing_size", "Select Size")}
                </View>

                {/* 4. Try-On Settings */}
                <View style={styles.section}>
                    <SectionHeader icon={Ruler} title="Try-On Settings" />

                    <View style={styles.tryonImageSection}>
                        <Text style={styles.rowLabel}>Virtual Try-On Model Reference</Text>
                        <TouchableOpacity style={styles.tryonImageContainer} onPress={() => pickImage('tryon')}>
                            {formData.tryon_image_url ? (
                                <Image source={{ uri: formData.tryon_image_url }} style={styles.tryonImage} />
                            ) : (
                                <View style={styles.tryonPlaceholder}>
                                    <Camera size={32} color={COLORS.primary} />
                                    <Text style={styles.tryonPlaceholderText}>Upload Full Body Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.inputHelperText}>Use a full-body photo facing forward for best results.</Text>
                    </View>
                    <View style={styles.rowSwitch}>
                        <Text style={styles.rowLabel}>Auto Fit Adjustment</Text>
                        <Switch
                            value={formData.auto_fit}
                            onValueChange={v => updateField('auto_fit', v)}
                            trackColor={{ false: "#767577", true: COLORS.primary }}
                        />
                    </View>
                    <View style={styles.rowSwitch}>
                        <Text style={styles.rowLabel}>High Quality Rendering</Text>
                        <Switch
                            value={formData.hq_rendering}
                            onValueChange={v => updateField('hq_rendering', v)}
                            trackColor={{ false: "#767577", true: COLORS.primary }}
                        />
                    </View>
                    <View style={styles.rowSwitch}>
                        <Text style={styles.rowLabel}>AR Mode (Beta)</Text>
                        <Switch
                            value={formData.ar_mode}
                            onValueChange={v => updateField('ar_mode', v)}
                            trackColor={{ false: "#767577", true: COLORS.primary }}
                        />
                    </View>

                    {renderSelectRow("Fit Type", "fit_type", "fit_type", "Select Fit Type")}

                </View>

                {/* Danger Zone */}
                <View style={[styles.section, { borderColor: COLORS.error, borderWidth: 1 }]}>
                    <SectionHeader icon={Trash2} title="Danger Zone" />
                    <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
                        <Text style={styles.dangerButtonText}>Delete Account</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={() => onNavigate('Login')}>
                    <LogOut size={20} color={COLORS.white} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Selection Modal */}
            <Modal visible={selectionModal.visible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.selectionModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectionModal.title}</Text>
                            <TouchableOpacity onPress={() => setSelectionModal(prev => ({ ...prev, visible: false }))}>
                                <Text style={styles.closeText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.optionsList}>
                            {selectionModal.options.map((option, index) => {
                                const isSelected = selectionModal.multiSelect
                                    ? (formData[selectionModal.field] || []).includes(option)
                                    : formData[selectionModal.field] === option;

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.optionItem, isSelected && styles.selectedOption]}
                                        onPress={() => handleSelect(option)}
                                    >
                                        <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>{option}</Text>
                                        {isSelected && <Check size={18} color={COLORS.primary} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Change Password Modal (Existing) */}
            <Modal visible={showPasswordModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Change Password</Text>
                        <View style={styles.inputGroup}>
                            <TextInput
                                style={styles.input}
                                placeholder="Old Password"
                                secureTextEntry
                                value={passwordData.old_password}
                                onChangeText={t => setPasswordData(p => ({ ...p, old_password: t }))}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <TextInput
                                style={styles.input}
                                placeholder="New Password"
                                secureTextEntry
                                value={passwordData.new_password}
                                onChangeText={t => setPasswordData(p => ({ ...p, new_password: t }))}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm New Password"
                                secureTextEntry
                                value={passwordData.confirm_password}
                                onChangeText={t => setPasswordData(p => ({ ...p, confirm_password: t }))}
                            />
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setShowPasswordModal(false)} style={styles.cancelButton}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleChangePassword} style={styles.saveButton}>
                                <Text style={styles.saveButtonText}>Update</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // ... Existing Styles
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.l,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.offWhite,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    scrollContent: {
        padding: SPACING.m,
    },
    section: {
        marginBottom: SPACING.l,
        backgroundColor: '#F9FAFB',
        padding: SPACING.m,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.m,
        gap: 10
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    inputGroup: {
        marginBottom: SPACING.m,
    },
    label: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.gray.medium,
        marginBottom: 6,
    },
    input: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: COLORS.black,
    },
    disabledInput: {
        backgroundColor: '#F3F4F6',
        color: '#9CA3AF',
    },
    rowSwitch: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    rowInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    rowLabel: {
        fontSize: 14,
        color: COLORS.black,
        flex: 1,
    },
    rowTextInput: {
        flex: 1,
        textAlign: 'right',
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
    },
    selectTrigger: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 8,
    },
    selectValue: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
        textAlign: 'right',
    },
    placeholder: {
        color: COLORS.gray.medium,
    },
    rowButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 10,
    },
    rowButtonText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
    },
    dangerButton: {
        backgroundColor: '#FEE2E2',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    dangerButtonText: {
        color: '#DC2626',
        fontWeight: 'bold',
    },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1F2937',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginBottom: SPACING.xl,
    },
    logoutText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end', // Bottom sheet style
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.l,
        width: '90%',
        alignSelf: 'center',
        marginBottom: 'auto',
        marginTop: 'auto',
    },
    selectionModalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: SPACING.l,
        maxHeight: '70%',
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
        paddingBottom: SPACING.s,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.offWhite,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    closeText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    optionsList: {
        marginBottom: SPACING.xl, // Safe area
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.offWhite,
    },
    selectedOption: {
        backgroundColor: '#FAF5FF', // Light gold tint if possible? Using default offwhite-ish
    },
    optionText: {
        fontSize: 16,
        color: COLORS.black,
    },
    selectedOptionText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.m,
        gap: SPACING.m,
    },
    cancelButton: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cancelButtonText: {
        color: COLORS.gray.medium,
        fontWeight: 'bold',
    },
    saveButton: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: COLORS.primary,
    },
    saveButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F3F4F6',
    },
    avatarPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        padding: 8,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: COLORS.white,
    },
    avatarHelperText: {
        fontSize: 12,
        color: COLORS.gray.medium,
        marginTop: 8,
    },
    tryonImageSection: {
        marginBottom: SPACING.m,
    },
    tryonImageContainer: {
        height: 200,
        width: '100%',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    tryonImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    tryonPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    tryonPlaceholderText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
    },
    inputHelperText: {
        fontSize: 12,
        color: COLORS.gray.medium,
    }
});

export default SettingsScreen;
