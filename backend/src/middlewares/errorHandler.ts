// backend/src/middlewares/errorHandler.ts
// IMPORT MODULES.
import { Request, Response, NextFunction } from "express";
import { AppError } from '../utils/AppError.js';

export const globalErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    console.error('[ERROR] ' + req.method + req.url + ': ' , message);

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};