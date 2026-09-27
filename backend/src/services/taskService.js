import { TaskModel } from '../models/taskModel.js';
import { executeAgentTask } from './aiAgentService.js';
import { createAndStoreEmbedding } from './vectorService.js'; // Import layanan vector memory

// 🛠️ UTILITY: Parser teks deadline relatif menjadi format YYYY-MM-DD yang akurat
const parseDeadlineText = (deadlineText) => {
    if (!deadlineText) return new Date().toISOString().split('T')[0];
    
    const lower = deadlineText.toLowerCase().trim();
    const today = new Date();
    
    // 1. Hari Ini / Today / Sekarang
    if (lower.includes('hari ini') || lower.includes('today') || lower.includes('sekarang')) {
        return today.toISOString().split('T')[0];
    } 
    
    // 2. Besok / Tomorrow
    if (lower.includes('besok') || lower.includes('tomorrow')) {
        const target = new Date(today);
        target.setDate(today.getDate() + 1);
        return target.toISOString().split('T')[0];
    }
    
    // 3. Lusa
    if (lower.includes('lusa')) {
        const target = new Date(today);
        target.setDate(today.getDate() + 2);
        return target.toISOString().split('T')[0];
    }
    
    // 4. Deteksi pola angka + hari/minggu/bulan (contoh: "3 hari lagi", "2 minggu lagi")
    const matchRelative = lower.match(/(\d+)\s*(hari|day|minggu|week|bulan|month)/);
    if (matchRelative) {
        const amount = parseInt(matchRelative[1], 10);
        const unit = matchRelative[2];
        const target = new Date(today);
        
        if (unit.startsWith('hari') || unit.startsWith('day')) {
            target.setDate(today.getDate() + amount);
        } else if (unit.startsWith('minggu') || unit.startsWith('week')) {
            target.setDate(today.getDate() + (amount * 7));
        } else if (unit.startsWith('bulan') || unit.startsWith('month')) {
            target.setMonth(today.getMonth() + amount);
        }
        return target.toISOString().split('T')[0];
    }
    
    // 5. Minggu depan / Bulan depan
    if (lower.includes('minggu depan') || lower.includes('next week')) {
        const target = new Date(today);
        target.setDate(today.getDate() + 7);
        return target.toISOString().split('T')[0];
    }
    if (lower.includes('bulan depan') || lower.includes('next month')) {
        const target = new Date(today);
        target.setMonth(today.getMonth() + 1);
        return target.toISOString().split('T')[0];
    }
    
    // 6. Jika format sudah standar YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(deadlineText)) {
        return deadlineText;
    }
    
    return today.toISOString().split('T')[0];
};

export const TaskService = {
    getAllTasks: () => TaskModel.getAll(),
    
    createTask: async (title, deadline, priority) => {
        // 1. Konversi teks deadline alami menjadi format standar YYYY-MM-DD
        const formattedDeadline = parseDeadlineText(deadline);

        // 2. Simpan ke database SQLite utama menggunakan format tanggal yang sudah valid
        const result = TaskModel.create(title, formattedDeadline, priority);
        
        // 3. [ZERO-CLICK INGESTION]: Otomatis rekam ke vector_memory di background
        try {
            await createAndStoreEmbedding(
                'task', 
                result.id, 
                `Tugas aktif: ${title} (Prioritas: ${priority || 'Medium'}, Deadline: ${formattedDeadline})`
            );
        } catch (error) {
            console.error("Gagal mencatat vector memory untuk task:", error.message);
        }

        return result;
    },

    prioritizeTasks: async () => {
        const tasks = TaskModel.getPending();
        return await executeAgentTask('task_prioritize', tasks);
    },

    // 🛠️ Fungsi untuk menangani penghapusan tugas di database SQLite
    deleteTask: async (id) => {
        try {
            const result = TaskModel.delete(id);
            return result;
        } catch (error) {
            console.error("Gagal menghapus tugas di database:", error);
            throw error;
        }
    }
};