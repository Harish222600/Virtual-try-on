import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.5:8000'; // Update with your backend URL

/**
 * Fetch all products with optional category filter
 */
export const fetchProducts = async (category = null) => {
    try {
        const url = category && category !== 'All'
            ? `${API_URL}/products?category=${category}`
            : `${API_URL}/products`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

/**
 * Process virtual try-on
 */
export const processTryOn = async (userImageUri, productId) => {
    try {
        const token = await AsyncStorage.getItem('token');

        if (!token) {
            throw new Error('Not authenticated');
        }

        const formData = new FormData();

        // Add user image
        formData.append('user_image', {
            uri: userImageUri,
            type: 'image/jpeg',
            name: 'user.jpg'
        });

        // Add product ID
        formData.append('product_id', productId);

        const response = await fetch(`${API_URL}/api/tryon/process`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Try-on processing failed');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error processing try-on:', error);
        throw error;
    }
};

/**
 * Fetch user's try-on history
 */
export const fetchTryOnHistory = async (limit = 20, skip = 0) => {
    try {
        const token = await AsyncStorage.getItem('token');

        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(
            `${API_URL}/api/tryon/history?limit=${limit}&skip=${skip}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch history');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching try-on history:', error);
        throw error;
    }
};

/**
 * Delete a try-on result
 */
export const deleteTryOnResult = async (tryonId) => {
    try {
        const token = await AsyncStorage.getItem('token');

        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(
            `${API_URL}/api/tryon/history/${tryonId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to delete try-on result');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error deleting try-on result:', error);
        throw error;
    }
};
