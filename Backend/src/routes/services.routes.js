import express from 'express';
import { getServices, getServiceById } from '../controllers/services.controller.js';

const router = express.Router();

router.get('/', getServices);
router.get('/:id', getServiceById);

export default router;
