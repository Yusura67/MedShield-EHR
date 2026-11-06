// frontend/src/context/AuthContext.tsx
// IMPORT MODULES
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, LoginCredentials } from '../features/auth/types';
import { loginApi, getMeApi, logoutApi } from '../features/auth/api/auth.api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credential: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [ user, setUser ] = useState<User | null>(null);
    const [ isLoading, setIsLoading ] = useState<boolean>(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const currentUser = await getMeApi();
                setUser(currentUser);
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        const loggedInUser = await loginApi(credentials);
        setUser(loggedInUser);
    };

    const logout = async () => {
        await logoutApi();
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
            }}
        >
            { children }
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};