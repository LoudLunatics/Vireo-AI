import express from 'express';
import { getGoals, createGoal, updateGoalProgress, deleteGoal, breakdownGoal } from '../controllers/goalController.js';
import { validateRequest, goalSchema } from '../middlewares/validate.js';

const router = express.Router();

router.get('/', getGoals);
router.post('/', validateRequest(goalSchema), createGoal);
router.patch('/:id', updateGoalProgress); // Endpoint untuk menyimpan perubahan progress target
router.delete('/:id', deleteGoal);       // Endpoint untuk menghapus atau mengarsipkan target
router.post('/breakdown', breakdownGoal);

export default router;