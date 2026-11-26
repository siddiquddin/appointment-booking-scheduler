import { Router } from 'express';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment
} from '../controllers/appointmentController.js';
import {
  validateObjectId,
  validateAppointmentPayload,
  validateStatusPatch
} from '../middleware/validate.js';

const router = Router();

router.route('/').get(getAppointments).post(validateAppointmentPayload(false), createAppointment);

router
  .route('/:id')
  .get(validateObjectId(), getAppointmentById)
  .put(validateObjectId(), validateAppointmentPayload(true), updateAppointment)
  .delete(validateObjectId(), deleteAppointment);

router.patch('/:id/status', validateObjectId(), validateStatusPatch, updateAppointmentStatus);

export default router;
