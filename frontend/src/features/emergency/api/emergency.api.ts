import apiClient from '../../../api/axios';
import type { BreakGlassEvent, DeclareBreakGlassInput, ReviewBreakGlassInput } from '../types/emergency.types';

export const declareBreakGlassApi = async (data: DeclareBreakGlassInput): Promise<BreakGlassEvent> => {
    const response = await apiClient.post<{ success: boolean; data: BreakGlassEvent }>('/emergency/break-glass', data);
    return response.data.data;
};

export const checkActiveBreakGlassApi = async (patientId: number): Promise<{
    hasActiveOverride: boolean;
    event: {
        eventId: number;
        patientId: number;
        justification: string;
        expiredAt: string;
        remainingMinutes: number;
    } | null;
}> => {
    const response = await apiClient.get<{
        success: boolean;
        data: {
            hasActiveOverride: boolean;
            event: {
                eventId: number;
                patientId: number;
                justification: string;
                expiredAt: string;
                remainingMinutes: number;
            } | null;
        };
    }>(`/emergency/break-glass/active/${patientId}`);
    return response.data.data;
};

export const listBreakGlassEventsApi = async (): Promise<BreakGlassEvent[]> => {
    const response = await apiClient.get<{ success: boolean; data: BreakGlassEvent[] }>('/emergency/break-glass');
    return response.data.data;
};

export const reviewBreakGlassApi = async (eventId: number, data: ReviewBreakGlassInput): Promise<void> => {
    await apiClient.patch(`/emergency/break-glass/${eventId}/review`, data);
};
