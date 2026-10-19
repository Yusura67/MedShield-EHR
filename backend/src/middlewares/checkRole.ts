// backend/src/middlewares/checkRole.ts
// IMPORT MODULE.
import { Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { AuthenticatedRequest } from "./verifyToken.js";

// CHECK ROLE.
export const checkRole = (...allowdRoles: Array<'doctor' | 'nurse' | 'patient' | 'auditor'>) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        // Validate user.
        if (!req.user) {
            return next(new AppError("Unauthorized. Please log in first", 401));
        }

        // Validate Role.
        if (!allowdRoles.includes(req.user.role)) {
            return next(new AppError(`Forbidden. Requires one of: [${allowdRoles.join(', ')}]`, 403));
        }

        // NextFunction.
        next();
    };
};