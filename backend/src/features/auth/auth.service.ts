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
    user_id: number;
    username: string;
    password_hash: string;
    role: 'doctor' | 'nurse' | 'patient' | 'auditor';
    email: string;
    failed_login_attempts: number;
    locked_until: Date | null;
}

// MAIN BUSINESS LOGIC.

export const authService = {
    // REGISTER
    async register(data: RegisterInput) {

        const [existingUsers] = await pool.query<UserRow[]>(
            'SELECT user_id FROM users WHERE username = ? OR email = ?',
            [data.username, data.email]
        );

        if (existingUsers.length > 0) {
            throw new AppError('Username is already taken', 409);
        }

        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(data.password, saltRounds);

        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO users (username, password_hash, role, email) VALUES (?, ?, ?, ?)',
            [data.username, passwordHash, data.role, data.email]
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
                    'UPDATE users SET failed_login_attempts = ?, locked_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE user_id = ?',
                    [newAttempts, user.user_id]
                );
                throw new AppError('Too many failed attempts. Account has been locked for 15 minutes.', 403);
            } else {
                await pool.query(
                    'UPDATE users SET failed_login_attempts = ? WHERE user_id = ?',
                    [newAttempts, user.user_id]
                );
                throw new AppError('Invalid username or password', 401);
            }
        }

        await pool.query(
            'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE user_id = ?',
            [user.user_id]
        );

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            CONFIG.JWT_SECRET,
            { expiresIn: '8h' }
        );

        return {
            token,
            user: {
                id: user.user_id,
                username: user.username,
                role: user.role
            }
        };
    },

    async getMe(userId: number) {
        const [ users ] = await pool.query<UserRow[]>(
            'SELECT user_id, username, role, locked_until FROM users WHERE user_id = ?',
            [ userId ]
        );

        const user = users[0];

        if (!user) {
            throw new AppError('User account not found or has been deactivated', 401);
        }

        if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
            throw new AppError('Account is currently locked. Access denied.', 403)
        }

        return {
            user_id: user.user_id,
            username: user.username,
            role: user.role
        };
    }
};