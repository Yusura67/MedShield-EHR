export interface BreakGlassEvent {
    eventId: number;
    doctorUserId: number;
    doctorUsername?: string;
    patientId: number;
    patientName?: string;
    justification: string;
    accessDurationMinutes: number;
    expiredAt: string;
    isCurrentlyActive?: boolean;
    auditorReviewStatus: 'pending' | 'approved' | 'flagged';
    auditorUserId?: number | null;
    auditorUsername?: string | null;
    auditorNotes?: string | null;
    reviewedAt?: string | null;
    createdAt: string;
}

export interface DeclareBreakGlassInput {
    patientId: number;
    justification: string;
    accessDurationMinutes?: number;
}

export interface ReviewBreakGlassInput {
    status: 'approved' | 'flagged';
    auditorNotes: string;
}
