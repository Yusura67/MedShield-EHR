import { z } from 'zod';

export const createPatientSchema = z.object({
    userId: z.number().int().positive().optional(),
    firstName: z.string({ error: 'First name is required' }).trim().min(1).max(50),
    lastName: z.string({ error: 'Last name is required' }).trim().min(1).max(50),
    dateOfBirth: z.string({ error: 'Date of birth is required' }).regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Date of birth must be in YYYY-MM-DD format' }),
    gender: z.enum(['male', 'female', 'other'], { error: 'Gender must be male, female, or other' }),
    nationalId: z.string({ error: 'National ID is required' }).trim().min(5).max(30),
    phoneNumber: z.string({ error: 'Phone number is required' }).trim().min(9).max(20),
    bloodType: z.string({ error: 'Blood type is required' }).trim().min(1).max(5),
    allergies: z.string().optional(),
    emergencyContact: z.string().max(100).optional()
});

export const updatePatientSchema = createPatientSchema.partial();

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
