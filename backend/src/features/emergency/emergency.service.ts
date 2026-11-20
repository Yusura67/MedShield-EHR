import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { recordAuditLog } from '../audit/audit.service.js';
import { AuthPayload } from '../../types/auth.types.js';
import { DeclareBreakGlassInput, ReviewBreakGlassInput } from './emergency.schema.js';

interface BreakGlassEventRow extends RowDataPacket {
    event_id: number;
    doctor_user_id: number;
    patient_id: number;
    justification: string;
    access_duration_minutes: number;
    expired_at: Date;
    auditor_review_status: 'pending' | 'approved' | 'flagged';
    auditor_user_id: number | null;
    auditor_notes: string | null;
    reviewed_at: Date | null;
    created_at: Date;
    doctor_username?: string;
    patient_name?: string;
    auditor_username?: string | null;
}

interface PatientCheckRow extends RowDataPacket {
    patient_id: number;
    first_name: string;
    last_name: string;
}

export const emergencyService = {
    async declareBreakGlass(
        data: DeclareBreakGlassInput,
        requester: AuthPayload,
        clientInfo: { ip: string; userAgent: string }
    ) {
        if (requester.role !== 'doctor') {
            throw new AppError('Forbidden. Only licensed medical doctors can trigger Break-Glass emergency override.', 403);
        }

        const [patients] = await pool.query<PatientCheckRow[]>(
            'SELECT patient_id, first_name, last_name FROM patients WHERE patient_id = ?',
            [data.patientId]
        );

        const patient = patients[0];
        if (!patient) {
            throw new AppError('Patient not found', 404);
        }

        const durationMinutes = data.accessDurationMinutes || 60;
        const expiredAt = new Date(Date.now() + durationMinutes * 60 * 1000);

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO break_glass_events 
            (doctor_user_id, patient_id, justification, access_duration_minutes, expired_at, auditor_review_status) 
            VALUES (?, ?, ?, ?, ?, 'pending')`,
            [
                requester.id,
                data.patientId,
                data.justification,
                durationMinutes,
                expiredAt
            ]
        );

        const eventId = result.insertId;

        await recordAuditLog({
            userId: requester.id,
            action: 'BREAK_GLASS_DECLARED',
            resourceType: 'BREAK_GLASS',
            resourceId: eventId,
            status: 'SUCCESS',
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            details: `EMERGENCY OVERRIDE ACTIVATED: Doctor ${requester.username} declared Break-Glass for patient ${patient.first_name} ${patient.last_name} (ID: ${data.patientId}). Justification: ${data.justification}`
        });

        return {
            eventId,
            doctorUserId: requester.id,
            patientId: data.patientId,
            patientName: `${patient.first_name} ${patient.last_name}`,
            justification: data.justification,
            accessDurationMinutes: durationMinutes,
            expiredAt,
            auditorReviewStatus: 'pending'
        };
    },

    async checkActiveBreakGlass(patientId: number, doctorUserId: number) {
        const [events] = await pool.query<BreakGlassEventRow[]>(
            `SELECT event_id, doctor_user_id, patient_id, justification, access_duration_minutes, expired_at, created_at
            FROM break_glass_events
            WHERE doctor_user_id = ? AND patient_id = ? AND expired_at > NOW()
            ORDER BY expired_at DESC LIMIT 1`,
            [doctorUserId, patientId]
        );

        if (events.length === 0) {
            return {
                hasActiveOverride: false,
                event: null
            };
        }

        const event = events[0];
        return {
            hasActiveOverride: true,
            event: {
                eventId: event.event_id,
                patientId: event.patient_id,
                justification: event.justification,
                expiredAt: event.expired_at,
                remainingMinutes: Math.max(0, Math.ceil((new Date(event.expired_at).getTime() - Date.now()) / (1000 * 60)))
            }
        };
    },

    async listBreakGlassEvents(
        requester: AuthPayload,
        clientInfo: { ip: string; userAgent: string }
    ) {
        let query = `
            SELECT b.*, 
                   doc.username AS doctor_username, 
                   CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
                   aud.username AS auditor_username
            FROM break_glass_events b
            JOIN users doc ON b.doctor_user_id = doc.user_id
            JOIN patients p ON b.patient_id = p.patient_id
            LEFT JOIN users aud ON b.auditor_user_id = aud.user_id
        `;
        const params: any[] = [];

        if (requester.role === 'doctor') {
            query += ' WHERE b.doctor_user_id = ?';
            params.push(requester.id);
        }

        query += ' ORDER BY b.created_at DESC';

        const [events] = await pool.query<BreakGlassEventRow[]>(query, params);

        await recordAuditLog({
            userId: requester.id,
            action: 'LIST_BREAK_GLASS_EVENTS',
            resourceType: 'BREAK_GLASS',
            resourceId: 0,
            status: 'SUCCESS',
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            details: `Retrieved ${events.length} break-glass events`
        });

        return events.map((event) => ({
            eventId: event.event_id,
            doctorUserId: event.doctor_user_id,
            doctorUsername: event.doctor_username,
            patientId: event.patient_id,
            patientName: event.patient_name,
            justification: event.justification,
            accessDurationMinutes: event.access_duration_minutes,
            expiredAt: event.expired_at,
            isCurrentlyActive: new Date(event.expired_at).getTime() > Date.now(),
            auditorReviewStatus: event.auditor_review_status,
            auditorUserId: event.auditor_user_id,
            auditorUsername: event.auditor_username,
            auditorNotes: event.auditor_notes,
            reviewedAt: event.reviewed_at,
            createdAt: event.created_at
        }));
    },

    async reviewBreakGlassEvent(
        eventId: number,
        data: ReviewBreakGlassInput,
        requester: AuthPayload,
        clientInfo: { ip: string; userAgent: string }
    ) {
        if (requester.role !== 'auditor') {
            throw new AppError('Forbidden. Only designated compliance auditors can review Break-Glass events.', 403);
        }

        const [events] = await pool.query<BreakGlassEventRow[]>(
            'SELECT * FROM break_glass_events WHERE event_id = ?',
            [eventId]
        );

        const event = events[0];
        if (!event) {
            throw new AppError('Break-Glass event record not found', 404);
        }

        await pool.query(
            `UPDATE break_glass_events 
            SET auditor_review_status = ?, auditor_user_id = ?, auditor_notes = ?, reviewed_at = NOW() 
            WHERE event_id = ?`,
            [data.status, requester.id, data.auditorNotes, eventId]
        );

        await recordAuditLog({
            userId: requester.id,
            action: 'REVIEW_BREAK_GLASS',
            resourceType: 'BREAK_GLASS',
            resourceId: eventId,
            status: 'SUCCESS',
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            details: `Auditor ${requester.username} marked Break-Glass event ${eventId} as ${data.status}. Notes: ${data.auditorNotes}`
        });

        return {
            eventId,
            auditorReviewStatus: data.status,
            auditorUserId: requester.id,
            auditorNotes: data.auditorNotes,
            reviewedAt: new Date()
        };
    }
};
