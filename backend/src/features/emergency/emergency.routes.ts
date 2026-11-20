import { Router } from 'express';
import { verifyToken } from '../../middlewares/verifyToken.js';
import { checkRole } from '../../middlewares/checkRole.js';
import { emergencyController } from './emergency.controller.js';

const router = Router();

router.post('/break-glass', verifyToken, checkRole('doctor'), emergencyController.declare);
router.get('/break-glass/active/:patientId', verifyToken, checkRole('doctor'), emergencyController.checkActive);
router.get('/break-glass', verifyToken, checkRole('doctor', 'auditor'), emergencyController.list);
router.patch('/break-glass/:eventId/review', verifyToken, checkRole('auditor'), emergencyController.review);

export default router;
