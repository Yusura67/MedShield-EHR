import { Router } from 'express';
import { verifyToken } from '../../middlewares/verifyToken.js';
import { checkRole } from '../../middlewares/checkRole.js';
import { patientController } from './patient.controller.js';

const router = Router();

router.post('/', verifyToken, checkRole('doctor', 'nurse'), patientController.create);
router.get('/', verifyToken, patientController.list);
router.get('/:id', verifyToken, patientController.getById);

export default router;
