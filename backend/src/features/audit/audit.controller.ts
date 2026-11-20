import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/verifyToken.js';
import { auditService } from './audit.service.js';

export const auditController = {
    async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const clientInfo = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'Unknown'
            };

            const result = await auditService.getAuditLogs(req.user!, clientInfo);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
};
