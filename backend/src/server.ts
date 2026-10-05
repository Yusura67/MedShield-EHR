// backend/src/server.ts
// IMPORT MODULES.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { CONFIG } from './config/env.js';
import { checkConnection } from './config/db.js';

// IMPORT ROUTES.


// CONFIGURATION & VARIABLE.
const PORT = CONFIG.PORT;
const app = express();

// MIDDLEWARES.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

// ROUTES.


// GLOBAL ERROR HANDLE.


// START SERVER.
const startServer = async () => {
    await checkConnection();
    app.listen(PORT, () => {
        console.log("SERVER IS RUNNING ON PORT " + PORT + "!");
    });
};
startServer();