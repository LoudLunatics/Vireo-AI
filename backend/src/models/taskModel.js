import db from '../config/database.js';

export const TaskModel = {
    getAll: () => db.prepare('SELECT * FROM tasks ORDER BY priority DESC, id DESC').all(),
    
    getPending: () => db.prepare('SELECT * FROM tasks WHERE status = "pending" ORDER BY priority DESC').all(),
    
    create: (title, deadline, priority) => {
        // Menggunakan format YYYY-MM-DD untuk default deadline agar kalkulasi telat akurat
        const defaultDate = new Date().toISOString().split('T')[0];
        
        const stmt = db.prepare('INSERT INTO tasks (title, deadline, priority, status) VALUES (?, ?, ?, ?)');
        const info = stmt.run(title, deadline || defaultDate, priority || 'Medium', 'pending');
        
        // PENTING: Kembalikan objek yang mencakup lastInsertRowid agar service bisa 
        // merekam ID tugas ini ke dalam vector_memory secara otomatis (Zero-Click).
        return {
            id: info.lastInsertRowid,
            changes: info.changes
        };
    },
    
    updateStatus: (id, status) => {
        const stmt = db.prepare('UPDATE tasks SET status = ? WHERE id = ?');
        return stmt.run(status, id);
    },
    
    delete: (id) => db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
};