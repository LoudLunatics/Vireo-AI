import db from '../config/database.js';

export const getUnifiedHistory = (req, res, next) => {
    try {
        // 1. Ambil data Goals
        let goals = [];
        try {
            goals = db.prepare('SELECT id, title, target_date, progress, created_at FROM goals').all();
        } catch (e) {
            goals = db.prepare('SELECT id, title, target_date, progress FROM goals').all();
        }
        const formattedGoals = goals.map(g => ({
            id: `goal-${g.id}`,
            originalId: g.id,
            type: 'goal',
            title: g.title,
            subtitle: `Target / Kategori: ${g.target_date || 'Umum'} (Progres: ${g.progress || 0}%)`,
            created_at: g.created_at || new Date().toISOString()
        }));

        // 2. Ambil data Tasks
        let tasks = [];
        try {
            tasks = db.prepare('SELECT id, title, status, deadline, created_at FROM tasks').all();
        } catch (e) {
            try { tasks = db.prepare('SELECT id, title, status, deadline FROM tasks').all(); } catch (err) {}
        }
        const formattedTasks = tasks.map(t => ({
            id: `task-${t.id}`,
            originalId: t.id,
            type: 'task',
            title: t.title,
            subtitle: `Status: ${t.status} | Deadline: ${t.deadline || '-'}`,
            created_at: t.created_at || t.deadline || new Date().toISOString()
        }));

        // 3. Ambil data Habits
        let habits = [];
        try {
            habits = db.prepare('SELECT id, title, created_at FROM habits').all();
        } catch (e) {
            try { habits = db.prepare('SELECT id, title FROM habits').all(); } catch (err) {}
        }
        const formattedHabits = habits.map(h => ({
            id: `habit-${h.id}`,
            originalId: h.id,
            type: 'habit',
            title: h.title,
            subtitle: 'Habit / Rutinitas Harian',
            created_at: h.created_at || new Date().toISOString()
        }));

        // 4. Ambil data Reflections
        let reflections = [];
        try {
            reflections = db.prepare('SELECT id, content, analysis, created_at FROM reflections').all();
        } catch (e) {}
        const formattedReflections = reflections.map(r => ({
            id: `reflection-${r.id}`,
            originalId: r.id,
            type: 'reflection',
            title: r.content || 'Refleksi Harian',
            subtitle: r.analysis ? `AI: ${r.analysis.substring(0, 60)}...` : 'Catatan Refleksi',
            content: r.content,
            analysis: r.analysis,
            created_at: r.created_at || new Date().toISOString()
        }));

        // Gabungkan semua jenis riwayat
        const combined = [
            ...formattedGoals,
            ...formattedTasks,
            ...formattedHabits,
            ...formattedReflections
        ];

        // Urutkan berdasarkan waktu terbaru (Descending)
        combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json({ success: true, data: combined });
    } catch (error) {
        console.error("Gagal mengambil unified history:", error);
        next(error);
    }
};