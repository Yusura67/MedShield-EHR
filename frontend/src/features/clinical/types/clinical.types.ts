export interface Observation {
    observationId: number;
    patientId: number;
    recordedByUserId: number;
    recordedByUsername?: string;
    recordedByRole?: string;
    observationType: string;
    value: string;
    unit: string;
    interpretation: string;
    note: string | null;
    createdAt: string;
}

export interface CreateObservationInput {
    patientId: number;
    observationType: string;
    value: string;
    unit: string;
    interpretation: string;
    note?: string;
}

export interface Condition {
    conditionId: number;
    patientId: number;
    diagnosedByDoctorId: number;
    doctorUsername?: string;
    icd10Code: string;
    displayName: string;
    clinicalStatus: 'active' | 'resolved' | 'inactive';
    confidentialityLevel: 'normal' | 'restricted';
    notes: string | null;
    diagnosedAt: string | null;
    createdAt: string;
    isRestricted: boolean;
    requiresBreakGlass: boolean;
}

export interface CreateConditionInput {
    patientId: number;
    icd10Code: string;
    displayName: string;
    clinicalStatus: 'active' | 'resolved' | 'inactive';
    confidentialityLevel: 'normal' | 'restricted';
    notes?: string;
    diagnosedAt?: string;
}

export interface Prescription {
    prescriptionId: number;
    patientId: number;
    prescriptedByDoctorId: number;
    doctorUsername?: string;
    conditionId: number | null;
    conditionName?: string | null;
    medicationName: string;
    dosage: string;
    frequency: string;
    route: string;
    status: 'active' | 'completed' | 'cancelled';
    instructions: string | null;
    prescribedAt: string | null;
    createdAt: string;
}

export interface CreatePrescriptionInput {
    patientId: number;
    conditionId?: number;
    medicationName: string;
    dosage: string;
    frequency: string;
    route: string;
    status: 'active' | 'completed' | 'cancelled';
    instructions?: string;
}
