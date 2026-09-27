import express from 'express';
import { getTasks, createTask, deleteTask, updateTaskStatus, prioritizeTasks } from '../controllers/taskController.js';
import { validateRequest, taskSchema } from '../middlewares/validate.js';

const router = express.Router();

router.get('/', getTasks);
router.post('/', validateRequest(taskSchema), createTask);
router.patch('/:id', updateTaskStatus); // Menangani perubahan status (centang selesai / pending)
router.delete('/:id', deleteTask);     // Menangani penghapusan tugas berdasarkan ID
router.post('/prioritize', prioritizeTasks);

export default router;