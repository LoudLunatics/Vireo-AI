import db from '../config/database.js';

// 🛠️ UTILITY: Parser teks target date relatif menjadi format YYYY-MM-DD yang akurat
const parseTargetDateText = (dateText) => {
    if (!dateText) return new Date().toISOString().split('T')[0];
    
    const lower = dateText.toLowerCase().trim();
    const today = new Date();
    
    // 1. Hari Ini / Today
    if (lower.includes('hari ini') || lower.includes('today')) {
        return today.toISOString().split('T')[0];
    } 
    
    // 2. Akhir minggu / End of week (menghitung hari Minggu terdekat)
    if (lower.includes('akhir minggu') || lower.includes('end of week')) {
        const target = new Date(today);
        const day = target.getDay();
        const diff = target.getDate() + (7 - day) % 7; // Menuju hari Minggu
        target.setDate(diff);
        return target.toISOString().split('T')[0];
    }
    
    // 3. Deteksi pola angka + hari/minggu/bulan (contoh: "2 minggu lagi", "1 bulan lagi")
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
    
    // 4. Jika format sudah standar YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
        return dateText;
    }
    
    return today.toISOString().split('T')[0];
};

export const GoalModel = {
    getAll: () => db.prepare('SELECT * FROM goals ORDER BY id DESC').all(),
    
    create: (title, target_date) => {
        // Konversi teks target date menjadi format YYYY-MM-DD yang seragam
        const formattedTargetDate = parseTargetDateText(target_date);

        const stmt = db.prepare('INSERT INTO goals (title, target_date, progress) VALUES (?, ?, ?)');
        const info = stmt.run(title, formattedTargetDate, 0);
        
        // Kembalikan id agar service bisa merekamnya ke vector_memory
        return {
            id: info.lastInsertRowid,
            changes: info.changes,
            target_date: formattedTargetDate
        };
    },
    
    updateProgress: (id, progress) => {
        const stmt = db.prepare('UPDATE goals SET progress = ? WHERE id = ?');
        return stmt.run(progress, id);
    },
    
    delete: (id) => db.prepare('DELETE FROM goals WHERE id = ?').run(id)
};