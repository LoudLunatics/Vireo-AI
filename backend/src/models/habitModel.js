import db from '../config/database.js';

export const HabitModel = {
    getAll: () => db.prepare('SELECT * FROM habits ORDER BY id DESC').all(),
    
    getById: (id) => db.prepare('SELECT * FROM habits WHERE id = ?').get(id),
    
    create: (title, frequency) => {
        // Menyertakan kolom last_checked_date agar konsisten dengan struktur tabel di controller
        const stmt = db.prepare('INSERT INTO habits (title, frequency, streak, last_checked_date) VALUES (?, ?, ?, ?)');
        const info = stmt.run(title, frequency || 'daily', 0, null);
        
        // Kembalikan id agar service bisa merekamnya ke vector_memory (jika diperlukan)
        return {
            id: info.lastInsertRowid,
            changes: info.changes
        };
    },
    
    delete: (id) => db.prepare('DELETE FROM habits WHERE id = ?').run(id)
};