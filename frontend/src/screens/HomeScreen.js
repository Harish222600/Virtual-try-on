import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { ProductCard } from '../components/ProductCard';
import { COLORS, FONTS, SPACING } from '../theme/theme';
import { Home, Camera, User } from 'lucide-react-native';
import { API_URL } from '../services/auth';

export const HomeScreen = ({ onNavigate }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${API_URL}/products`);
            const data = await response.json();
            if (response.ok) {
                setProducts(data);
            }
        } catch (error) {
            console.error('Error fetching home products:', error);
        } finally {
            setLoading(false);
        }
    };
    return (
        <View style={styles.container}>
            {/* Nav Bar */}
            <View style={styles.navBar}>
                <Text style={styles.logo}>VOGUE<Text style={{ color: COLORS.gold }}>AR</Text></Text>
                <View style={styles.icons}>
                    <Text style={styles.icon}>🔍</Text>
                    <View style={{ width: 20 }} />
                    <Text style={styles.icon}>🛍️</Text>
                </View>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Hero Section */}
                <View style={styles.hero}>
                    <View style={styles.heroOverlay} />
                    <View style={styles.heroContent}>
                        <Text style={styles.preTitle}>COLLECTION '25</Text>
                        <Text style={styles.heroTitle}>BEYOND</Text>
                        <Text style={styles.heroSubtitle}>REALITY</Text>

                        <Pressable onPress={() => onNavigate('TryOn')} style={styles.ctaBtn}>
                            <Text style={styles.ctaText}>EXPERIENCE AR</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Marquee Scroller */}
                <View style={styles.marqueeContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.marqueeContent}>
                        {['NEW', 'BESTSELLERS', 'OPTICAL', 'SUN', 'RUNWAY'].map((item, i) => (
                            <Text key={i} style={[styles.marqueeItem, i === 0 && styles.activeMarquee]}>{item}</Text>
                        ))}
                    </ScrollView>
                </View>

                {/* Trending Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>TRENDING <Text style={{ fontWeight: 'bold' }}>NOW</Text></Text>
                        <Text style={styles.link}>VIEW ALL</Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color={COLORS.black} style={{ marginTop: 20 }} />
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productList}>
                            {products.length > 0 ? (
                                products.map((item) => (
                                    <ProductCard
                                        key={item.id}
                                        title={item.name}
                                        subtitle={item.category}
                                        price="$180" // Hardcoded price for now as DB doesn't have it yet
                                        image={item.image_url}
                                        onPress={() => onNavigate('TryOn', { product: item })}
                                    />
                                ))
                            ) : (
                                <Text style={{ marginLeft: SPACING.l, color: COLORS.gray.medium }}>No products available.</Text>
                            )}
                        </ScrollView>
                    )}
                </View>

            </ScrollView>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                <Pressable style={styles.tabItem}>
                    <Home color={COLORS.black} size={24} />
                    {/* Active Indicator */}
                    <View style={{ width: 4, height: 4, backgroundColor: COLORS.black, borderRadius: 2, marginTop: 4 }} />
                </Pressable>

                <Pressable onPress={() => onNavigate('TryOn')} style={styles.tabItem}>
                    <Camera color={COLORS.gray.medium} size={24} />
                </Pressable>

                <Pressable onPress={() => onNavigate('Profile')} style={styles.tabItem}>
                    <User color={COLORS.gray.medium} size={24} />
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        ...(Platform.OS === 'web' ? { height: '100vh', overflow: 'hidden' } : {}),
    },
    scroll: {
        flex: 1,
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.offWhite,
    },
    logo: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 2,
        color: COLORS.black,
    },
    icons: {
        flexDirection: 'row',
    },
    icon: {
        fontSize: 20,
    },
    hero: {
        height: 500,
        backgroundColor: '#111', // Dark background placeholder
        position: 'relative',
        justifyContent: 'flex-end',
        marginBottom: SPACING.xl,
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    heroContent: {
        padding: SPACING.l,
        paddingBottom: SPACING.xxl,
    },
    preTitle: {
        color: COLORS.gold,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 4,
        marginBottom: SPACING.s,
        borderLeftWidth: 2,
        borderLeftColor: COLORS.gold,
        paddingLeft: SPACING.s,
    },
    heroTitle: {
        color: COLORS.white,
        fontSize: 56,
        fontWeight: '900',
        lineHeight: 60,
    },
    heroSubtitle: {
        color: COLORS.white,
        fontSize: 56,
        fontWeight: '100', // Thin
        fontStyle: 'italic',
        lineHeight: 60,
        marginBottom: SPACING.l,
    },
    ctaBtn: {
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.m,
        alignSelf: 'flex-start',
    },
    ctaText: {
        color: COLORS.black,
        fontWeight: 'bold',
        letterSpacing: 2,
        fontSize: 12,
    },
    marqueeContainer: {
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.offWhite,
        paddingVertical: SPACING.m,
        marginBottom: SPACING.xl,
    },
    marqueeContent: {
        paddingLeft: SPACING.l,
    },
    marqueeItem: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
        color: COLORS.gray.medium,
        marginRight: SPACING.xl,
    },
    activeMarquee: {
        color: COLORS.black,
    },
    section: {
        marginBottom: 80, // Space for bottom bar
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingHorizontal: SPACING.l,
        marginBottom: SPACING.l,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '300',
        color: COLORS.black,
    },
    link: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.gray.medium,
        textDecorationLine: 'underline',
        letterSpacing: 1,
    },
    productList: {
        paddingLeft: SPACING.l,
    },
    tabBar: {
        position: Platform.OS === 'web' ? 'fixed' : 'absolute',
        bottom: 30,
        alignSelf: 'center',
        backgroundColor: COLORS.white,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 35,
        width: '60%', // Compact width
        // Shadow for floating effect
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 5,
    },
});
