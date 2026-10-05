// backend/src/config/env.ts
// IMPORT MODULE.
import dotenv from 'dotenv';
dotenv.config();

// VALIDATION ENVIRONMENT VARIABLE.
const requiredEnv = ['PORT', 'JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME'];
const missingEnv: string[] = [];

for (const key of requiredEnv) {
    if (!process.env[key]) {
        missingEnv.push(key);
    }
}

if (missingEnv.length > 0) {
    console.error(missingEnv.join(' ') + "isn't in the .env file.");
    process.exit(1);
}

// EXPORT READ-ONLY.
export const CONFIG = {
    PORT: Number(process.env.PORT!),
    JWT_SECRET: process.env.JWT_SECRET!,

    DATABASE: {
        host: process.env.DB_HOST!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASS!,
        database: process.env.DB_NAME!,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        dateStrings: true
    },
} as const;