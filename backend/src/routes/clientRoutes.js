import { Router } from 'express';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} from '../controllers/clientController.js';
import { validateObjectId, validateClientPayload } from '../middleware/validate.js';

const router = Router();

router.route('/').get(getClients).post(validateClientPayload(false), createClient);

router
  .route('/:id')
  .get(validateObjectId(), getClientById)
  .put(validateObjectId(), validateClientPayload(true), updateClient)
  .delete(validateObjectId(), deleteClient);

export default router;
