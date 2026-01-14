import { API_URL } from './config';

// Re-export for backward compatibility if needed, or just use it directly in this file
export { API_URL };

export const login = async (email, password) => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Login failed');
        }

        return data;
    } catch (error) {
        throw error;
    }
};

export const signup = async (formData) => {
    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            body: formData,
            // Header Content-Type is determined automatically by the browser/fetch w/ boundary
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = typeof data.detail === 'string'
                ? data.detail
                : JSON.stringify(data.detail);
            throw new Error(errorMessage || 'Signup failed');
        }

        return data;
    } catch (error) {
        throw error;
    }
};

export const getProfile = async (token) => {
    try {
        const response = await fetch(`${API_URL}/users/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = typeof data.detail === 'string'
                ? data.detail
                : JSON.stringify(data.detail);
            throw new Error(errorMessage || 'Failed to fetch profile');
        }

        return data;
    } catch (error) {
        throw error;
    }
};

export const verifyEmail = async (email) => {
    try {
        const response = await fetch(`${API_URL}/verify-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Email verification failed');
        }

        return data;
    } catch (error) {
        throw error;
    }
};

export const resetPasswordDirect = async (email, newPassword, confirmPassword) => {
    try {
        const response = await fetch(`${API_URL}/reset-password-direct`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                new_password: newPassword,
                confirm_password: confirmPassword
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Password reset failed');
        }

        return data;
    } catch (error) {
        throw error;
    }
};
