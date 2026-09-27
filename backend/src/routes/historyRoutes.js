import express from 'express';
import { getUnifiedHistory } from '../controllers/historyController.js';

const router = express.Router();

// Endpoint: GET /api/history/unified (atau sesuaikan dengan prefix mount di server utama)
router.get('/unified', getUnifiedHistory);

export default router;