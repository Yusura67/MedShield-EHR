import { pool } from '../../config/db.js';
import { generateAuditHash } from '../../utils/crypto.js';

interface CreateAuditLogParams {
    userId: number | null;
    action: string;
    resourceType: string;
    resourceId: number;
    status: 'SUCCESS' | 'FAILURE' | 'UNAUTHORIZED';
    ipAddress: string;
    userAgent: string;
    details?: string;
}

export const recordAuditLog = async (params: CreateAuditLogParams): Promise<void> => {
    const timestamp = new Date().toISOString();
    const details = params.details || '';

    const logHash = generateAuditHash({
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        status: params.status,
        timestamp,
        details
    });

    await pool.query(
        `INSERT INTO audit_logs 
        (user_id, action, resource_type, resource_id, status, ip_address, user_agent, details, log_hash) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            params.userId,
            params.action,
            params.resourceType,
            params.resourceId,
            params.status,
            params.ipAddress.slice(0, 45),
            params.userAgent.slice(0, 255),
            details,
            logHash
        ]
    );
};
