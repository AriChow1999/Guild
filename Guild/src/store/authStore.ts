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
    timeout_until?: boolean;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    // Theme State
    isLight: boolean;
    toggleTheme: () => void;
    // Actions
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

    // --- THEME INITIALIZATION ---
    // Check localStorage first, otherwise default to Dark (false)
    isLight: localStorage.getItem('theme') === 'light',

    toggleTheme: () => {
        const nextTheme = !get().isLight;
        const themeString = nextTheme ? 'light' : 'dark';
        
        // 1. Update State
        set({ isLight: nextTheme });
        
        // 2. Persist to LocalStorage
        localStorage.setItem('theme', themeString);
        
        // 3. Update DOM Attribute immediately
        document.documentElement.setAttribute('data-theme', themeString);
    },

    setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isLoading: false });
        get().checkTokenExpiry();
    },

    setUser: (user) => set({ user }),

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isLoading: false });
        window.location.href = '/';
    },

    checkAuth: async () => {
        const { token } = get();
        
        // Ensure the DOM attribute matches the saved theme on load
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);

        if (!token) {
            set({ user: null, token: null, isLoading: false });
            return;
        }
        try {
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
                setTimeout(() => {
                    get().logout();
                }, timeLeft);
            }
        } catch (error) {
            get().logout();
        }
    }
}));