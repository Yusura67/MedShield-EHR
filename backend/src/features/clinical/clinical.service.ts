import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { encrypt, decrypt } from '../../utils/crypto.js';
import { recordAuditLog } from '../audit/audit.service.js';
import { AuthPayload } from '../../types/auth.types.js';
import {
    CreateObservationInput,
    CreateConditionInput,
    CreatePrescriptionInput
} from './clinical.schema.js';

interface PatientRecordRow extends RowDataPacket {
    patient_id: number;
    user_id: number | null;
}

interface ObservationRow extends RowDataPacket {
    observation_id: number;
    patient_id: number;
    recorded_by_user_id: number;
    observation_type: string;
    value: string;
    unit: string;
    interpretation: string;
    note: string | null;
    created_at: Date;
    recorded_by_username?: string;
    recorded_by_role?: string;
}

interface ConditionRow extends RowDataPacket {
    condition_id: number;
    patient_id: number;
    diagnosed_by_doctor_id: number;
    icd10_code: string;
    display_name: string;
    clinical_status: 'active' | 'resolved' | 'inactive';
    confidentiality_level: 'normal' | 'restricted';
    notes: string | null;
    diagnosed_at: Date | null;
    created_at: Date;
    doctor_username?: string;
}

interface PrescriptionRow extends RowDataPacket {
    prescription_id: number;
    patient_id: number;
    prescripted_by_doctor_id: number;
    condition_id: number | null;
    medication_name: string;
    dosage: string;
    frequency: string;
    route: string;
    status: 'active' | 'completed' | 'cancelled';
    instructions: string | null;
    prescribed_at: Date | null;
    created_at: Date;
    doctor_username?: string;
    condition_name?: string | null;
}

const verifyPatientAccess = async (
    patientId: number,
    requester: AuthPayload,
    clientInfo: { ip: string; userAgent: string },
    action: string
): Promise<PatientRecordRow> => {
    const [patients] = await pool.query<PatientRecordRow[]>(
        'SELECT patient_id, user_id FROM patients WHERE patient_id = ?',
        [patientId]
    );

    const patient = patients[0];
    if (!patient) {
        throw new AppError('Patient not found', 404);
    }

    if (requester.role === 'patient' && patient.user_id !== requester.id) {
        await recordAuditLog({
            userId: requester.id,
            action: `${action}_UNAUTHORIZED`,
            resourceType: 'CLINICAL',
            resourceId: patientId,
            status: 'UNAUTHORIZED',
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            details: `BOLA/IDOR attempt detected: User ${requester.id} attempted to access clinical records of patient ${patientId}`
        });
        throw new AppError('Forbidden. You do not have permission to access records for this patient.', 403);
    }

    return patient;
};

