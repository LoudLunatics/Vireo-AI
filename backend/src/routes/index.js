import express from 'express';
import dashboardRoutes from './dashboardRoutes.js';
import habitRoutes from './habitRoutes.js';
import taskRoutes from './taskRoutes.js';
import goalRoutes from './goalRoutes.js';
import reflectionRoutes from './reflectionRoutes.js';
import aiAssistantRoutes from './aiAssistantRoutes.js';
import historyRoutes from './historyRoutes.js'; // Sesuaikan path jika file berada di folder yang sama

const router = express.Router();

router.use('/dashboard', dashboardRoutes);
router.use('/habits', habitRoutes);
router.use('/tasks', taskRoutes);
router.use('/goals', goalRoutes);
router.use('/reflections', reflectionRoutes);
router.use('/history', historyRoutes); // Ubah dari app menjadi router
router.use('/ai', aiAssistantRoutes); 

export default router;