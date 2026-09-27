import express from 'express';
import { getHabits, createHabit, getHabitInsight, toggleHabit, getAIPlan, saveAIPlanHabits, deleteHabit } from '../controllers/habitController.js';
import { validateRequest, habitSchema } from '../middlewares/validate.js';

const router = express.Router();

router.get('/', getHabits);
router.post('/', validateRequest(habitSchema), createHabit);
router.get('/insight', getHabitInsight);

// Rute untuk AI Planner Habits (Membuat rekomendasi berdasarkan goal)
router.post('/ai-plan', getAIPlan);

// TAMBAHAN: Rute untuk menyimpan daftar habit hasil rekomendasi AI secara otomatis
router.post('/ai-plan/save', saveAIPlanHabits);

// Tambahkan rute patch untuk toggle streak habit
router.patch('/:id/toggle', toggleHabit);

router.delete('/:id', deleteHabit);

export default router;