export const clinicalService = {
    async recordObservation(
        data: CreateObservationInput,
        requester: AuthPayload,
        clientInfo: { ip: string; userAgent: string }
    ) {
        await verifyPatientAccess(data.patientId, requester, clientInfo, 'RECORD_OBSERVATION');

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO observations 
            (patient_id, recorded_by_user_id, observation_type, value, unit, interpretation, note) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                data.patientId,
                requester.id,
                data.observationType,
                data.value,
                data.unit,
                data.interpretation,
                data.note || null
            ]
        );

        const observationId = result.insertId;

        await recordAuditLog({
            userId: requester.id,
            action: 'RECORD_OBSERVATION',
            resourceType: 'OBSERVATION',
            resourceId: observationId,
            status: 'SUCCESS',
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            details: `Recorded observation ${data.observationType} for patient ${data.patientId}`
        });

        return {
            observationId,
            patientId: data.patientId,
            recordedByUserId: requester.id,
            observationType: data.observationType,
            value: data.value,
            unit: data.unit,
            interpretation: data.interpretation,
            note: data.note || null
        };
    },

    async getPatientObservations(
        patientId: number,
        requester: AuthPayload,
        clientInfo: { ip: string; userAgent: string }
    ) {
        await verifyPatientAccess(patientId, requester, clientInfo, 'READ_OBSERVATIONS');

        const [observations] = await pool.query<ObservationRow[]>(
            `SELECT o.*, u.username AS recorded_by_username, u.role AS recorded_by_role
            FROM observations o
            JOIN users u ON o.recorded_by_user_id = u.user_id
            WHERE o.patient_id = ?
            ORDER BY o.created_at DESC`,
            [patientId]
        );

        await recordAuditLog({
            userId: requester.id,
            action: 'READ_OBSERVATIONS',
            resourceType: 'OBSERVATION',
            resourceId: patientId,
            status: 'SUCCESS',
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            details: `Retrieved ${observations.length} observations for patient ${patientId}`
        });

        return observations.map((row) => ({
            observationId: row.observation_id,
            patientId: row.patient_id,
            recordedByUserId: row.recorded_by_user_id,
            recordedByUsername: row.recorded_by_username,
            recordedByRole: row.recorded_by_role,
            observationType: row.observation_type,
            value: row.value,
            unit: row.unit,
            interpretation: row.interpretation,
            note: row.note,
            createdAt: row.created_at
        }));
    },

    async diagnoseCondition(
        data: CreateConditionInput,
        requester: AuthPayload,
        clientInfo: { ip: string; userAgent: string }
    ) {
        await verifyPatientAccess(data.patientId, requester, clientInfo, 'DIAGNOSE_CONDITION');

        const encryptedNotes = data.notes ? encrypt(data.notes) : null;
        const diagnosedDate = data.diagnosedAt ? new Date(data.diagnosedAt) : new Date();

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO conditions 
            (patient_id, diagnosed_by_doctor_id, icd10_code, display_name, clinical_status, confidentiality_level, notes, diagnosed_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.patientId,
                requester.id,
                data.icd10Code,
                data.displayName,
                data.clinicalStatus,
                data.confidentialityLevel,
                encryptedNotes,
                diagnosedDate
            ]
        );

        const conditionId = result.insertId;

        await recordAuditLog({
            userId: requester.id,
            action: 'DIAGNOSE_CONDITION',
            resourceType: 'CONDITION',
            resourceId: conditionId,
            status: 'SUCCESS',
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            details: `Diagnosed condition ${data.icd10Code} (${data.displayName}) for patient ${data.patientId} with confidentiality ${data.confidentialityLevel}`
        });

        return {
            conditionId,
            patientId: data.patientId,
            diagnosedByDoctorId: requester.id,
            icd10Code: data.icd10Code,
            displayName: data.displayName,
            clinicalStatus: data.clinicalStatus,
            confidentialityLevel: data.confidentialityLevel,
            notes: data.notes || null,
            diagnosedAt: diagnosedDate
        };
    },

    async getPatientConditions(
        patientId: number,
        requester: AuthPayload,
        clientInfo: { ip: string; userAgent: string }
    ) {
        const patient = await verifyPatientAccess(patientId, requester, clientInfo, 'READ_CONDITIONS');

        let hasBreakGlassOverride = false;
        if (requester.role === 'doctor') {
            const [activeEvents] = await pool.query<RowDataPacket[]>(
                `SELECT event_id FROM break_glass_events 
                WHERE doctor_user_id = ? AND patient_id = ? AND expired_at > NOW()`,
                [requester.id, patientId]
            );
            hasBreakGlassOverride = activeEvents.length > 0;
        }

        const [conditions] = await pool.query<ConditionRow[]>(
            `SELECT c.*, u.username AS doctor_username
            FROM conditions c
            JOIN users u ON c.diagnosed_by_doctor_id = u.user_id
            WHERE c.patient_id = ?
            ORDER BY c.created_at DESC`,
            [patientId]
        );

        const formatted = conditions.map((cond) => {
            const isRestricted = cond.confidentiality_level === 'restricted';
            const isDiagnosingDoctor = cond.diagnosed_by_doctor_id === requester.id;
            const isAuditor = requester.role === 'auditor';
            const isPatientSelf = requester.role === 'patient' && patient.user_id === requester.id;

            const isAuthorizedToViewRestricted = isAuditor || isPatientSelf || isDiagnosingDoctor || hasBreakGlassOverride;

            if (isRestricted && !isAuthorizedToViewRestricted) {
                return {
                    conditionId: cond.condition_id,
                    patientId: cond.patient_id,
                    diagnosedByDoctorId: cond.diagnosed_by_doctor_id,
                    doctorUsername: cond.doctor_username,
                    icd10Code: '***',
                    displayName: 'Restricted Medical Condition',
                    clinicalStatus: cond.clinical_status,
                    confidentialityLevel: cond.confidentiality_level,
                    notes: '[CONFIDENTIAL - Break-Glass Override Required]',
                    diagnosedAt: cond.diagnosed_at,
                    createdAt: cond.created_at,
                    isRestricted: true,
                    requiresBreakGlass: true
                };
            }

            let decryptedNotes: string | null = null;
            if (cond.notes) {
                try {
                    decryptedNotes = decrypt(cond.notes);
                } catch {
                    decryptedNotes = cond.notes;
                }
            }

            return {
                conditionId: cond.condition_id,
                patientId: cond.patient_id,
                diagnosedByDoctorId: cond.diagnosed_by_doctor_id,
                doctorUsername: cond.doctor_username,
                icd10Code: cond.icd10_code,
                displayName: cond.display_name,
                clinicalStatus: cond.clinical_status,
                confidentialityLevel: cond.confidentiality_level,
                notes: decryptedNotes,
                diagnosedAt: cond.diagnosed_at,
                createdAt: cond.created_at,
                isRestricted,
                requiresBreakGlass: false
            };
        });

        await recordAuditLog({
            userId: requester.id,
            action: 'READ_CONDITIONS',
            resourceType: 'CONDITION',
            resourceId: patientId,
            status: 'SUCCESS',
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            details: `Retrieved ${conditions.length} conditions for patient ${patientId} (Break-Glass Active: ${hasBreakGlassOverride})`
        });

        return formatted;
    },

    async createPrescription(
        data: CreatePrescriptionInput,
        requester: AuthPayload,
        clientInfo: { ip: string; userAgent: string }
    ) {
        await verifyPatientAccess(data.patientId, requester, clientInfo, 'CREATE_PRESCRIPTION');

        if (data.conditionId) {
            const [conditionRows] = await pool.query<RowDataPacket[]>(
                'SELECT condition_id FROM conditions WHERE condition_id = ? AND patient_id = ?',
                [data.conditionId, data.patientId]
            );
            if (conditionRows.length === 0) {
                throw new AppError('Associated condition not found for this patient', 404);
            }
        }

        const prescribedDate = new Date();

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO prescriptions 
            (patient_id, prescripted_by_doctor_id, condition_id, medication_name, dosage, frequency, route, status, instructions, prescribed_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.patientId,
                requester.id,
                data.conditionId || null,
                data.medicationName,
                data.dosage,
                data.frequency,
                data.route,
                data.status,
                data.instructions || null,
                prescribedDate
            ]
        );

        const prescriptionId = result.insertId;

        await recordAuditLog({
            userId: requester.id,
            action: 'CREATE_PRESCRIPTION',
            resourceType: 'PRESCRIPTION',
            resourceId: prescriptionId,
            status: 'SUCCESS',
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            details: `Prescribed ${data.medicationName} (${data.dosage}) for patient ${data.patientId}`
        });

        return {
            prescriptionId,
            patientId: data.patientId,
            prescriptedByDoctorId: requester.id,
            conditionId: data.conditionId || null,
            medicationName: data.medicationName,
            dosage: data.dosage,
            frequency: data.frequency,
            route: data.route,
            status: data.status,
            instructions: data.instructions || null,
            prescribedAt: prescribedDate
        };
    },

    async getPatientPrescriptions(
        patientId: number,
        requester: AuthPayload,
        clientInfo: { ip: string; userAgent: string }
    ) {
        await verifyPatientAccess(patientId, requester, clientInfo, 'READ_PRESCRIPTIONS');

        const [prescriptions] = await pool.query<PrescriptionRow[]>(
            `SELECT p.*, u.username AS doctor_username, c.display_name AS condition_name
            FROM prescriptions p
            JOIN users u ON p.prescripted_by_doctor_id = u.user_id
            LEFT JOIN conditions c ON p.condition_id = c.condition_id
            WHERE p.patient_id = ?
            ORDER BY p.created_at DESC`,
            [patientId]
        );

        await recordAuditLog({
            userId: requester.id,
            action: 'READ_PRESCRIPTIONS',
            resourceType: 'PRESCRIPTION',
            resourceId: patientId,
            status: 'SUCCESS',
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            details: `Retrieved ${prescriptions.length} prescriptions for patient ${patientId}`
        });

        return prescriptions.map((p) => ({
            prescriptionId: p.prescription_id,
            patientId: p.patient_id,
            prescriptedByDoctorId: p.prescripted_by_doctor_id,
            doctorUsername: p.doctor_username,
            conditionId: p.condition_id,
            conditionName: p.condition_name,
            medicationName: p.medication_name,
            dosage: p.dosage,
            frequency: p.frequency,
            route: p.route,
            status: p.status,
            instructions: p.instructions,
            prescribedAt: p.prescribed_at,
            createdAt: p.created_at
        }));
    }
};
