// backend/src/middlewares/verifyToken.ts
// IMPORT MODULES.
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import { CONFIG } from '../config/env.js';
import { AuthPayload } from '../types/auth.types.js';

export interface AuthenticatedRequest extends Request {
    user?: AuthPayload;
}

// VERIFY TOKEN MIDDLEWARE.
export const verifyToken = (req: AuthenticatedRequest, res: Response, next:NextFunction): void => {
    const token = req.cookies?.token;

    if (!token) {
        return next(new AppError('Access denied. No token Provided.', 401))
    }

    try {
        // Decoded.
        const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as AuthPayload;

        // NextFunction.
        req.user = decoded;
        next();

    } catch(error) {
        // ERROR HANDLING.
        if (error instanceof jwt.TokenExpiredError) {
            return next(new AppError('Token has expired. Please log in again.', 401));
        }
        
        if (error instanceof jwt.JsonWebTokenError) {
            return next(new AppError('Invalid token signature.', 401));
        }
        
        console.error('SYSTEM ERROR in verifyToken:', error);
        return next(new AppError('Internal authentication error.', 500));
    }
}