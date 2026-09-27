import db from '../config/database.js';

export const ReflectionModel = {
    getAll: () => db.prepare('SELECT * FROM reflections ORDER BY id DESC').all(),
    
    create: (success_point, blocker, improvement, ai_analysis) => {
        const stmt = db.prepare(`
            INSERT INTO reflections (success_point, blocker, improvement, ai_analysis, created_at) 
            VALUES (?, ?, ?, ?, datetime('now'))
        `);
        const info = stmt.run(success_point, blocker, improvement, ai_analysis);
        
        // PENTING: Kembalikan id agar service bisa merekamnya ke vector_memory secara otomatis
        return {
            id: info.lastInsertRowid,
            changes: info.changes
        };
    },
    
    delete: (id) => db.prepare('DELETE FROM reflections WHERE id = ?').run(id)
};