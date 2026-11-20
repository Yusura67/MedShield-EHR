import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/verifyToken.js';
import {
    declareBreakGlassSchema,
    reviewBreakGlassSchema
} from './emergency.schema.js';
import { emergencyService } from './emergency.service.js';

export const emergencyController = {
    async declare(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const validatedData = declareBreakGlassSchema.parse(req.body);
            const clientInfo = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'Unknown'
            };

            const result = await emergencyService.declareBreakGlass(validatedData, req.user!, clientInfo);

            res.status(201).json({
                success: true,
                message: 'Break-Glass emergency override granted successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async checkActive(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const patientId = Number(req.params.patientId);
            const result = await emergencyService.checkActiveBreakGlass(patientId, req.user!.id);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const clientInfo = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'Unknown'
            };

            const result = await emergencyService.listBreakGlassEvents(req.user!, clientInfo);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async review(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const eventId = Number(req.params.eventId);
            const validatedData = reviewBreakGlassSchema.parse(req.body);
            const clientInfo = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'Unknown'
            };

            const result = await emergencyService.reviewBreakGlassEvent(eventId, validatedData, req.user!, clientInfo);

            res.status(200).json({
                success: true,
                message: 'Break-Glass event reviewed successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
};
