import { Router } from 'express';
import { verifyToken } from '../../middlewares/verifyToken.js';
import { checkRole } from '../../middlewares/checkRole.js';
import { clinicalController } from './clinical.controller.js';

const router = Router();

router.post('/observations', verifyToken, checkRole('doctor', 'nurse'), clinicalController.recordObservation);
router.get('/observations/patient/:patientId', verifyToken, clinicalController.getPatientObservations);

router.post('/conditions', verifyToken, checkRole('doctor'), clinicalController.diagnoseCondition);
router.get('/conditions/patient/:patientId', verifyToken, clinicalController.getPatientConditions);

router.post('/prescriptions', verifyToken, checkRole('doctor'), clinicalController.createPrescription);
router.get('/prescriptions/patient/:patientId', verifyToken, clinicalController.getPatientPrescriptions);

export default router;
