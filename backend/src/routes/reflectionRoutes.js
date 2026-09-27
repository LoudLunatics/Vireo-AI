import express from 'express';
import { getReflections, createReflection, convertSuggestedAction } from '../controllers/reflectionController.js';
import { validateRequest, reflectionSchema } from '../middlewares/validate.js';

const router = express.Router();

router.get('/', getReflections);
router.post('/', validateRequest(reflectionSchema), createReflection);

// [UPDATE] Rute terpadu untuk mengubah rekomendasi AI menjadi Habit atau Goal otomatis di SQLite
router.post('/convert-action', convertSuggestedAction);

export default router;