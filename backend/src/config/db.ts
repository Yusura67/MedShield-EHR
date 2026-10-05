// backend/src/config/db.ts
// IMPORT MODULES.
import mysql from 'mysql2/promise';
import { CONFIG } from './env.js';

// DATABASE CONNECTION.
export const pool = mysql.createPool(CONFIG.DATABASE);

// DATABASE CONNECTION TESTING.
export const checkConnection = async () => {
    try {
        await pool.query('SELECT 1');
        console.log("Database Connection Successfully!");
    } catch(error) {
        console.error("database connection failed.");
        console.error("CRITICAL ERROR: ", error);
        process.exit(1);
    }
}