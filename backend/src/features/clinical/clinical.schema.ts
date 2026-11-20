import { z } from 'zod';

export const createObservationSchema = z.object({
    patientId: z.number().int().positive({ error: 'Patient ID is required' }),
    observationType: z.string({ error: 'Observation type is required' }).trim().min(1).max(50),
    value: z.string({ error: 'Value is required' }).trim().min(1).max(50),
    unit: z.string({ error: 'Unit is required' }).trim().min(1).max(20),
    interpretation: z.string({ error: 'Interpretation is required' }).trim().min(1).max(20),
    note: z.string().optional()
});

export const createConditionSchema = z.object({
    patientId: z.number().int().positive({ error: 'Patient ID is required' }),
    icd10Code: z.string({ error: 'ICD-10 code is required' }).trim().min(3).max(20),
    displayName: z.string({ error: 'Display name is required' }).trim().min(1).max(150),
    clinicalStatus: z.enum(['active', 'resolved', 'inactive'], { error: 'Invalid clinical status' }),
    confidentialityLevel: z.enum(['normal', 'restricted'], { error: 'Invalid confidentiality level' }),
    notes: z.string().optional(),
    diagnosedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/, { error: 'Invalid date format' }).optional()
});

export const createPrescriptionSchema = z.object({
    patientId: z.number().int().positive({ error: 'Patient ID is required' }),
    conditionId: z.number().int().positive().optional(),
    medicationName: z.string({ error: 'Medication name is required' }).trim().min(1).max(100),
    dosage: z.string({ error: 'Dosage is required' }).trim().min(1).max(50),
    frequency: z.string({ error: 'Frequency is required' }).trim().min(1).max(50),
    route: z.string({ error: 'Route is required' }).trim().min(1).max(20),
    status: z.enum(['active', 'completed', 'cancelled'], { error: 'Invalid prescription status' }),
    instructions: z.string().optional()
});

export type CreateObservationInput = z.infer<typeof createObservationSchema>;
export type CreateConditionInput = z.infer<typeof createConditionSchema>;
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
