import { Router } from 'express';
import { verifyToken } from '../../middlewares/verifyToken.js';
import { checkRole } from '../../middlewares/checkRole.js';
import { auditController } from './audit.controller.js';

const router = Router();

router.get('/', verifyToken, checkRole('auditor'), auditController.list);

export default router;
