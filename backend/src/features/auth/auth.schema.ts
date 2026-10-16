// backend/src/features/auth/auth.schema.ts
// IMPORT MODULE.
import { z } from 'zod';

export const registerSchema = z.object({
    username: z
        .string({ error: 'Username is required and must be a string' })
        .trim()
        .min(3, 'Username must be at least 3 characters')
        .max(64, 'Username must not exceed 64 characters'),
    
    password: z
        .string({ error: 'Password is required and must be a string' })
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password is too long'),

    role: z.enum(['doctor', 'nurse', 'patient', 'auditor'], {
        error: 'Role must be doctor, nurse, patient, or auditor'
    })
});

export const loginSchema = z.object({
    username: z
        .string({ error: 'Username is required' })
        .trim()
        .min(1, 'Username cannot be empty'),
        
    password: z
        .string({ error: 'Password is required' })
        .min(1, 'Password cannot be empty')
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;