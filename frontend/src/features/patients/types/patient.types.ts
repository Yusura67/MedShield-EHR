export interface Patient {
    patientId: number;
    userId: number | null;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    nationalId: string;
    phoneNumber: string;
    bloodType: string;
    allergies: string | null;
    emergencyContact: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreatePatientInput {
    userId?: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    nationalId: string;
    phoneNumber: string;
    bloodType: string;
    allergies?: string;
    emergencyContact?: string;
}
