import db from '../config/database.js';
import { getGeminiModel } from '../config/openclaw.js';

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

export const getTasks = (req, res, next) => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Ambil semua tugas, lalu kita evaluasi status telat-nya secara dinamis
        const tasks = db.prepare('SELECT * FROM tasks ORDER BY priority DESC, id DESC').all();
        
        const processedTasks = tasks.map(task => {
            // Jika status masih pending dan deadline sudah lewat dari hari ini
            const isOverdue = task.status === 'pending' && task.deadline && task.deadline < todayStr;
            return {
                ...task,
                // Berikan flag atau status terkomputasi jika diperlukan oleh frontend
                isOverdue: isOverdue
            };
        });

        res.json({ success: true, data: processedTasks });
    } catch (error) {
        next(error);
    }
};

export const createTask = (req, res, next) => {
    try {
        const { title, deadline, priority } = req.body;
        
        // Konversi teks deadline dari form (misal: "Besok", "Hari ini") menjadi format YYYY-MM-DD
        const formattedDeadline = parseDeadlineText(deadline);

        const stmt = db.prepare('INSERT INTO tasks (title, deadline, priority, status) VALUES (?, ?, ?, ?)');
        const info = stmt.run(title, formattedDeadline, priority || 'Medium', 'pending');
        
        res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
        next(error);
    }
};

// Endpoint untuk menghapus tugas berdasarkan ID
export const deleteTask = (req, res, next) => {
    try {
        const { id } = req.params;
        const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
        const info = stmt.run(id);

        if (info.changes === 0) {
            return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
        }

        res.json({ success: true, message: 'Tugas berhasil dihapus' });
    } catch (error) {
        next(error);
    }
};

// Endpoint untuk memperbarui status tugas (completed / pending)
export const updateTaskStatus = (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const stmt = db.prepare('UPDATE tasks SET status = ? WHERE id = ?');
        const info = stmt.run(status, id);

        if (info.changes === 0) {
            return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
        }

        res.json({ success: true, message: 'Status tugas berhasil diperbarui' });
    } catch (error) {
        next(error);
    }
};

export const prioritizeTasks = async (req, res, next) => {
    try {
        const tasks = db.prepare("SELECT * FROM tasks WHERE status = 'pending'").all();
        
        if (!tasks || tasks.length === 0) {
            return res.json({ 
                success: true, 
                analysis: JSON.stringify([{ title: "Tidak ada tugas pending", reason: "Semua tugas sudah selesai. Kerja bagus!" }]) 
            });
        }

        const model = getGeminiModel();
        const todayDate = new Date().toISOString().split('T')[0];

        const prompt = `Bertindaklah sebagai AI productivity coach yang cerdas. 
        Hari ini adalah tanggal ${todayDate}. Analisis daftar tugas pending pengguna berikut: ${JSON.stringify(tasks)}.
        
        Instruksi Penting:
        1. Tentukan tugas mana yang **harus dikerjakan terlebih dahulu** berdasarkan kedekatan deadline dan urgensinya terhadap hari ini (${todayDate}).
        2. Berikan output dalam format JSON array murni tanpa teks pengantar atau markdown tambahan (seperti \`\`\`json).
        3. Setiap objek tugas harus memiliki atribut asli ditambah satu atribut **reason** yang menjelaskan: Mengapa tugas ini dipilih, dan instruksi jelas mana yang harus dikerjakan duluan (panjang alasan sekitar 1-2 kalimat yang padat, jelas, dan memotivasi).`;

        const response = await model.generateContent(prompt);

        res.json({ success: true, analysis: response.response.text() });
    } catch (error) {
        next(error);
    }
};