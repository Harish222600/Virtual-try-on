import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Settings, CreditCard, Ruler, LogOut, Package } from 'lucide-react-native';
import { COLORS, SPACING, FONTS } from '../theme/theme';
import { getProfile } from '../services/auth';

export const ProfileScreen = ({ onNavigate, token }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                if (token) {
                    const userData = await getProfile(token);
                    setUser(userData);
                }
            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [token]);

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => onNavigate('Home')} style={styles.backButton}>
                    <Text style={styles.backText}>✕</Text>
                </Pressable>
                <Text style={styles.headerTitle}>MY <Text style={{ fontWeight: '900' }}>ACCOUNT</Text></Text>
                <Pressable onPress={() => onNavigate('Settings')}>
                    <Settings size={20} color={COLORS.black} />
                </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

                {/* Profile Card */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        {user?.profile_image_url ? (
                            <Image source={{ uri: user.profile_image_url }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>{user?.full_name?.[0]?.toUpperCase() || '?'}</Text>
                        )}
                    </View>
                    <Text style={styles.userName}>{user?.full_name?.toUpperCase() || 'GUEST'}</Text>
                    <Text style={styles.userStatus}>{user?.email || 'No Email'}</Text>
                </View>

                {/* Physical Profile Stats */}
                <View style={styles.detailsContainer}>
                    <Text style={styles.sectionTitle}>PHYSICAL PROFILE</Text>
                    <View style={styles.detailsGrid}>
                        <DetailItem label="Height" value={user?.height ? `${user.height} cm` : '-'} />
                        <DetailItem label="Body Type" value={user?.body_type || '-'} />
                        <DetailItem label="Size" value={user?.clothing_size || '-'} />
                        <DetailItem label="Gender" value={user?.gender || '-'} />
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>12</Text>
                        <Text style={styles.statLabel}>WISHLIST</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        {user?.tryon_image_url ? (
                            <Image source={{ uri: user.tryon_image_url }} style={styles.miniImage} />
                        ) : (
                            <Text style={styles.statNumber}>0</Text>
                        )}
                        <Text style={styles.statLabel}>TRY-ON IMAGE</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>3D</Text>
                        <Text style={styles.statLabel}>SCANS</Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuSection}>
                    <MenuItem icon={Ruler} title="My Measurements" subtitle="Face & Body Data" />
                    <MenuItem icon={LogOut} title="Log Out" isLast />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const MenuItem = ({ icon: Icon, title, subtitle, isLast }) => (
    <Pressable style={[styles.menuItem, isLast && styles.lastMenuItem]}>
        <View style={styles.menuIconBox}>
            <Icon size={20} color={COLORS.black} />
        </View>
        <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>{title}</Text>
            {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
        <ChevronRight size={16} color={COLORS.gray.medium} />
    </Pressable>
);

const DetailItem = ({ label, value }) => (
    <View style={styles.detailItemBox}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        ...(Platform.OS === 'web' ? { height: '100vh' } : {}),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.offWhite,
    },
    backButton: {
        padding: SPACING.s,
    },
    backText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 14,
        letterSpacing: 2,
        color: COLORS.black,
    },
    scroll: {
        flex: 1,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.offWhite,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.black,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    miniImage: {
        width: 40,
        height: 40,
        borderRadius: 5,
        marginBottom: 5,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '900',
        color: COLORS.black,
    },
    userName: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: SPACING.s,
        color: COLORS.black,
    },
    userStatus: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 3,
        color: COLORS.gold,
        paddingHorizontal: SPACING.m,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: COLORS.gold,
    },
    detailsContainer: {
        paddingHorizontal: SPACING.l,
        marginBottom: SPACING.l,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.gray.medium,
        marginBottom: SPACING.m,
        letterSpacing: 1,
        textAlign: 'center',
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: COLORS.offWhite,
        borderRadius: 10,
        padding: SPACING.m,
    },
    detailItemBox: {
        width: '50%',
        padding: SPACING.s,
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 10,
        color: COLORS.gray.medium,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: SPACING.l,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.offWhite,
        marginBottom: SPACING.xl,
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: SPACING.l,
        minWidth: 80,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    statLabel: {
        fontSize: 10,
        color: COLORS.gray.medium,
        letterSpacing: 1,
        marginTop: 4,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: COLORS.offWhite,
    },
    menuSection: {
        paddingHorizontal: SPACING.l,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.l,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.offWhite,
    },
    lastMenuItem: {
        borderBottomWidth: 0,
    },
    menuIconBox: {
        width: 40,
        height: 40,
        backgroundColor: COLORS.offWhite,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.m,
    },
    menuInfo: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 4,
        letterSpacing: 1,
    },
    menuSubtitle: {
        fontSize: 12,
        color: COLORS.gray.medium,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ProfileScreen;