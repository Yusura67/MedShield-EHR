// backend/src/types/auth.types.ts

export interface AuthPayload {
    id: number;
    username: string;
    role: 'doctor' | 'nurse' | 'patient' | 'auditor'
};