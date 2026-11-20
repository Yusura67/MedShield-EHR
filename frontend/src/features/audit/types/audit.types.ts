export interface AuditLog {
    logId: number;
    userId: number | null;
    username: string;
    role: string;
    action: string;
    resourceType: string;
    resourceId: number;
    status: 'SUCCESS' | 'FAILURE' | 'UNAUTHORIZED';
    ipAddress: string;
    userAgent: string;
    details: string | null;
    logHash: string;
    createdAt: string;
}
