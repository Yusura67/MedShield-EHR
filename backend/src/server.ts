// backend/src/server.ts
// IMPORT MODULES.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { CONFIG } from './config/env.js';
import { checkConnection } from './config/db.js';

// IMPORT ROUTES.
import authRoutes from './features/auth/auth.route.js';

// IMPORT MIDDLEWARES
import { globalErrorHandler } from './middlewares/errorHandler.js';

// CONFIGURATION & VARIABLE.
const PORT = CONFIG.PORT;
const app = express();

// MIDDLEWARES.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(helmet());

// ROUTES.
app.use('/api/auth', authRoutes);

// GLOBAL ERROR HANDLE.
app.use(globalErrorHandler);

// START SERVER.
const startServer = async () => {
    await checkConnection();
    app.listen(PORT, () => {
        console.log("SERVER IS RUNNING ON PORT " + PORT + "!");
    });
};
startServer();