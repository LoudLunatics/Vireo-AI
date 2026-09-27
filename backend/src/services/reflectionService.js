import { ReflectionModel } from '../models/reflectionModel.js';
import { executeAgentTask } from './aiAgentService.js';
import { createAndStoreEmbedding } from './vectorService.js';

export const ReflectionService = {
    getAllReflections: () => ReflectionModel.getAll(),
    
    createAndAnalyze: async (content) => {
        // 1. Jalankan agen AI untuk menganalisis refleksi
        // Pastikan task 'reflection_analysis' di agen mengembalikan format terstruktur (analysis & suggestedItem)
        const aiResult = await executeAgentTask('reflection_analysis', { content });
        
        // Menangani format kembalian baik berupa string langsung maupun objek terstruktur
        const analysis = typeof aiResult === 'object' ? aiResult.analysis : aiResult;
        const suggestedItem = typeof aiResult === 'object' ? aiResult.suggestedItem : null;
        
        // 2. Simpan ke database SQLite utama
        const result = ReflectionModel.create(content, analysis);
        
        // 3. [ZERO-CLICK INGESTION]: Otomatis rekam ke vector_memory di background untuk RAG
        try {
            await createAndStoreEmbedding(
                'reflection', 
                result.id, 
                `Refleksi: ${content} | Analisis AI: ${analysis}`
            );
        } catch (error) {
            console.error("Gagal mencatat vector memory untuk reflection:", error.message);
        }

        // Kembalikan data lengkap ke controller agar bisa diteruskan ke frontend
        return { 
            id: result.id, 
            analysis, 
            suggestedItem 
        };
    }
};