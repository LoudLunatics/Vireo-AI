import { GoalModel } from '../models/goalModel.js';
import { executeAgentTask } from './aiAgentService.js';
import { createAndStoreEmbedding } from './vectorService.js'; // Import layanan vector

export const GoalService = {
    getAllGoals: () => GoalModel.getAll(),
    
    createGoal: async (title, target_date) => {
        // 1. Simpan ke database utama SQLite
        const result = GoalModel.create(title, target_date);
        
        // 2. [ZERO-CLICK INGESTION]: Otomatis rekam ke vector_memory di background
        try {
            await createAndStoreEmbedding(
                'goal', 
                result.id, 
                `Target Mingguan: ${title} (Target: ${target_date || 'Minggu Ini'})`
            );
        } catch (error) {
            console.error("Gagal mencatat vector memory untuk goal:", error.message);
        }

        return result;
    },

    breakdownGoal: async (goalTitle) => {
        return await executeAgentTask('goal_breakdown', { goalTitle });
    }
};