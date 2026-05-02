import { Router } from 'express';
import {
  createResource,
  deleteResource,
  getResourceById,
  listResources,
  updateResource,
} from '../controllers/resource.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('organiser', 'admin'), createResource);
router.get('/', listResources);
router.get('/:id', getResourceById);
router.put('/:id', authorize('organiser', 'admin'), updateResource);
router.delete('/:id', authorize('organiser', 'admin'), deleteResource);

export default router;
