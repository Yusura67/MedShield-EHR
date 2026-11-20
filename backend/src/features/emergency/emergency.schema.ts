import { z } from 'zod';

export const declareBreakGlassSchema = z.object({
    patientId: z.number().int().positive({ error: 'Patient ID is required' }),
    justification: z.string({ error: 'Clinical justification is required' }).trim().min(10, { error: 'Justification must be at least 10 characters' }).max(1000),
    accessDurationMinutes: z.number().int().min(15).max(480).default(60)
});

export const reviewBreakGlassSchema = z.object({
    status: z.enum(['approved', 'flagged'], { error: 'Invalid review status' }),
    auditorNotes: z.string({ error: 'Auditor notes are required' }).trim().min(5).max(1000)
});

export type DeclareBreakGlassInput = z.infer<typeof declareBreakGlassSchema>;
export type ReviewBreakGlassInput = z.infer<typeof reviewBreakGlassSchema>;
