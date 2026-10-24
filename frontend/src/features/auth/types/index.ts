// frontend/src/features/auth/types/index.ts

export type Role = 'doctor' | 'nurse' | 'patient' | 'auditor';

export interface User {
    id: number;
    username: string;
    email: string;
    role: Role;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterCredentials {
    username: string;
    password: string;
    email: string;
    role: Role;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        user: User;
    };
}