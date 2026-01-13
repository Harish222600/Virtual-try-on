import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONTS } from '../theme/theme';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { fetchProducts, processTryOn, fetchTryOnHistory } from '../services/tryon';

const { width, height } = Dimensions.get('window');

export const TryOnScreen = ({ onNavigate }) => {
    // Product selection state
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Image capture state
    const [userImage, setUserImage] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [facing, setFacing] = useState('front');
    const [cameraReady, setCameraReady] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef(null);

    // Try-on processing state
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('');
    const [tryonResult, setTryonResult] = useState(null);
    const [showResult, setShowResult] = useState(false);

    // History state
    const [history, setHistory] = useState([]);

    const categories = ['All', 'Top', 'Bottom', 'Dress', 'Jewelry'];

    // Load products on mount and when category changes
    useEffect(() => {
        loadProducts();
    }, [selectedCategory]);

    // Load history on mount
    useEffect(() => {
        loadHistory();
    }, []);

    const loadProducts = async () => {
        setLoadingProducts(true);
        try {
            const data = await fetchProducts(selectedCategory);
            setProducts(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load products');
        } finally {
            setLoadingProducts(false);
        }
    };

    const loadHistory = async () => {
        try {
            const data = await fetchTryOnHistory(10);
            setHistory(data.items || []);
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    };

    const openCamera = async () => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) {
                Alert.alert('Permission Required', 'Camera permission is required to use this feature.');
                return;
            }
        }
        setShowCamera(true);
    };

    const takePicture = async () => {
        if (!cameraRef.current || !cameraReady) {
            Alert.alert('Error', 'Camera is not ready');
            return;
        }

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                skipProcessing: false,
            });

            if (photo?.uri) {
                console.log('Photo captured:', photo.uri);
                setUserImage(photo.uri);
                setShowCamera(false);
                console.log('User image set to:', photo.uri);
            }
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert('Error', 'Failed to capture image');
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Photo library permission is required');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8, // Reduced from 1 to 0.8 optimized
            });

            console.log('Image picker result:', result);
            if (!result.canceled && result.assets?.length > 0) {
                // Immediately update UI with local URI
                const imageUri = result.assets[0].uri;
                setUserImage(imageUri);
                console.log('User image set to (optimized):', imageUri);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleTryOn = async () => {
        if (!userImage || !selectedProduct) {
            Alert.alert('Missing Information', 'Please select both an image and a product');
            return;
        }

        setIsProcessing(true);
        setProcessingStatus('Uploading images...');

        try {
            console.log('Starting try-on with:', { userImage, productId: selectedProduct.id });
            setProcessingStatus('Processing...');
            const result = await processTryOn(userImage, selectedProduct.id);

            console.log('Try-on result received:', result);
            setTryonResult(result);
            setShowResult(true);

            // Reload history
            await loadHistory();

            console.log('Try-on completed successfully');
        } catch (error) {
            console.error('Try-on error:', error);
            Alert.alert('Error', error.message || 'Try-on processing failed. Please try again.');
        } finally {
            setIsProcessing(false);
            setProcessingStatus('');
        }
    };

    const resetTryOn = () => {
        setUserImage(null);
        setSelectedProduct(null);
        setTryonResult(null);
        setShowResult(false);
    };

    // Camera View
    if (showCamera) {
        return (
            <View style={styles.container}>
                <CameraView
                    style={styles.cameraView}
                    facing={facing}
                    ref={cameraRef}
                    onCameraReady={() => setCameraReady(true)}
                >
                    <SafeAreaView style={styles.safeArea}>
                        <View style={styles.topBar}>
                            <Pressable onPress={() => setShowCamera(false)} style={styles.iconBtn}>
                                <Text style={styles.iconText}>✕</Text>
                            </Pressable>
                            <View style={styles.statusPill}>
                                <Text style={styles.statusText}>
                                    {cameraReady ? 'CAMERA READY' : 'LOADING...'}
                                </Text>
                            </View>
                            <Pressable onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} style={styles.iconBtn}>
                                <Text style={styles.iconText}>🔄</Text>
                            </Pressable>
                        </View>
                    </SafeAreaView>

                    <View style={styles.cameraControls}>
                        <Pressable onPress={takePicture} style={styles.shutterButton}>
                            <View style={styles.shutterInner} />
                        </Pressable>
                    </View>
                </CameraView>
            </View>
        );
    }

    // Result View
    if (showResult && tryonResult) {
        return (
            <View style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.topBar}>
                        <Pressable onPress={() => setShowResult(false)} style={styles.iconBtn}>
                            <Text style={styles.iconText}>←</Text>
                        </Pressable>
                        <View style={styles.statusPill}>
                            <Text style={styles.statusText}>RESULT</Text>
                        </View>
                        <Pressable onPress={resetTryOn} style={styles.iconBtn}>
                            <Text style={styles.iconText}>🔄</Text>
                        </Pressable>
                    </View>
                </SafeAreaView>

                <ScrollView style={styles.resultContainer}>
                    <View style={styles.resultSection}>
                        <Text style={styles.resultTitle}>Original</Text>
                        <Image source={{ uri: tryonResult.original_image_url || userImage }} style={styles.resultImage} />
                    </View>

                    <View style={styles.resultSection}>
                        <Text style={styles.resultTitle}>Try-On Result</Text>
                        <Image source={{ uri: tryonResult.result_image_url }} style={styles.resultImage} />
                    </View>

                    <View style={styles.resultInfo}>
                        <Text style={styles.resultInfoText}>Product: {tryonResult.product_name}</Text>
                        <Text style={styles.resultInfoText}>Category: {tryonResult.product_category}</Text>
                        <Text style={styles.resultInfoText}>Processing Time: {tryonResult.processing_time.toFixed(2)}s</Text>
                    </View>

                    <Pressable onPress={resetTryOn} style={styles.tryAnotherButton}>
                        <Text style={styles.tryAnotherText}>Try Another</Text>
                    </Pressable>
                </ScrollView>
            </View>
        );
    }

    // Main Try-On Screen
    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.topBar}>
                    <Pressable onPress={() => onNavigate('Home')} style={styles.iconBtn}>
                        <Text style={styles.iconText}>←</Text>
                    </Pressable>
                    <View style={styles.statusPill}>
                        <Text style={styles.statusText}>VIRTUAL TRY-ON</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView style={styles.mainContent}>
                {/* Image Selection Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Your Photo</Text>
                    {userImage ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: userImage }} style={styles.imagePreview} />
                            <Pressable onPress={() => setUserImage(null)} style={styles.removeImageBtn}>
                                <Text style={styles.removeImageText}>✕</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Text style={styles.placeholderText}>No image selected</Text>
                            <View style={styles.imageButtonsRow}>
                                <Pressable onPress={openCamera} style={styles.imageButton}>
                                    <Text style={styles.imageButtonText}>📸 Camera</Text>
                                </Pressable>
                                <Pressable onPress={pickImage} style={styles.imageButton}>
                                    <Text style={styles.imageButtonText}>🖼️ Gallery</Text>
                                </Pressable>
                            </View>
                        </View>
                    )}
                </View>

                {/* Product Selection Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Select Product</Text>

                    {/* Category Tabs */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
                        {categories.map((cat) => (
                            <Pressable
                                key={cat}
                                onPress={() => setSelectedCategory(cat)}
                                style={[styles.categoryTab, selectedCategory === cat && styles.categoryTabActive]}
                            >
                                <Text style={[styles.categoryTabText, selectedCategory === cat && styles.categoryTabTextActive]}>
                                    {cat}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>

                    {/* Products Grid */}
                    {loadingProducts ? (
                        <ActivityIndicator size="large" color={COLORS.black} style={{ marginTop: 20 }} />
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
                            {products.map((product) => (
                                <Pressable
                                    key={product.id}
                                    onPress={() => setSelectedProduct(product)}
                                    style={[styles.productCard, selectedProduct?.id === product.id && styles.productCardActive]}
                                >
                                    {product.image_url ? (
                                        <Image source={{ uri: product.image_url }} style={styles.productImage} />
                                    ) : (
                                        <View style={styles.productImagePlaceholder}>
                                            <Text>No Image</Text>
                                        </View>
                                    )}
                                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                                    <Text style={styles.productCategory}>{product.category}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Try-On History */}
                {history.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recent Try-Ons</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyScroll}>
                            {history.map((item) => (
                                <Pressable key={item.id} style={styles.historyItem}>
                                    <Image source={{ uri: item.result_image_url }} style={styles.historyImage} />
                                    <Text style={styles.historyText} numberOfLines={1}>{item.product_name}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </ScrollView>

            {/* Try-On Button */}
            <View style={styles.bottomBar}>
                {isProcessing ? (
                    <View style={styles.processingContainer}>
                        <ActivityIndicator size="small" color={COLORS.white} />
                        <Text style={styles.processingText}>{processingStatus}</Text>
                    </View>
                ) : (
                    <Pressable
                        onPress={handleTryOn}
                        style={[styles.tryOnButton, (!userImage || !selectedProduct) && styles.tryOnButtonDisabled]}
                        disabled={!userImage || !selectedProduct}
                    >
                        <Text style={styles.tryOnButtonText}>✨ Try It On</Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    safeArea: {
        width: '100%',
        position: 'absolute',
        top: 0,
        zIndex: 10,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.l,
        paddingTop: SPACING.s,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statusPill: {
        backgroundColor: COLORS.black,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    mainContent: {
        flex: 1,
        marginTop: 60,
    },
    section: {
        padding: SPACING.l,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray.light,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: SPACING.m,
        color: COLORS.black,
    },
    imagePlaceholder: {
        height: 200,
        backgroundColor: COLORS.offWhite,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.gray.light,
        borderStyle: 'dashed',
    },
    placeholderText: {
        color: COLORS.gray.medium,
        marginBottom: SPACING.m,
    },
    imageButtonsRow: {
        flexDirection: 'row',
        gap: SPACING.m,
    },
    imageButton: {
        backgroundColor: COLORS.black,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    imageButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    imagePreviewContainer: {
        position: 'relative',
        height: 300,
        borderRadius: 12,
        overflow: 'hidden',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeImageText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    categoryTabs: {
        marginBottom: SPACING.m,
    },
    categoryTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: SPACING.s,
        borderRadius: 20,
        backgroundColor: COLORS.offWhite,
    },
    categoryTabActive: {
        backgroundColor: COLORS.black,
    },
    categoryTabText: {
        color: COLORS.black,
        fontWeight: '600',
    },
    categoryTabTextActive: {
        color: COLORS.white,
    },
    productsScroll: {
        marginTop: SPACING.s,
    },
    productCard: {
        width: 120,
        marginRight: SPACING.m,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        padding: SPACING.s,
        backgroundColor: COLORS.offWhite,
    },
    productCardActive: {
        borderColor: COLORS.black,
        backgroundColor: COLORS.white,
    },
    productImage: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        resizeMode: 'cover',
    },
    productImagePlaceholder: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        backgroundColor: COLORS.gray.light,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productName: {
        marginTop: SPACING.s,
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    productCategory: {
        fontSize: 10,
        color: COLORS.gray.medium,
        marginTop: 2,
    },
    historyScroll: {
        marginTop: SPACING.s,
    },
    historyItem: {
        width: 100,
        marginRight: SPACING.m,
    },
    historyImage: {
        width: 100,
        height: 150,
        borderRadius: 8,
        resizeMode: 'cover',
    },
    historyText: {
        marginTop: SPACING.xs,
        fontSize: 10,
        color: COLORS.gray.medium,
        textAlign: 'center',
    },
    bottomBar: {
        padding: SPACING.l,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray.light,
    },
    tryOnButton: {
        backgroundColor: COLORS.black,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    tryOnButtonDisabled: {
        backgroundColor: COLORS.gray.medium,
    },
    tryOnButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    processingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.black,
        paddingVertical: 16,
        borderRadius: 12,
    },
    processingText: {
        color: COLORS.white,
        marginLeft: SPACING.m,
        fontSize: 14,
        fontWeight: 'bold',
    },
    cameraView: {
        flex: 1,
    },
    cameraControls: {
        position: 'absolute',
        bottom: 40,
        width: '100%',
        alignItems: 'center',
    },
    shutterButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: COLORS.white,
    },
    shutterInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.white,
    },
    resultContainer: {
        flex: 1,
        marginTop: 60,
    },
    resultSection: {
        padding: SPACING.l,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: SPACING.m,
        color: COLORS.black,
    },
    resultImage: {
        width: '100%',
        height: 400,
        borderRadius: 12,
        resizeMode: 'contain',
    },
    resultInfo: {
        padding: SPACING.l,
        backgroundColor: COLORS.offWhite,
        marginHorizontal: SPACING.l,
        borderRadius: 12,
        marginBottom: SPACING.l,
    },
    resultInfoText: {
        fontSize: 14,
        color: COLORS.black,
        marginBottom: SPACING.xs,
    },
    tryAnotherButton: {
        backgroundColor: COLORS.black,
        paddingVertical: 16,
        marginHorizontal: SPACING.l,
        marginBottom: SPACING.xl,
        borderRadius: 12,
        alignItems: 'center',
    },
    tryAnotherText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
