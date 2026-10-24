// frontend/src/features/auth/api/auth.api.ts
// IMPORT MODULE.
import { api } from "../../../api/axios.js";
import type { LoginCredentials, RegisterCredentials, AuthResponse, User } from "../types";

// LOGIN API.
export const loginApi = async (credential: LoginCredentials): Promise<AuthResponse['data']> => {
    const response = await api.post<AuthResponse>('/auth/login', credential);
    return response.data.data;
};

// REGISTER API.
export const registerApi = async (data: RegisterCredentials) => {
    const response = await api.post('/auth/register', data);
    return response.data;
};

// GET ME API.
export const getMeApi = async (): Promise<User> => {
    const response = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
    return response.data.data.user;
};