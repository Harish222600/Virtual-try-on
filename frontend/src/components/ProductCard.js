import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { COLORS, FONTS, SPACING } from '../theme/theme';

export const ProductCard = ({ title, price, subtitle, image, onPress }) => {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [
            styles.container,
            pressed && styles.pressed
        ]}>
            {/* Image Container */}
            <View style={styles.imageContainer}>
                {/* <View style={styles.badge}>
                    <Text style={styles.badgeText}>NEW</Text>
                </View> */}
                {image ? (
                    <Image source={{ uri: image }} style={styles.productImage} resizeMode="contain" />
                ) : (
                    <Text style={styles.placeholderText}>ITEM</Text>
                )}
            </View>

            {/* Info */}
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
                <Text style={styles.price}>{price}</Text>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 200,
        marginRight: SPACING.l,
    },
    pressed: {
        opacity: 0.8,
    },
    imageContainer: {
        height: 280, // Tall fashion ratio
        backgroundColor: COLORS.offWhite,
        marginBottom: SPACING.m,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: COLORS.black,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    placeholderText: {
        color: COLORS.gray.medium,
        letterSpacing: 2,
        fontSize: 12,
    },
    info: {
        paddingHorizontal: 4,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.black,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: COLORS.gray.medium,
        marginBottom: 8,
        fontWeight: '300',
    },
    price: {
        fontSize: 14,
        color: COLORS.black,
        fontWeight: 'normal',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
});
