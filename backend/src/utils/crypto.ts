import crypto from 'crypto';
import { CONFIG } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_BUFFER = Buffer.from(CONFIG.ENCRYPTION_KEY, 'hex');

export const encrypt = (text: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

export const decrypt = (cipherText: string): string => {
    const parts = cipherText.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format');
    }

    const [ivHex, authTagHex, encryptedData] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};

export const generateAuditHash = (payload: {
    userId: number | null;
    action: string;
    resourceType: string;
    resourceId: number;
    status: string;
    timestamp: string;
    details: string;
}): string => {
    const rawString = `${payload.userId}:${payload.action}:${payload.resourceType}:${payload.resourceId}:${payload.status}:${payload.timestamp}:${payload.details}`;
    return crypto.createHash('sha256').update(rawString).digest('hex');
};
