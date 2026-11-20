import apiClient from '../../../api/axios';
import type { Patient, CreatePatientInput } from '../types/patient.types';

export const getPatientsApi = async (): Promise<Patient[]> => {
    const response = await apiClient.get<{ success: boolean; data: Patient[] }>('/patients');
    return response.data.data;
};

export const getPatientByIdApi = async (patientId: number): Promise<Patient> => {
    const response = await apiClient.get<{ success: boolean; data: Patient }>(`/patients/${patientId}`);
    return response.data.data;
};

export const createPatientApi = async (data: CreatePatientInput): Promise<Patient> => {
    const response = await apiClient.post<{ success: boolean; data: Patient }>('/patients', data);
    return response.data.data;
};
