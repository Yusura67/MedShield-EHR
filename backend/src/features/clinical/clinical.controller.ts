import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/verifyToken.js';
import {
    createObservationSchema,
    createConditionSchema,
    createPrescriptionSchema
} from './clinical.schema.js';
import { clinicalService } from './clinical.service.js';

export const clinicalController = {
    async recordObservation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const validatedData = createObservationSchema.parse(req.body);
            const clientInfo = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'Unknown'
            };

            const result = await clinicalService.recordObservation(validatedData, req.user!, clientInfo);

            res.status(201).json({
                success: true,
                message: 'Observation recorded successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async getPatientObservations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const patientId = Number(req.params.patientId);
            const clientInfo = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'Unknown'
            };

            const result = await clinicalService.getPatientObservations(patientId, req.user!, clientInfo);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async diagnoseCondition(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const validatedData = createConditionSchema.parse(req.body);
            const clientInfo = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'Unknown'
            };

            const result = await clinicalService.diagnoseCondition(validatedData, req.user!, clientInfo);

            res.status(201).json({
                success: true,
                message: 'Condition diagnosed and recorded successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async getPatientConditions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const patientId = Number(req.params.patientId);
            const clientInfo = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'Unknown'
            };

            const result = await clinicalService.getPatientConditions(patientId, req.user!, clientInfo);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async createPrescription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const validatedData = createPrescriptionSchema.parse(req.body);
            const clientInfo = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'Unknown'
            };

            const result = await clinicalService.createPrescription(validatedData, req.user!, clientInfo);

            res.status(201).json({
                success: true,
                message: 'Prescription created successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async getPatientPrescriptions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const patientId = Number(req.params.patientId);
            const clientInfo = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'Unknown'
            };

            const result = await clinicalService.getPatientPrescriptions(patientId, req.user!, clientInfo);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
};
