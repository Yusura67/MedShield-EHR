import apiClient from '../../../api/axios';
import type {
    Observation,
    CreateObservationInput,
    Condition,
    CreateConditionInput,
    Prescription,
    CreatePrescriptionInput
} from '../types/clinical.types';

export const getPatientObservationsApi = async (patientId: number): Promise<Observation[]> => {
    const response = await apiClient.get<{ success: boolean; data: Observation[] }>(`/clinical/observations/patient/${patientId}`);
    return response.data.data;
};

export const recordObservationApi = async (data: CreateObservationInput): Promise<Observation> => {
    const response = await apiClient.post<{ success: boolean; data: Observation }>('/clinical/observations', data);
    return response.data.data;
};

export const getPatientConditionsApi = async (patientId: number): Promise<Condition[]> => {
    const response = await apiClient.get<{ success: boolean; data: Condition[] }>(`/clinical/conditions/patient/${patientId}`);
    return response.data.data;
};

export const diagnoseConditionApi = async (data: CreateConditionInput): Promise<Condition> => {
    const response = await apiClient.post<{ success: boolean; data: Condition }>('/clinical/conditions', data);
    return response.data.data;
};

export const getPatientPrescriptionsApi = async (patientId: number): Promise<Prescription[]> => {
    const response = await apiClient.get<{ success: boolean; data: Prescription[] }>(`/clinical/prescriptions/patient/${patientId}`);
    return response.data.data;
};

export const createPrescriptionApi = async (data: CreatePrescriptionInput): Promise<Prescription> => {
    const response = await apiClient.post<{ success: boolean; data: Prescription }>('/clinical/prescriptions', data);
    return response.data.data;
};
