import db from '../config/database.js'; // Sesuaikan path database-mu
import { getGeminiModel } from '../config/openclaw.js';

// 1. Otomatis buat embedding di background (Zero-Click Ingestion)
export async function createAndStoreEmbedding(sourceType, sourceId, text) {
    try {
        const model = getGeminiModel();
        const result = await model.embedContent({
            content: { parts: [{ text }] }
        });
        const embeddingJson = JSON.stringify(result.embedding.values);

        const stmt = db.prepare(`
            INSERT INTO vector_memory (source_type, source_id, content, embedding)
            VALUES (?, ?, ?, ?)
        `);
        stmt.run(sourceType, sourceId, text, embeddingJson);
    } catch (error) {
        console.error("Gagal menyimpan vector memory:", error.message);
    }
}

// 2. Mengambil konteks relevan untuk RAG (Hemat token: hanya ambil 1-2 data teratas)
export async function findRelevantMemories(queryText, limit = 2) {
    try {
        const memories = db.prepare(`SELECT content FROM vector_memory ORDER BY id DESC LIMIT ?`).all(limit);
        if (!memories || memories.length === 0) return [];
        return memories.map(m => m.content);
    } catch (error) {
        console.error("Gagal memuat vector memory:", error.message);
        return [];
    }
}