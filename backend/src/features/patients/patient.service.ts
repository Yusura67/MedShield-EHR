import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { encrypt, decrypt } from '../../utils/crypto.js';
import { recordAuditLog } from '../audit/audit.service.js';
import { CreatePatientInput } from './patient.schema.js';
import { AuthPayload } from '../../types/auth.types.js';

interface PatientRow extends RowDataPacket {
    patient_id: number;
    user_id: number | null;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: 'male' | 'female' | 'other';
    national_id: string;
    phone_number: string;
    blood_type: string;
    allergies: string | null;
    emergency_contact: string | null;
    created_at: Date;
    updated_at: Date;
}

export const patientService = {
    async createPatient(
        data: CreatePatientInput,
        requester: AuthPayload,
        clientInfo: { ip: string; userAgent: string }
    ) {
        if (data.userId) {
            const [existing] = await pool.query<PatientRow[]>(
                'SELECT patient_id FROM patients WHERE user_id = ?',
                [data.userId]
            );
            if (existing.length > 0) {
                throw new AppError('A patient record already exists for this user account', 409);
            }
        }

        const encryptedNationalId = encrypt(data.nationalId);

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO patients 
            (user_id, first_name, last_name, date_of_birth, gender, national_id, phone_number, blood_type, allergies, emergency_contact) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.userId || null,
                data.firstName,
                data.lastName,
                data.dateOfBirth,
                data.gender,
                encryptedNationalId,
                data.phoneNumber,
                data.bloodType,
                data.allergies || null,
                data.emergencyContact || null
            ]
        );

        const newPatientId = result.insertId;

        await recordAuditLog({
            userId: requester.id,
            action: 'CREATE_PATIENT',
            resourceType: 'PATIENT',
            resourceId: newPatientId,
            status: 'SUCCESS',
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            details: `Created patient record for ${data.firstName} ${data.lastName}`
        });

        return {
            patientId: newPatientId,
            userId: data.userId || null,
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            phoneNumber: data.phoneNumber,
            bloodType: data.bloodType,
            allergies: data.allergies || null,
            emergencyContact: data.emergencyContact || null
        };
    },

    async getPatientById(
        patientId: number,
        requester: AuthPayload,
        clientInfo: { ip: string; userAgent: string }
    ) {
        const [patients] = await pool.query<PatientRow[]>(
            'SELECT * FROM patients WHERE patient_id = ?',
            [patientId]
        );

        const patient = patients[0];
        if (!patient) {
            throw new AppError('Patient not found', 404);
        }

        if (requester.role === 'patient' && patient.user_id !== requester.id) {
            await recordAuditLog({
                userId: requester.id,
                action: 'READ_PATIENT_UNAUTHORIZED',
                resourceType: 'PATIENT',
                resourceId: patientId,
                status: 'UNAUTHORIZED',
                ipAddress: clientInfo.ip,
                userAgent: clientInfo.userAgent,
                details: `BOLA/IDOR attempt detected: User ${requester.id} attempted to access patient ${patientId}`
            });
            throw new AppError('Forbidden. You do not have permission to view this patient record.', 403);
        }

        let decryptedNationalId = '';
        try {
            decryptedNationalId = decrypt(patient.national_id);
        } catch {
            decryptedNationalId = 'ERROR_DECRYPTING';
        }

        await recordAuditLog({
            userId: requester.id,
            action: 'READ_PATIENT',
            resourceType: 'PATIENT',
            resourceId: patientId,
            status: 'SUCCESS',
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            details: `Read patient details for patient_id ${patientId}`
        });

        return {
            patientId: patient.patient_id,
            userId: patient.user_id,
            firstName: patient.first_name,
            lastName: patient.last_name,
            dateOfBirth: patient.date_of_birth,
            gender: patient.gender,
            nationalId: decryptedNationalId,
            phoneNumber: patient.phone_number,
            bloodType: patient.blood_type,
            allergies: patient.allergies,
            emergencyContact: patient.emergency_contact,
            createdAt: patient.created_at,
            updatedAt: patient.updated_at
        };
    },

    async listPatients(
        requester: AuthPayload,
        clientInfo: { ip: string; userAgent: string }
    ) {
        let query = 'SELECT * FROM patients ORDER BY created_at DESC';
        const params: any[] = [];

        if (requester.role === 'patient') {
            query = 'SELECT * FROM patients WHERE user_id = ?';
            params.push(requester.id);
        }

        const [patients] = await pool.query<PatientRow[]>(query, params);

        const formatted = patients.map((patient) => {
            let decryptedNationalId = '';
            try {
                decryptedNationalId = decrypt(patient.national_id);
            } catch {
                decryptedNationalId = 'DECRYPTION_FAILED';
            }

            const maskedNationalId = decryptedNationalId.length >= 4 
                ? `${decryptedNationalId.slice(0, 3)}-xxxx-xxxx-${decryptedNationalId.slice(-2)}`
                : 'xxxx';

            return {
                patientId: patient.patient_id,
                userId: patient.user_id,
                firstName: patient.first_name,
                lastName: patient.last_name,
                dateOfBirth: patient.date_of_birth,
                gender: patient.gender,
                nationalId: requester.role === 'doctor' || requester.role === 'nurse' ? decryptedNationalId : maskedNationalId,
                phoneNumber: patient.phone_number,
                bloodType: patient.blood_type,
                allergies: patient.allergies,
                emergencyContact: patient.emergency_contact,
                createdAt: patient.created_at,
                updatedAt: patient.updated_at
            };
        });

        await recordAuditLog({
            userId: requester.id,
            action: 'LIST_PATIENTS',
            resourceType: 'PATIENT',
            resourceId: 0,
            status: 'SUCCESS',
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            details: `Listed ${formatted.length} patient records`
        });

        return formatted;
    }
};
