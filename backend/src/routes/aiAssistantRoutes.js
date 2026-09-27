import express from 'express';
import { handleAIAssistantCommand } from '../controllers/aiAssistantController.js';

const router = express.Router();
router.post('/assistant', handleAIAssistantCommand);

export default router;