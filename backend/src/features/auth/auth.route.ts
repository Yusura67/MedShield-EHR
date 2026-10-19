// backend/src/features/auth/auth.routes.ts
// IMPORT MODULES.
import { Router } from 'express';
import { verifyToken } from '../../middlewares/verifyToken.js';
import { authController } from './auth.controller.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', verifyToken, authController.getMe);

export default router;