import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../../config/db.js';
import { generateAuditHash } from '../../utils/crypto.js';
import { AuthPayload } from '../../types/auth.types.js';

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

interface AuditLogRow extends RowDataPacket {
    log_id: number;
    user_id: number | null;
    action: string;
    resource_type: string;
    resource_id: number;
    status: 'SUCCESS' | 'FAILURE' | 'UNAUTHORIZED';
    ip_address: string;
    user_agent: string;
    details: string | null;
    log_hash: string;
    created_at: Date;
    username?: string | null;
    role?: string | null;
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

export const auditService = {
    async getAuditLogs(requester: AuthPayload, clientInfo: { ip: string; userAgent: string }) {
        const [logs] = await pool.query<AuditLogRow[]>(
            `SELECT a.*, u.username, u.role
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.user_id
            ORDER BY a.created_at DESC
            LIMIT 200`
        );

        return logs.map((log) => ({
            logId: log.log_id,
            userId: log.user_id,
            username: log.username || 'ANONYMOUS',
            role: log.role || 'N/A',
            action: log.action,
            resourceType: log.resource_type,
            resourceId: log.resource_id,
            status: log.status,
            ipAddress: log.ip_address,
            userAgent: log.user_agent,
            details: log.details,
            logHash: log.log_hash,
            createdAt: log.created_at
        }));
    }
};
