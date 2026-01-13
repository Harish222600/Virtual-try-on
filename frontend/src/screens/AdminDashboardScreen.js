import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image, Modal, TextInput, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING } from '../theme/theme';
import { LogOut, Users, ShoppingBag, Activity, LayoutDashboard, FileText, Menu, X, User, Trash2, Ban, CheckCircle, Plus, Eye, EyeOff, Edit2, Search, Layers, Settings } from 'lucide-react-native';
import { API_URL, getProfile, signup } from '../services/auth'; // Ensure signup is imported

export const AdminDashboardScreen = ({ onNavigate, token }) => {
    const { width, height } = useWindowDimensions();
    const isDesktop = width > 768;

    const [stats, setStats] = useState({
        users: 0,
        products: 0,
        categories: 0
    });
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(isDesktop);
    const [adminProfile, setAdminProfile] = useState(null);

    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Modal State
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role: 'user' });

    // Product State
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [isProductDetailModalOpen, setIsProductDetailModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [newProduct, setNewProduct] = useState({
        name: '', description: '', category: 'Top', gender: 'Unisex',
        tryon_type: 'Upper body', body_mapping: '', overlay_scale: '1.0',
        offset_x: '0.0', offset_y: '0.0', rotation: '0.0',
        image: null
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    // Category State
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', description: '', image: null, isEditing: false });
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

    // Settings State
    const [settingsData, setSettingsData] = useState({
        full_name: '',
        email: '',
        current_password: '',
        new_password: '',
        confirm_password: '',
        profile_image: null,
    });
    const [loadingSettings, setLoadingSettings] = useState(false);
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    useEffect(() => {
        if (adminProfile) {
            setSettingsData(prev => ({
                ...prev,
                full_name: adminProfile.full_name || '',
                email: adminProfile.email || '',
                profile_image: adminProfile.profile_image_url
            }));
        }
    }, [adminProfile]);

    const handleUpdateSettings = async () => {
        setLoadingSettings(true);
        try {
            // 1. Update Profile Info
            const profileUpdateRes = await fetch(`${API_URL}/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ full_name: settingsData.full_name })
            });

            if (!profileUpdateRes.ok) throw new Error('Failed to update profile info');

            // 2. Update Password if provided
            if (settingsData.current_password && settingsData.new_password) {
                if (settingsData.new_password !== settingsData.confirm_password) {
                    alert("New passwords do not match");
                    setLoadingSettings(false);
                    return;
                }
                const passwordRes = await fetch(`${API_URL}/users/change-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        old_password: settingsData.current_password,
                        new_password: settingsData.new_password
                    })
                });
                if (!passwordRes.ok) {
                    const errData = await passwordRes.json();
                    throw new Error(errData.detail || 'Failed to update password');
                }
            }

            // 3. Upload Image if changed (and is a local URI)
            if (settingsData.profile_image && !settingsData.profile_image.startsWith('http')) {
                const formData = new FormData();
                if (Platform.OS === 'web') {
                    const res = await fetch(settingsData.profile_image);
                    const blob = await res.blob();
                    formData.append('file', blob, 'profile.jpg');
                } else {
                    formData.append('file', {
                        uri: settingsData.profile_image,
                        name: 'profile.jpg',
                        type: 'image/jpeg'
                    });
                }

                const imageRes = await fetch(`${API_URL}/users/me/profile-image`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                if (!imageRes.ok) throw new Error('Failed to upload profile image');
            }

            alert('Settings updated successfully');
            fetchAdminProfile(); // Refresh
            setSettingsData(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));

        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setLoadingSettings(false);
        }
    };

    const pickProfileImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setSettingsData({ ...settingsData, profile_image: result.assets[0].uri });
        }
    };


    const pickProductImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, // Maybe false for raw product images? True for consistency.
            quality: 1,
        });

        if (!result.canceled) {
            setNewProduct({ ...newProduct, image: result.assets[0].uri });
        }
    };

    const pickCategoryImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setNewCategory({ ...newCategory, image: result.assets[0].uri });
        }
    };

    useEffect(() => {
        setIsSidebarOpen(isDesktop);
    }, [isDesktop]);

    useEffect(() => {
        fetchStats();
        fetchAdminProfile();
    }, []);

    useEffect(() => {
        if (activeTab === 'Users') {
            fetchUsers();
        } else if (activeTab === 'Products') {
            fetchProducts();
            fetchCategories();
        } else if (activeTab === 'Categories') {
            fetchCategories();
        }
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const [usersRes, productsRes, categoriesRes] = await Promise.all([
                fetch(`${API_URL}/admin/users`),
                fetch(`${API_URL}/admin/products`),
                fetch(`${API_URL}/admin/categories`)
            ]);

            const usersData = usersRes.ok ? await usersRes.json() : [];
            const productsData = productsRes.ok ? await productsRes.json() : [];
            const categoriesData = categoriesRes.ok ? await categoriesRes.json() : [];

            setStats({
                users: Array.isArray(usersData) ? usersData.length : 0,
                products: Array.isArray(productsData) ? productsData.length : 0,
                categories: Array.isArray(categoriesData) ? categoriesData.length : 0
            });
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        }
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await fetch(`${API_URL}/admin/users`);
            const data = await response.json();
            if (response.ok) {
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const response = await fetch(`${API_URL}/admin/products`);
            const data = await response.json();
            if (response.ok) {
                setStats(prev => ({ ...prev, products: data.length })); // Update stats count
                setProducts(data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
            const response = await fetch(`${API_URL}/admin/categories`);
            const data = await response.json();
            if (response.ok) {
                setCategories(data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoadingCategories(false);
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            const response = await fetch(`${API_URL}/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !currentStatus })
            });

            if (response.ok) {
                fetchUsers(); // Refresh list
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (Platform.OS === 'web') {
            if (!confirm('Are you sure you want to delete this user?')) return;
        }
        // For mobile, use Alert.alert (omitted for brevity in this web-focused context)

        try {
            const response = await fetch(`${API_URL}/admin/users/${userId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                fetchUsers();
            } else {
                alert('Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const handleAddUserSubmit = async () => {
        // Prepare FormData as expected by /signup endpoint
        const formData = new FormData();
        formData.append('full_name', newUser.full_name);
        formData.append('email', newUser.email);
        formData.append('password', newUser.password);
        formData.append('confirm_password', newUser.password); // Auto-confirm
        formData.append('role', newUser.role);

        try {
            await signup(formData);
            setIsAddUserModalOpen(false);
            setNewUser({ full_name: '', email: '', password: '', role: 'user' });
            fetchUsers();
            alert('User added successfully');
        } catch (error) {
            console.error(error);
            alert('Failed to add user: ' + error.message);
        }
    };



    const handleDeleteProduct = async (productId) => {
        if (Platform.OS === 'web') {
            if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
        }
        try {
            const response = await fetch(`${API_URL}/admin/products/${productId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                fetchProducts();
                alert('Product deleted successfully');
            } else {
                alert('Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const handleToggleProductStatus = async (productId, currentStatus) => {
        try {
            const response = await fetch(`${API_URL}/admin/products/${productId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !currentStatus })
            });
            if (response.ok) {
                fetchProducts();
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    // Edit Product Helper
    const openEditProductModal = (product) => {
        setNewProduct({
            id: product.id,
            name: product.name,
            description: product.description || '',
            category: product.category,
            gender: product.gender,
            tryon_type: product.tryon_type,
            body_mapping: product.body_mapping || '',
            overlay_scale: product.overlay_scale?.toString() || '1.0',
            offset_x: product.offset_x?.toString() || '0.0',
            offset_y: product.offset_y?.toString() || '0.0',
            rotation: product.rotation?.toString() || '0.0',
            image: product.image_url, // Keep existing URL
            isEditing: true
        });
        setIsAddProductModalOpen(true);
    };

    const handleAddProductSubmit = async () => {
        const formData = new FormData();
        formData.append('name', newProduct.name);
        formData.append('description', newProduct.description);
        formData.append('category', newProduct.category);
        formData.append('gender', newProduct.gender);
        formData.append('tryon_type', newProduct.tryon_type);
        formData.append('body_mapping', newProduct.body_mapping || '');
        formData.append('overlay_scale', newProduct.overlay_scale);
        formData.append('offset_x', newProduct.offset_x);
        formData.append('offset_y', newProduct.offset_y);
        formData.append('rotation', newProduct.rotation);

        // Image handling: If isEditing and image starts with 'http', it's existing. 
        // If it's a local URI, it's new.
        if (newProduct.image && !newProduct.image.startsWith('http')) {
            if (Platform.OS === 'web') {
                const response = await fetch(newProduct.image);
                const blob = await response.blob();
                formData.append('image', blob, 'product.png');
            } else {
                formData.append('image', {
                    uri: newProduct.image,
                    name: 'product.png',
                    type: 'image/png',
                });
            }
        }

        try {
            const url = newProduct.isEditing
                ? `${API_URL}/admin/products/${newProduct.id}`
                : `${API_URL}/admin/products`;

            const method = newProduct.isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                body: formData,
            });

            if (response.ok) {
                alert(newProduct.isEditing ? 'Product updated successfully' : 'Product added successfully');
                setIsAddProductModalOpen(false);
                fetchProducts();
                setNewProduct({
                    name: '', description: '', category: 'Top', gender: 'Unisex',
                    tryon_type: 'Upper body', body_mapping: '', overlay_scale: '1.0',
                    offset_x: '0.0', offset_y: '0.0', rotation: '0.0',
                    image: null, isEditing: false
                });
            } else {
                const error = await response.json();
                alert('Failed: ' + (error.detail || 'Unknown error'));
            }
        } catch (error) {
            console.error(error);
            alert('Error saving product');
        }
    };

    // Category Handlers
    const openEditCategoryModal = (category) => {
        setNewCategory({
            id: category.id,
            name: category.name,
            description: category.description || '',
            image: category.image_url,
            isEditing: true
        });
        setIsAddCategoryModalOpen(true);
    };

    const handleAddCategorySubmit = async () => {
        const formData = new FormData();
        formData.append('name', newCategory.name);
        formData.append('description', newCategory.description);

        if (newCategory.image && !newCategory.image.startsWith('http')) {
            if (Platform.OS === 'web') {
                const response = await fetch(newCategory.image);
                const blob = await response.blob();
                formData.append('image', blob, 'category.png');
            } else {
                formData.append('image', {
                    uri: newCategory.image,
                    name: 'category.png',
                    type: 'image/png',
                });
            }
        }

        try {
            const url = newCategory.isEditing
                ? `${API_URL}/admin/categories/${newCategory.id}`
                : `${API_URL}/admin/categories`;
            const method = newCategory.isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                body: formData,
            });

            if (response.ok) {
                alert(newCategory.isEditing ? 'Category updated successfully' : 'Category added successfully');
                setIsAddCategoryModalOpen(false);
                fetchCategories();
                setNewCategory({ name: '', description: '', image: null, isEditing: false });
            } else {
                alert('Failed to save category');
            }
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Error saving category');
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (Platform.OS === 'web') {
            if (!confirm('Are you sure you want to delete this category?')) return;
        }
        try {
            const response = await fetch(`${API_URL}/admin/categories/${categoryId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                fetchCategories();
            } else {
                alert('Failed to delete category');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    const handleDeleteAccount = async () => {
        if (Platform.OS === 'web') {
            if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
        } else {
            // Native Alert logic could go here, but for now simple return if logic complex
        }

        setLoadingSettings(true);
        try {
            const response = await fetch(`${API_URL}/users/me`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Account deleted successfully');
                onNavigate('Login');
            } else {
                throw new Error('Failed to delete account');
            }
        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setLoadingSettings(false);
        }
    };

    const fetchAdminProfile = async () => {
        try {
            if (!token) return;
            const profile = await getProfile(token).catch(() => null);
            if (profile) setAdminProfile(profile);
        } catch (error) {
            console.log("Could not fetch profile, using default");
        }
    }

    const handleLogout = () => {
        onNavigate('Login');
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard },
        { name: 'Users', icon: Users },
        { name: 'Products', icon: ShoppingBag },
        { name: 'Categories', icon: Layers },
        { name: 'Reports', icon: FileText },
        { name: 'Settings', icon: Settings },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'Dashboard':
                return (
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.contentScroll}>
                        <Text style={styles.pageTitle}>Dashboard Overview</Text>

                        {/* Stats Grid */}
                        <View style={styles.grid}>
                            <DashboardCard icon={Users} title="Total Users" value={stats.users.toString()} color="#4F46E5" />
                            <DashboardCard icon={ShoppingBag} title="Total Products" value={stats.products.toString()} color="#10B981" />
                            <DashboardCard icon={Layers} title="Total Categories" value={stats.categories.toString()} color="#F59E0B" />
                        </View>

                        {/* Recent Activity Section */}
                        <View style={[styles.section, { marginTop: SPACING.xl }]}>
                            <Text style={styles.sectionTitle}>System Status</Text>
                            <View style={[styles.card, { padding: SPACING.m, flexDirection: 'column', alignItems: 'flex-start' }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.s }}>
                                    <CheckCircle size={20} color="#10B981" style={{ marginRight: SPACING.s }} />
                                    <Text style={{ fontSize: 14, color: '#374151', fontWeight: '500' }}>System is running smoothly</Text>
                                </View>
                                <Text style={{ fontSize: 13, color: '#6B7280' }}>
                                    All services including User Management, Product Catalog, and Database are operational.
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                );

            case 'Users':
                return (
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.contentScroll}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m }}>
                            <Text style={styles.pageTitle}>User Management</Text>
                            <TouchableOpacity style={styles.addButton} onPress={() => setIsAddUserModalOpen(true)}>
                                <Plus size={20} color={COLORS.white} />
                                <Text style={styles.addButtonText}>Add User</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.cardListContainer}>
                            {loadingUsers ? (
                                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                            ) : users.map((user) => (
                                <View key={user.id} style={styles.userCard}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.userInfoExpanded}>
                                            <View style={styles.userAvatarMedium}>
                                                {user.profile_image_url ? (
                                                    <Image source={{ uri: user.profile_image_url }} style={styles.avatar} />
                                                ) : (
                                                    <User size={20} color={COLORS.white} />
                                                )}
                                            </View>
                                            <View style={styles.userTextContainer}>
                                                <Text style={styles.userNameText} numberOfLines={1}>{user.full_name}</Text>
                                                <Text style={styles.userEmailText} numberOfLines={1}>{user.email}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.roleBadge, user.is_active ? styles.roleAdmin : styles.roleInactive]}>
                                            <Text style={styles.roleText}>{user.is_active ? 'Active' : 'Disabled'}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardActions}>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.viewBtn]}
                                            onPress={() => {
                                                setSelectedUser(user);
                                                setIsUserDetailModalOpen(true);
                                            }}
                                        >
                                            <Eye size={16} color="#4F46E5" />
                                            <Text style={[styles.actionBtnText, { color: '#4F46E5' }]}>Details</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.statusBtn]}
                                            onPress={() => handleToggleStatus(user.id, user.is_active)}
                                        >
                                            {user.is_active ? (
                                                <>
                                                    <Ban size={16} color="#DC2626" />
                                                    <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Disable</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={16} color="#10B981" />
                                                    <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Activate</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.deleteBtn]}
                                            onPress={() => handleDeleteUser(user.id)}
                                        >
                                            <Trash2 size={16} color="#6B7280" />
                                            <Text style={styles.actionBtnText}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* User Details Modal */}
                        <Modal visible={isUserDetailModalOpen} transparent animationType="fade" onRequestClose={() => setIsUserDetailModalOpen(false)}>
                            <View style={styles.modalOverlay}>
                                <View style={[styles.modalContent, styles.detailModalContent, !isDesktop && styles.detailModalMobile]}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>User Details</Text>
                                        <TouchableOpacity onPress={() => setIsUserDetailModalOpen(false)}>
                                            <X size={24} color="#6B7280" />
                                        </TouchableOpacity>
                                    </View>

                                    {selectedUser && (
                                        <ScrollView style={styles.modalBody}>
                                            {/* Header Section with Images */}
                                            <View style={styles.detailHeader}>
                                                <View style={styles.detailImageContainer}>
                                                    <Text style={styles.detailLabel}>Profile</Text>
                                                    {selectedUser.profile_image_url ? (
                                                        <Image source={{ uri: selectedUser.profile_image_url }} style={styles.detailAvatar} />
                                                    ) : (
                                                        <View style={[styles.detailAvatar, { backgroundColor: '#2A3449', justifyContent: 'center', alignItems: 'center' }]}>
                                                            <User size={40} color={COLORS.white} />
                                                        </View>
                                                    )}
                                                </View>
                                                {selectedUser.tryon_image_url && (
                                                    <View style={styles.detailImageContainer}>
                                                        <Text style={styles.detailLabel}>Try-On Model</Text>
                                                        <Image source={{ uri: selectedUser.tryon_image_url }} style={styles.detailAvatar} />
                                                    </View>
                                                )}
                                            </View>

                                            {/* Personal Information */}
                                            <View style={styles.detailSection}>
                                                <Text style={styles.detailSectionTitle}>Personal Information</Text>
                                                <View style={styles.detailGrid}>
                                                    <DetailItem label="Full Name" value={selectedUser.full_name} />
                                                    <DetailItem label="Email" value={selectedUser.email} />
                                                    <DetailItem label="Phone" value={selectedUser.phone || 'N/A'} />
                                                    <DetailItem label="Role" value={selectedUser.role} />
                                                    <DetailItem label="Status" value={selectedUser.is_active ? 'Active' : 'Disabled'} />
                                                    <DetailItem label="User ID" value={selectedUser.id} fullWidth />
                                                </View>
                                            </View>

                                            {/* Physical Profile */}
                                            <View style={styles.detailSection}>
                                                <Text style={styles.detailSectionTitle}>Physical Profile</Text>
                                                <View style={styles.detailGrid}>
                                                    <DetailItem label="Gender" value={selectedUser.gender || 'N/A'} />
                                                    <DetailItem label="Height" value={selectedUser.height ? `${selectedUser.height} cm` : 'N/A'} />
                                                    <DetailItem label="Body Type" value={selectedUser.body_type || 'N/A'} />
                                                    <DetailItem label="Skin Tone" value={selectedUser.skin_tone || 'N/A'} />
                                                    <DetailItem label="Clothing Size" value={selectedUser.clothing_size || 'N/A'} />
                                                    <DetailItem label="Jewelry" value={selectedUser.jewelry_preference || 'N/A'} />
                                                </View>
                                            </View>

                                            {/* Preferences */}
                                            <View style={styles.detailSection}>
                                                <Text style={styles.detailSectionTitle}>Preferences</Text>
                                                <View style={styles.detailGrid}>
                                                    <DetailItem label="Fit Preference" value={selectedUser.fit_type} />
                                                    <DetailItem label="Auto-Fit" value={selectedUser.auto_fit ? 'Enabled' : 'Disabled'} />
                                                    <DetailItem label="Categories" value={selectedUser.preferred_categories?.join(', ') || 'None'} fullWidth />
                                                    <DetailItem label="Colors" value={selectedUser.preferred_colors?.join(', ') || 'None'} fullWidth />
                                                </View>
                                            </View>

                                            {/* Settings */}
                                            <View style={styles.detailSection}>
                                                <Text style={styles.detailSectionTitle}>Account Settings</Text>
                                                <View style={styles.detailGrid}>
                                                    <DetailItem label="Email Notif." value={selectedUser.notification_email ? 'On' : 'Off'} />
                                                    <DetailItem label="Push Notif." value={selectedUser.notification_push ? 'On' : 'Off'} />
                                                    <DetailItem label="HQ Rendering" value={selectedUser.hq_rendering ? 'On' : 'Off'} />
                                                    <DetailItem label="AR Mode" value={selectedUser.ar_mode ? 'Enabled' : 'Disabled'} />
                                                </View>
                                            </View>
                                        </ScrollView>
                                    )}
                                    <View style={styles.modalActions}>
                                        <TouchableOpacity style={styles.closeButton} onPress={() => setIsUserDetailModalOpen(false)}>
                                            <Text style={styles.closeButtonText}>Close</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>

                        {/* Add User Modal */}
                        <Modal visible={isAddUserModalOpen} transparent animationType="fade">
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Add New User</Text>
                                        <TouchableOpacity onPress={() => setIsAddUserModalOpen(false)}>
                                            <X size={24} color="#6B7280" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Full Name</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="John Doe"
                                            value={newUser.full_name}
                                            onChangeText={(text) => setNewUser({ ...newUser, full_name: text })}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Email Address</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="john@example.com"
                                            autoCapitalize="none"
                                            value={newUser.email}
                                            onChangeText={(text) => setNewUser({ ...newUser, email: text })}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Password</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="******"
                                            secureTextEntry
                                            value={newUser.password}
                                            onChangeText={(text) => setNewUser({ ...newUser, password: text })}
                                        />
                                    </View>
                                    <View style={styles.modalActions}>
                                        <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAddUserModalOpen(false)}>
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.saveButton} onPress={handleAddUserSubmit}>
                                            <Text style={styles.saveButtonText}>Add User</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    </ScrollView>
                );
            case 'Products':
                return (
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.contentScroll}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m }}>
                            <Text style={styles.pageTitle}>Product Management</Text>
                            <TouchableOpacity style={styles.addButton} onPress={() => setIsAddProductModalOpen(true)}>
                                <Plus size={20} color={COLORS.white} />
                                <Text style={styles.addButtonText}>Add Product</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                            <View style={styles.searchBar}>
                                <Search size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
                            {['All', ...categories.map(c => c.name)].map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
                                    onPress={() => setFilterCategory(cat)}
                                >
                                    <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {loadingProducts ? (
                            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                        ) : (
                            <View style={styles.productGrid}>
                                {products.filter(p => {
                                    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
                                    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
                                    return matchesSearch && matchesCategory;
                                }).map((product) => (
                                    <View key={product.id} style={styles.productCard}>
                                        <View style={styles.productImageContainer}>
                                            {product.image_url ? (
                                                <Image source={{ uri: product.image_url }} style={styles.productImage} resizeMode="contain" />
                                            ) : (
                                                <ShoppingBag size={40} color="#D1D5DB" />
                                            )}
                                            <TouchableOpacity
                                                style={[styles.statusBadge, product.is_active ? styles.statusActive : styles.statusInactive]}
                                                onPress={() => handleToggleProductStatus(product.id, product.is_active)}
                                            >
                                                <Text style={styles.statusText}>{product.is_active ? 'Active' : 'Hidden'}</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.productInfo}>
                                            <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                                            <Text style={styles.productCategory}>{product.gender} • {product.category}</Text>
                                            <Text style={styles.productType}>{product.tryon_type}</Text>
                                        </View>
                                        <View style={styles.productActions}>
                                            <TouchableOpacity style={styles.iconBtn} onPress={() => { setSelectedProduct(product); setIsProductDetailModalOpen(true); }}>
                                                <Eye size={16} color="#4F46E5" />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.iconBtn} onPress={() => openEditProductModal(product)}>
                                                <Edit2 size={16} color="#F59E0B" />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.iconBtn} onPress={() => handleToggleProductStatus(product.id, product.is_active)}>
                                                {product.is_active ? (
                                                    <Ban size={16} color="#DC2626" />
                                                ) : (
                                                    <CheckCircle size={16} color="#10B981" />
                                                )}
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteProduct(product.id)}>
                                                <Trash2 size={16} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}



                        {/* Add Product Modal */}
                        <Modal visible={isAddProductModalOpen} transparent animationType="slide">
                            <View style={styles.modalOverlay}>
                                <View style={[styles.modalContent, { maxWidth: 600 }]}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Add Try-On Product</Text>
                                        <TouchableOpacity onPress={() => setIsAddProductModalOpen(false)}>
                                            <X size={24} color="#6B7280" />
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView style={styles.modalBody}>
                                        {/* Image Upload */}
                                        <View style={{ alignItems: 'center', marginBottom: SPACING.m }}>
                                            <TouchableOpacity onPress={pickProductImage} style={{
                                                width: 120, height: 120, borderRadius: 8, borderWidth: 2,
                                                borderColor: '#E5E7EB', borderStyle: 'dashed',
                                                justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB'
                                            }}>
                                                {newProduct.image ? (
                                                    <Image source={{ uri: newProduct.image }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                                                ) : (
                                                    <View style={{ alignItems: 'center' }}>
                                                        <Plus size={24} color="#9CA3AF" />
                                                        <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>Add Image</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                            <Text style={styles.helperText}>Transparent PNG recommended</Text>
                                        </View>

                                        {/* Form Fields */}
                                        <View style={[styles.row, { zIndex: 20 }]}>
                                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                                <Text style={styles.label}>Product Name</Text>
                                                <TextInput style={styles.input} value={newProduct.name} onChangeText={t => setNewProduct({ ...newProduct, name: t })} placeholder="Blue Denim Jacket" />
                                            </View>
                                            <View style={[styles.inputGroup, { flex: 1, zIndex: 10 }]}>
                                                <Text style={styles.label}>Category</Text>
                                                <TouchableOpacity
                                                    style={[styles.input, { justifyContent: 'center' }]}
                                                    onPress={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                                >
                                                    <Text style={{ color: newProduct.category ? COLORS.black : '#9CA3AF' }}>
                                                        {newProduct.category || "Select Category"}
                                                    </Text>
                                                </TouchableOpacity>
                                                {isCategoryDropdownOpen && (
                                                    <View style={{
                                                        position: 'absolute', top: 75, left: 0, right: 0,
                                                        backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB',
                                                        borderRadius: 8, zIndex: 100, elevation: 5, maxHeight: 150
                                                    }}>
                                                        <ScrollView nestedScrollEnabled>
                                                            {categories.map((cat) => (
                                                                <TouchableOpacity
                                                                    key={cat.id}
                                                                    style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                                                                    onPress={() => {
                                                                        setNewProduct({ ...newProduct, category: cat.name });
                                                                        setIsCategoryDropdownOpen(false);
                                                                    }}
                                                                >
                                                                    <Text>{cat.name}</Text>
                                                                </TouchableOpacity>
                                                            ))}
                                                            {categories.length === 0 && (
                                                                <View style={{ padding: 12 }}>
                                                                    <Text style={{ color: '#9CA3AF', fontStyle: 'italic' }}>No categories found</Text>
                                                                </View>
                                                            )}
                                                        </ScrollView>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        <View style={styles.row}>
                                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                                <Text style={styles.label}>Gender</Text>
                                                <TextInput style={styles.input} value={newProduct.gender} onChangeText={t => setNewProduct({ ...newProduct, gender: t })} placeholder="Men, Women, Unisex" />
                                            </View>
                                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                                <Text style={styles.label}>Try-On Type</Text>
                                                <TextInput style={styles.input} value={newProduct.tryon_type} onChangeText={t => setNewProduct({ ...newProduct, tryon_type: t })} placeholder="Upper body, Full body..." />
                                            </View>
                                        </View>

                                        <Text style={styles.sectionTitle}>Alignment Configuration</Text>
                                        <View style={styles.row}>
                                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                                <Text style={styles.label}>Scale (1.0 = 100%)</Text>
                                                <TextInput style={styles.input} value={newProduct.overlay_scale} onChangeText={t => setNewProduct({ ...newProduct, overlay_scale: t })} keyboardType="numeric" />
                                            </View>
                                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                                <Text style={styles.label}>Rotation (Degrees)</Text>
                                                <TextInput style={styles.input} value={newProduct.rotation} onChangeText={t => setNewProduct({ ...newProduct, rotation: t })} keyboardType="numeric" />
                                            </View>
                                        </View>
                                        <View style={styles.row}>
                                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                                <Text style={styles.label}>Offset X</Text>
                                                <TextInput style={styles.input} value={newProduct.offset_x} onChangeText={t => setNewProduct({ ...newProduct, offset_x: t })} keyboardType="numeric" />
                                            </View>
                                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                                <Text style={styles.label}>Offset Y</Text>
                                                <TextInput style={styles.input} value={newProduct.offset_y} onChangeText={t => setNewProduct({ ...newProduct, offset_y: t })} keyboardType="numeric" />
                                            </View>
                                        </View>
                                    </ScrollView>

                                    <View style={styles.modalActions}>
                                        <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAddProductModalOpen(false)}>
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.saveButton} onPress={handleAddProductSubmit}>
                                            <Text style={styles.saveButtonText}>Save Product</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>

                        {/* Product Details Modal */}
                        <Modal visible={isProductDetailModalOpen} transparent animationType="fade" onRequestClose={() => setIsProductDetailModalOpen(false)}>
                            <View style={styles.modalOverlay}>
                                <View style={[styles.modalContent, styles.detailModalContent, !isDesktop && styles.detailModalMobile]}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Product Details</Text>
                                        <TouchableOpacity onPress={() => setIsProductDetailModalOpen(false)}>
                                            <X size={24} color="#6B7280" />
                                        </TouchableOpacity>
                                    </View>

                                    {selectedProduct && (
                                        <ScrollView style={styles.modalBody}>
                                            <View style={styles.detailHeader}>
                                                <View style={styles.detailImageContainer}>
                                                    {selectedProduct.image_url ? (
                                                        <Image source={{ uri: selectedProduct.image_url }} style={[styles.detailAvatar, { width: 120, height: 120 }]} resizeMode="contain" />
                                                    ) : (
                                                        <ShoppingBag size={80} color="#D1D5DB" />
                                                    )}
                                                </View>
                                                <View style={{ flex: 1, justifyContent: 'center' }}>
                                                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937' }}>{selectedProduct.name}</Text>
                                                    <View style={[styles.roleBadge, selectedProduct.is_active ? styles.roleAdmin : styles.roleInactive, { alignSelf: 'flex-start', marginTop: 8 }]}>
                                                        <Text style={styles.roleText}>{selectedProduct.is_active ? 'Active' : 'Inactive'}</Text>
                                                    </View>
                                                </View>
                                            </View>

                                            <View style={styles.detailSection}>
                                                <Text style={styles.detailSectionTitle}>Basic Info</Text>
                                                <View style={styles.detailGrid}>
                                                    <DetailItem label="Category" value={selectedProduct.category} />
                                                    <DetailItem label="Gender" value={selectedProduct.gender} />
                                                    <DetailItem label="Try-On Type" value={selectedProduct.tryon_type} />
                                                    <DetailItem label="Description" value={selectedProduct.description || 'No description'} fullWidth />
                                                </View>
                                            </View>

                                            <View style={styles.detailSection}>
                                                <Text style={styles.detailSectionTitle}>Alignment Configuration</Text>
                                                <View style={styles.detailGrid}>
                                                    <DetailItem label="Scale" value={selectedProduct.overlay_scale} />
                                                    <DetailItem label="Rotation" value={`${selectedProduct.rotation}°`} />
                                                    <DetailItem label="Offset X" value={selectedProduct.offset_x} />
                                                    <DetailItem label="Offset Y" value={selectedProduct.offset_y} />
                                                    <DetailItem label="Body Mapping" value={selectedProduct.body_mapping || 'None'} fullWidth />
                                                </View>
                                            </View>

                                            <View style={styles.detailSection}>
                                                <Text style={styles.detailSectionTitle}>Metadata</Text>
                                                <View style={styles.detailGrid}>
                                                    <DetailItem label="Product ID" value={selectedProduct.id} fullWidth />
                                                    <DetailItem label="Created At" value={selectedProduct.created_at ? new Date(selectedProduct.created_at).toLocaleDateString() : 'N/A'} />
                                                </View>
                                            </View>
                                        </ScrollView>
                                    )}
                                    <View style={styles.modalActions}>
                                        <TouchableOpacity style={styles.closeButton} onPress={() => setIsProductDetailModalOpen(false)}>
                                            <Text style={styles.closeButtonText}>Close</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    </ScrollView >
                );
            case 'Categories':
                return (
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.contentScroll}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m }}>
                            <Text style={styles.pageTitle}>Category Management</Text>
                            <TouchableOpacity style={styles.addButton} onPress={() => setIsAddCategoryModalOpen(true)}>
                                <Plus size={20} color={COLORS.white} />
                                <Text style={styles.addButtonText}>Add Category</Text>
                            </TouchableOpacity>
                        </View>

                        {loadingCategories ? (
                            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                        ) : (
                            <View style={styles.productGrid}>
                                {categories.map((category) => (
                                    <View key={category.id} style={styles.productCard}>
                                        <View style={styles.productImageContainer}>
                                            {category.image_url ? (
                                                <Image source={{ uri: category.image_url }} style={styles.productImage} resizeMode="contain" />
                                            ) : (
                                                <Layers size={40} color="#D1D5DB" />
                                            )}
                                        </View>
                                        <View style={styles.productInfo}>
                                            <Text style={styles.productName} numberOfLines={1}>{category.name}</Text>
                                            <Text style={styles.productCategory}>{category.description || 'No description'}</Text>
                                        </View>
                                        <View style={styles.productActions}>
                                            <TouchableOpacity style={styles.iconBtn} onPress={() => openEditCategoryModal(category)}>
                                                <Edit2 size={16} color="#F59E0B" />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteCategory(category.id)}>
                                                <Trash2 size={16} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Add/Edit Category Modal */}
                        <Modal visible={isAddCategoryModalOpen} transparent animationType="slide">
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>{newCategory.isEditing ? 'Edit Category' : 'Add Category'}</Text>
                                        <TouchableOpacity onPress={() => setIsAddCategoryModalOpen(false)}>
                                            <X size={24} color="#6B7280" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={{ alignItems: 'center', marginBottom: SPACING.m }}>
                                        <TouchableOpacity onPress={pickCategoryImage} style={{
                                            width: 120, height: 120, borderRadius: 8, borderWidth: 2,
                                            borderColor: '#E5E7EB', borderStyle: 'dashed',
                                            justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB'
                                        }}>
                                            {newCategory.image ? (
                                                <Image source={{ uri: newCategory.image }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                                            ) : (
                                                <View style={{ alignItems: 'center' }}>
                                                    <Plus size={24} color="#9CA3AF" />
                                                    <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>Add Image</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Category Name</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Tops"
                                            value={newCategory.name}
                                            onChangeText={(text) => setNewCategory({ ...newCategory, name: text })}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Description</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Upper body wear..."
                                            value={newCategory.description}
                                            onChangeText={(text) => setNewCategory({ ...newCategory, description: text })}
                                        />
                                    </View>

                                    <View style={styles.modalActions}>
                                        <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAddCategoryModalOpen(false)}>
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.saveButton} onPress={handleAddCategorySubmit}>
                                            <Text style={styles.saveButtonText}>{newCategory.isEditing ? 'Update' : 'Save'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    </ScrollView>
                );
            case 'Categories':
                return (
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.contentScroll}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m }}>
                            <Text style={styles.pageTitle}>Category Management</Text>
                            <TouchableOpacity style={styles.addButton} onPress={() => setIsAddCategoryModalOpen(true)}>
                                <Plus size={20} color={COLORS.white} />
                                <Text style={styles.addButtonText}>Add Category</Text>
                            </TouchableOpacity>
                        </View>

                        {loadingCategories ? (
                            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                        ) : (
                            <View style={styles.productGrid}>
                                {categories.map((category) => (
                                    <View key={category.id} style={styles.productCard}>
                                        <View style={styles.productImageContainer}>
                                            {category.image_url ? (
                                                <Image source={{ uri: category.image_url }} style={styles.productImage} resizeMode="contain" />
                                            ) : (
                                                <Layers size={40} color="#D1D5DB" />
                                            )}
                                        </View>
                                        <View style={styles.productInfo}>
                                            <Text style={styles.productName} numberOfLines={1}>{category.name}</Text>
                                            <Text style={styles.productCategory}>{category.description || 'No description'}</Text>
                                        </View>
                                        <View style={styles.productActions}>
                                            <TouchableOpacity style={styles.iconBtn} onPress={() => openEditCategoryModal(category)}>
                                                <Edit2 size={16} color="#F59E0B" />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteCategory(category.id)}>
                                                <Trash2 size={16} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Add/Edit Category Modal */}
                        <Modal visible={isAddCategoryModalOpen} transparent animationType="slide">
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>{newCategory.isEditing ? 'Edit Category' : 'Add Category'}</Text>
                                        <TouchableOpacity onPress={() => setIsAddCategoryModalOpen(false)}>
                                            <X size={24} color="#6B7280" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={{ alignItems: 'center', marginBottom: SPACING.m }}>
                                        <TouchableOpacity onPress={pickCategoryImage} style={{
                                            width: 120, height: 120, borderRadius: 8, borderWidth: 2,
                                            borderColor: '#E5E7EB', borderStyle: 'dashed',
                                            justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB'
                                        }}>
                                            {newCategory.image ? (
                                                <Image source={{ uri: newCategory.image }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                                            ) : (
                                                <View style={{ alignItems: 'center' }}>
                                                    <Plus size={24} color="#9CA3AF" />
                                                    <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>Add Image</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Category Name</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Tops"
                                            value={newCategory.name}
                                            onChangeText={(text) => setNewCategory({ ...newCategory, name: text })}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Description</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Upper body wear..."
                                            value={newCategory.description}
                                            onChangeText={(text) => setNewCategory({ ...newCategory, description: text })}
                                        />
                                    </View>

                                    <View style={styles.modalActions}>
                                        <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAddCategoryModalOpen(false)}>
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.saveButton} onPress={handleAddCategorySubmit}>
                                            <Text style={styles.saveButtonText}>{newCategory.isEditing ? 'Update' : 'Save'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    </ScrollView>
                );
            case 'Settings':
                return (
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.contentScroll, { alignItems: 'center' }]}>
                        <View style={{ width: '100%', maxWidth: 600 }}>
                            <Text style={styles.pageTitle}>Admin Settings</Text>

                            <View style={[styles.card, { padding: SPACING.xl, flexDirection: 'column' }]}>
                                {/* Profile Image Section */}
                                <View style={{ alignItems: 'center', marginBottom: SPACING.xl }}>
                                    <TouchableOpacity onPress={pickProfileImage} style={{ position: 'relative' }}>
                                        <View style={{
                                            width: 120, height: 120, borderRadius: 60, backgroundColor: '#F3F4F6',
                                            justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: COLORS.primary
                                        }}>
                                            {settingsData.profile_image ? (
                                                <Image source={{ uri: settingsData.profile_image }} style={{ width: '100%', height: '100%' }} />
                                            ) : (
                                                <User size={60} color="#9CA3AF" />
                                            )}
                                        </View>
                                        <View style={{
                                            position: 'absolute', bottom: 5, right: 5, backgroundColor: COLORS.primary,
                                            padding: 10, borderRadius: 20, borderWidth: 3, borderColor: 'white'
                                        }}>
                                            <Edit2 size={18} color="white" />
                                        </View>
                                    </TouchableOpacity>
                                    <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>Tap to change profile picture</Text>
                                </View>

                                {/* Personal Info Section */}
                                <Text style={[styles.sectionTitle, { marginBottom: SPACING.m, color: COLORS.primary }]}>Personal Information</Text>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Full Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={settingsData.full_name}
                                        onChangeText={t => setSettingsData({ ...settingsData, full_name: t })}
                                        placeholder="e.g. John Doe"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Email Address</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: '#F9FAFB', color: '#9CA3AF', borderColor: '#E5E7EB' }]}
                                        value={settingsData.email}
                                        editable={false}
                                    />
                                    <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Email cannot be changed</Text>
                                </View>

                                <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: SPACING.xl }} />

                                {/* Security Section */}
                                <Text style={[styles.sectionTitle, { marginBottom: SPACING.m, color: COLORS.primary }]}>Security</Text>
                                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: SPACING.m }}>
                                    To change your password, please enter your current password followed by the new one.
                                </Text>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Current Password</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingRight: 10 }}>
                                        <TextInput
                                            style={[styles.input, { flex: 1, borderWidth: 0, paddingVertical: SPACING.m }]}
                                            value={settingsData.current_password}
                                            onChangeText={t => setSettingsData({ ...settingsData, current_password: t })}
                                            secureTextEntry={!showCurrentPass}
                                            placeholder="Enter current password"
                                        />
                                        <TouchableOpacity onPress={() => setShowCurrentPass(!showCurrentPass)}>
                                            {showCurrentPass ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>New Password</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingRight: 10 }}>
                                        <TextInput
                                            style={[styles.input, { flex: 1, borderWidth: 0, paddingVertical: SPACING.m }]}
                                            value={settingsData.new_password}
                                            onChangeText={t => setSettingsData({ ...settingsData, new_password: t })}
                                            secureTextEntry={!showNewPass}
                                            placeholder="Enter new password"
                                        />
                                        <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)}>
                                            {showNewPass ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Confirm New Password</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingRight: 10 }}>
                                        <TextInput
                                            style={[styles.input, { flex: 1, borderWidth: 0, paddingVertical: SPACING.m }]}
                                            value={settingsData.confirm_password}
                                            onChangeText={t => setSettingsData({ ...settingsData, confirm_password: t })}
                                            secureTextEntry={!showConfirmPass}
                                            placeholder="Confirm new password"
                                        />
                                        <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)}>
                                            {showConfirmPass ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.saveButton, { marginTop: SPACING.xl, alignSelf: 'flex-start', paddingHorizontal: SPACING.xl, paddingVertical: 12 }]}
                                    onPress={handleUpdateSettings}
                                    disabled={loadingSettings}
                                >
                                    {loadingSettings ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={[styles.saveButtonText, { fontSize: 16 }]}>Save Changes</Text>
                                    )}
                                </TouchableOpacity>

                                <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: SPACING.xl }} />

                                {/* Danger Zone */}
                                <Text style={[styles.sectionTitle, { marginBottom: SPACING.m, color: '#EF4444' }]}>Danger Zone</Text>
                                <View style={{
                                    borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FEF2F2',
                                    borderRadius: 8, padding: SPACING.m
                                }}>
                                    <Text style={{ fontSize: 14, color: '#991B1B', marginBottom: SPACING.m }}>
                                        Deleting your account is permanent. All your data including products and categories will be removed.
                                    </Text>
                                    <TouchableOpacity
                                        style={{
                                            flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF4444',
                                            paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignSelf: 'flex-start'
                                        }}
                                        onPress={handleDeleteAccount}
                                    >
                                        <Trash2 size={16} color="white" style={{ marginRight: 8 }} />
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Delete Account</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                );
            default:
                return (
                    <View style={styles.placeholderView}>
                        <Text style={styles.placeholderText}>{activeTab} Content</Text>
                    </View>
                );
        }
    };

    return (
        <SafeAreaView style={[styles.container, { height: height }, Platform.OS === 'web' && { overflow: 'hidden' }]}>
            <View style={styles.mainLayout}>
                {/* Sidebar - Conditional Rendering for Mobile overlay */}
                {isSidebarOpen && (
                    <>
                        {/* Overlay for mobile */}
                        {!isDesktop && (
                            <TouchableOpacity
                                style={styles.sidebarOverlay}
                                onPress={() => setIsSidebarOpen(false)}
                                activeOpacity={1}
                            />
                        )}
                        <View style={[styles.sidebar, !isDesktop && styles.sidebarMobile, { height: height }]}>
                            <View style={styles.profileSection}>
                                <View style={styles.avatarContainer}>
                                    {adminProfile?.profile_image_url ? (
                                        <Image source={{ uri: adminProfile.profile_image_url }} style={styles.avatar} />
                                    ) : (
                                        <User size={30} color={COLORS.white} />
                                    )}
                                </View>
                                <View>
                                    <Text style={styles.profileName}>{adminProfile?.full_name || 'Admin User'}</Text>
                                    <Text style={styles.profileStatus}>● Online</Text>
                                </View>
                            </View>

                            <View style={styles.menuContainer}>
                                <Text style={styles.menuHeader}>General</Text>
                                {menuItems.map((item) => (
                                    <TouchableOpacity
                                        key={item.name}
                                        style={[styles.menuItem, activeTab === item.name && styles.menuItemActive]}
                                        onPress={() => {
                                            setActiveTab(item.name);
                                            if (!isDesktop) setIsSidebarOpen(false); // Close on mobile select
                                        }}
                                    >
                                        <item.icon size={20} color={activeTab === item.name ? '#FF6B00' : '#8A94A6'} />
                                        <Text style={[styles.menuText, activeTab === item.name && styles.menuTextActive]}>
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                                <LogOut size={20} color="#8A94A6" />
                                <Text style={styles.logoutText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {/* Main Content */}
                <View style={[styles.contentArea, Platform.OS === 'web' && isDesktop && isSidebarOpen && { marginLeft: 250 }]}>
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={toggleSidebar} style={styles.menuToggle}>
                            <Menu size={24} color={COLORS.white} />
                        </TouchableOpacity>
                        <Text style={styles.brandTitle}>Admin<Text style={{ color: '#FF6B00' }}>Panel</Text></Text>
                    </View>
                    {renderContent()}
                </View>
            </View>
        </SafeAreaView>
    );
};

const DashboardCard = ({ icon: Icon, title, value, color }) => (
    <View style={styles.card}>
        <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
            <Icon size={24} color={color} />
        </View>
        <View>
            <Text style={styles.cardValue}>{value}</Text>
            <Text style={styles.cardTitle}>{title}</Text>
        </View>
    </View>
);

const DetailItem = ({ label, value, fullWidth }) => (
    <View style={[styles.detailItem, fullWidth && styles.detailItemFull]}>
        <Text style={styles.detailLabelText}>{label}</Text>
        <Text style={styles.detailValueText}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    mainLayout: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebar: {
        width: 250,
        backgroundColor: '#1A2236',
        paddingTop: SPACING.l,
        display: 'flex',
        flexDirection: 'column',
        // zIndex: 100, // No, only on mobile
        height: '100%',
        ...Platform.select({
            web: {
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0, // Ensure full height on web
            }
        })
    },
    sidebarMobile: {
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 50,
    },
    sidebarOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 40,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        marginBottom: SPACING.xl,
        paddingBottom: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: '#2A3449',
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#2A3449',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.s,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    profileName: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    profileStatus: {
        color: '#10B981',
        fontSize: 12,
        marginTop: 2,
    },
    menuContainer: {
        flex: 1,
    },
    menuHeader: {
        color: '#8A94A6',
        fontSize: 12,
        textTransform: 'uppercase',
        marginLeft: SPACING.m,
        marginBottom: SPACING.s,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: SPACING.m,
        marginBottom: 2,
    },
    menuItemActive: {
        backgroundColor: '#2A3449',
        borderLeftWidth: 3,
        borderLeftColor: '#FF6B00',
    },
    menuText: {
        color: '#8A94A6',
        marginLeft: SPACING.m,
        fontSize: 14,
    },
    menuTextActive: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: '#2A3449',
    },
    logoutText: {
        color: '#8A94A6',
        marginLeft: SPACING.m,
    },
    contentArea: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    topBar: {
        height: 60,
        backgroundColor: '#2A3449', // Using dark header to match style or White? Image had Orange toggle + brand
        // Let's make top bar Orange as per image branding header
        backgroundColor: '#FF6B00',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        justifyContent: 'space-between'
    },
    menuToggle: {
        padding: SPACING.s,
    },
    brandTitle: {
        color: COLORS.white,
        fontSize: 20,
        fontWeight: 'bold',
    },
    contentScroll: {
        padding: SPACING.l,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: SPACING.l,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.m,
        marginBottom: SPACING.xl,
    },
    card: {
        minWidth: 200,
        flex: 1,
        padding: SPACING.l,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconBox: {
        padding: SPACING.m,
        borderRadius: 50,
        marginRight: SPACING.m,
    },
    cardValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    cardTitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: SPACING.m,
        color: '#1F2937',
    },
    actionGrid: {
        flexDirection: 'row',
        gap: SPACING.m,
    },
    actionButton: {
        padding: SPACING.m,
        backgroundColor: '#1F2937',
        borderRadius: 8,
    },
    actionText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    chartPlaceholder: {
        backgroundColor: COLORS.white,
        padding: SPACING.l,
        borderRadius: 8,
        height: 300,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: SPACING.m,
        color: '#1F2937',
    },
    barChart: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        paddingBottom: SPACING.s,
    },
    bar: {
        width: 30,
        backgroundColor: '#FF6B00',
        borderRadius: 4,
    },
    placeholderView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#9CA3AF',
    },
    cardListContainer: {
        gap: SPACING.m,
        paddingBottom: SPACING.xl,
    },
    userCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.m,
        marginBottom: SPACING.s,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.m,
    },
    userInfoExpanded: {
        flexDirection: 'row',
        flex: 1,
        marginRight: SPACING.s,
    },
    userAvatarMedium: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2A3449',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.m,
        overflow: 'hidden',
    },
    userTextContainer: {
        justifyContent: 'center',
        flex: 1,
    },
    userEmailText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: SPACING.s,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        gap: 6,
    },
    statusBtn: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    deleteBtn: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
    },
    tableContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tableHeaderText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userAvatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2A3449',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.s,
        overflow: 'hidden',
    },
    userNameText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937',
    },
    cellText: {
        fontSize: 14,
        color: '#6B7280',
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    roleAdmin: {
        backgroundColor: '#DEF7EC',
    },
    roleUser: {
        backgroundColor: '#EFF6FF',
    },
    roleInactive: {
        backgroundColor: '#FEF2F2',
    },
    roleText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#1F2937',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B00',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    addButtonText: {
        color: COLORS.white,
        marginLeft: 8,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.m,
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        width: '100%',
        maxWidth: 500,
        maxHeight: '90%',
        display: 'flex',
        flexDirection: 'column',
    },
    detailModalContent: {
        width: '100%',
        maxWidth: 700,
    },
    detailModalMobile: {
        width: '100%',
        height: '100%',
        borderRadius: 0,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    inputGroup: {
        paddingHorizontal: SPACING.m,
        marginBottom: SPACING.m,
        marginTop: SPACING.s,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: SPACING.m,
        fontSize: 14,
        color: '#1F2937',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: SPACING.m,
    },
    cancelButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cancelButtonText: {
        color: '#6B7280',
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: '#FF6B00',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    saveButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    // New Styles for Details Modal
    viewBtn: {
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    modalBody: {
        padding: SPACING.m,
    },
    detailHeader: {
        flexDirection: 'row',
        gap: SPACING.l,
        marginBottom: SPACING.l,
    },
    detailImageContainer: {
        alignItems: 'center',
    },
    detailAvatar: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginTop: SPACING.s,
    },
    detailLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    detailSection: {
        marginBottom: SPACING.l,
    },
    detailSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: SPACING.s,
        borderLeftWidth: 3,
        borderLeftColor: '#FF6B00',
        paddingLeft: SPACING.s,
    },
    detailGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.m,
    },
    detailItem: {
        width: '45%', // Two columns
        marginBottom: SPACING.s,
    },
    detailItemFull: {
        width: '100%',
    },
    detailLabelText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 2,
    },
    detailValueText: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '500',
    },
    closeButton: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    closeButtonText: {
        color: '#374151',
        fontWeight: '600',
    },
    // Product Styles
    productGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.m,
    },
    productCard: {
        width: Platform.OS === 'web' ? 'calc(25% - 12px)' : '48%', // 4 columns on web, 2 on mobile
        minWidth: 160,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    productImageContainer: {
        height: 180,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    statusBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    statusActive: {
        backgroundColor: '#D1FAE5',
    },
    statusInactive: {
        backgroundColor: '#F3F4F6',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#065F46',
    },
    productInfo: {
        padding: SPACING.m,
    },
    productName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 2,
    },
    productCategory: {
        fontSize: 12,
        color: '#6B7280',
    },
    productType: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    productActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    iconBtn: {
        flex: 1,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        gap: SPACING.m,
    },
    helperText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
    searchContainer: {
        marginBottom: SPACING.m,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1F2937',
        height: '100%',
        ...Platform.select({
            web: { outlineStyle: 'none' }
        }),
    },
    filterRow: {
        marginBottom: SPACING.m,
    },
    filterRowContent: {
        paddingRight: SPACING.m,
        alignItems: 'center',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: SPACING.s,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterChipText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: COLORS.white,
    },
});
