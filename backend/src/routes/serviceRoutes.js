import { Router } from 'express';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService
} from '../controllers/serviceController.js';
import { validateObjectId, validateServicePayload } from '../middleware/validate.js';

const router = Router();

router.route('/').get(getServices).post(validateServicePayload(false), createService);

router
  .route('/:id')
  .get(validateObjectId(), getServiceById)
  .put(validateObjectId(), validateServicePayload(true), updateService)
  .delete(validateObjectId(), deleteService);

export default router;
