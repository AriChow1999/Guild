/* eslint-disable @typescript-eslint/no-unused-vars */

import { create } from 'zustand';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

interface User {
    id: string;
    username: string;
    email: string;
    bio?: string;
    is_banned?: boolean;
    timeout_until?:boolean;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    setAuth: (user: User, token: string) => void;
    setUser: (user: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
    checkTokenExpiry: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: localStorage.getItem('token'),
    isLoading: !!localStorage.getItem('token'),

    setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isLoading: false });
        get().checkTokenExpiry();
    },

    setUser: (user) => set({ user }),

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isLoading: false });
        // Redirect to login or home after clearing state
        window.location.href = '/';
    },

    checkAuth: async () => {
        const { token } = get();
        if (!token) {
            set({ user: null, token: null, isLoading: false });
            return;
        }
        try {
            // Pointing to your backend port 5000
            const res = await axios.get('http://localhost:5000/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            set({ user: res.data, token, isLoading: false });
            get().checkTokenExpiry();
        } catch (error) {
            get().logout();
        }
    },

    checkTokenExpiry: () => {
        const { token } = get();
        if (!token) return;

        try {
            const decoded = jwtDecode<{ exp: number }>(token);
            const currentTime = Date.now() / 1000;
            const timeLeft = (decoded.exp - currentTime) * 1000;

            if (timeLeft <= 0) {
                get().logout();
            } else {
                // Auto-logout when the token expires
                setTimeout(() => {
                    get().logout();
                }, timeLeft);
            }
        } catch (error) {
            get().logout();
        }
    }
}));