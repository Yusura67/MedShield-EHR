import { api } from "../../../api/axios.js";
import type { LoginCredentials, RegisterCredentials, AuthResponse, User } from "../types";

export const loginApi = async (credential: LoginCredentials): Promise<User> => {
    const response = await api.post<AuthResponse>('/auth/login', credential);
    return response.data.data.user;
};

export const registerApi = async (data: RegisterCredentials) => {
    const response = await api.post('/auth/register', data);
    return response.data;
};

export const logoutApi = async (): Promise<void> => {
    await api.post('/auth/logout');
};

export const getMeApi = async (): Promise<User> => {
    const response = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
    return response.data.data.user;
};
