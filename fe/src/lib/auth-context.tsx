'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, User, AuthResponse } from './api';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem('datavault_token');
        if (storedToken) {
            setToken(storedToken);
            api.setToken(storedToken);
            // Fetch user data
            api.auth.me()
                .then((userData) => {
                    setUser(userData);
                })
                .catch(() => {
                    // Token invalid, clear it
                    localStorage.removeItem('datavault_token');
                    setToken(null);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const response: AuthResponse = await api.auth.login(email, password);
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem('datavault_token', response.token);
        api.setToken(response.token);
    }, []);

    const register = useCallback(async (email: string, password: string, name: string) => {
        const response: AuthResponse = await api.auth.register(email, password, name);
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem('datavault_token', response.token);
        api.setToken(response.token);
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.auth.logout();
        } catch {
            // Ignore logout errors
        }
        setUser(null);
        setToken(null);
        localStorage.removeItem('datavault_token');
        api.setToken(null);
    }, []);

    const refreshUser = useCallback(async () => {
        if (token) {
            try {
                const userData = await api.auth.me();
                setUser(userData);
            } catch {
                await logout();
            }
        }
    }, [token, logout]);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
