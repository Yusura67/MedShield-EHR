import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/verifyToken.js';
import { createPatientSchema } from './patient.schema.js';
import { patientService } from './patient.service.js';

export const patientController = {
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const validatedData = createPatientSchema.parse(req.body);
            const clientInfo = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'Unknown'
            };

            const result = await patientService.createPatient(validatedData, req.user!, clientInfo);

            res.status(201).json({
                success: true,
                message: 'Patient registered successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const patientId = Number(req.params.id);
            const clientInfo = {
                ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'Unknown'
            };

            const result = await patientService.getPatientById(patientId, req.user!, clientInfo);

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

            const result = await patientService.listPatients(req.user!, clientInfo);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
};
