import express from 'express';
import { getDailyBriefing } from '../controllers/briefingController.js'; // Sesuaikan path jika letak folder controllers berbeda

const router = express.Router();

// Endpoint untuk mengambil Daily Briefing dengan deteksi Burnout otomatis
router.get('/daily-briefing', getDailyBriefing);

export default router;