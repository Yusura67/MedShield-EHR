import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { CONFIG } from './config/env.js';
import { checkConnection } from './config/db.js';

import authRoutes from './features/auth/auth.route.js';
import patientRoutes from './features/patients/patient.routes.js';
import clinicalRoutes from './features/clinical/clinical.routes.js';
import emergencyRoutes from './features/emergency/emergency.routes.js';
import auditRoutes from './features/audit/audit.routes.js';

import { globalErrorHandler } from './middlewares/errorHandler.js';

const PORT = CONFIG.PORT;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(helmet());

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/clinical', clinicalRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/audit', auditRoutes);

app.use(globalErrorHandler);

const startServer = async () => {
    await checkConnection();
    app.listen(PORT, () => {
        console.log("SERVER IS RUNNING ON PORT " + PORT + "!");
    });
};
startServer();
