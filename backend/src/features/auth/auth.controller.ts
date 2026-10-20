// backend/src/features/auth/auth.controller.ts
// IMPORT MODULES.
import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from './auth.schema.js';
import { authService } from './auth.service.js';
import { AuthenticatedRequest } from '../../middlewares/verifyToken.js';

export const authController = {
    // REGISTER.
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const validatedData = registerSchema.parse(req.body);

            const newUser = await authService.register(validatedData);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: newUser
            });
        } catch (error) {
            next(error);
        }
    },

    // LOGIN
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const validatedData = loginSchema.parse(req.body);

            const result = await authService.login(validatedData);

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result
            });
        } catch (error) {
            next(error);
        }
    },

    // GET ME
    async getMe (req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;

            const currentUser = await authService.getMe(userId);

            res.status(200).json({
                success: true,
                data: {
                    user: currentUser
                }
            });
        } catch (error) {
            next(error);
        }
    }
};