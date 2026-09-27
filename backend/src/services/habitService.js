import { HabitModel } from '../models/habitModel.js';
import { executeAgentTask } from './aiAgentService.js';
import { createAndStoreEmbedding } from './vectorService.js'; // Import layanan vector

export const HabitService = {
    getAllHabits: () => HabitModel.getAll(),
    
    createHabit: async (title, frequency) => {
        // 1. Simpan ke database utama SQLite
        const result = HabitModel.create(title, frequency);
        
        // 2. [ZERO-CLICK INGESTION]: Otomatis rekam ke vector_memory di background
        try {
            await createAndStoreEmbedding(
                'habit', 
                result.id, 
                `Kebiasaan rutin: ${title} (Frekuensi: ${frequency || 'daily'})`
            );
        } catch (error) {
            console.error("Gagal mencatat vector memory untuk habit:", error.message);
        }

        return result;
    },
    
    generateInsight: async () => {
        const habits = HabitModel.getAll();
        return await executeAgentTask('habit_insight', habits);
    },

    generatePlan: async () => {
        const habits = HabitModel.getAll();
        return await executeAgentTask('habit_plan', habits);
    }
};