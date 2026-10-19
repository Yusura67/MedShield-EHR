// backend/src/features/auth/auth.service.ts
// IMPORT MODULES.
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise.js';

import { pool } from '../../config/db';
import { CONFIG } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { RegisterInput, LoginInput } from './auth.schema';

interface UserRow extends RowDataPacket {
    id: number;
    username: string;
    password_hash: string;
    role: 'doctor' | 'nurse' | 'patient' | 'auditor';
    failed_login_attempts: number;
    locked_until: Date | null;
}

// MAIN BUSINESS LOGIC.

export const authService = {
    // REGISTER
    async register(data: RegisterInput) {

        const [existingUsers] = await pool.query<UserRow[]>(
            'SELECT id FROM users WHERE username = ?',
            [data.username]
        );

        if (existingUsers.length > 0) {
            throw new AppError('Username is already taken', 409);
        }

        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(data.password, saltRounds);

        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [data.username, passwordHash, data.role]
        );

        return {
            id: result.insertId,
            username: data.username,
            role: data.role
        };
    },

    // LOGIN
    async login(data: LoginInput) {
        const [users] = await pool.query<UserRow[]>(
            'SELECT * FROM users WHERE username = ?',
            [data.username]
        );

        const user = users[0];

        if (!user) {
            throw new AppError('Invalid username or password', 401);
        }

        if (user.locked_until) {
            const lockedUntilTime = new Date(user.locked_until).getTime();
            const currentTime = Date.now();

            if (lockedUntilTime > currentTime) {
                const remainingMinutes = Math.ceil((lockedUntilTime - currentTime) / (1000 * 60));
                throw new AppError(
                    `Account is temporarily locked due to too many failed attempts. Try again in ${remainingMinutes} minute(s).`,
                    403
                );
            }
        }

        const isPasswordMatch = await bcrypt.compare(data.password, user.password_hash);

        if (!isPasswordMatch) {
            const newAttempts = user.failed_login_attempts + 1;

            if (newAttempts >= 5) {
                await pool.query(
                    'UPDATE users SET failed_login_attempts = ?, locked_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?',
                    [newAttempts, user.id]
                );
                throw new AppError('Too many failed attempts. Account has been locked for 15 minutes.', 403);
            } else {
                await pool.query(
                    'UPDATE users SET failed_login_attempts = ? WHERE id = ?',
                    [newAttempts, user.id]
                );
                throw new AppError('Invalid username or password', 401);
            }
        }

        await pool.query(
            'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
            [user.id]
        );

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            CONFIG.JWT_SECRET,
            { expiresIn: '8h' }
        );

        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        };
    }
};