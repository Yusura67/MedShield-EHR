import apiClient from '../../../api/axios';
import type { AuditLog } from '../types/audit.types';

export const getAuditLogsApi = async (): Promise<AuditLog[]> => {
    const response = await apiClient.get<{ success: boolean; data: AuditLog[] }>('/audit');
    return response.data.data;
};
