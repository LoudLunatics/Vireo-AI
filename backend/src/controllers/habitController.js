import db from '../config/database.js';
import { getGeminiModel } from '../config/openclaw.js';

// Helper untuk mendapatkan format 'YYYY-MM-DD' berdasarkan waktu lokal perangkat/server
const getLocalISODate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Cache sederhana untuk menyimpan insight harian agar hemat token (dipanggil sekali sehari)
let cachedHabitInsight = {
    date: null,
    text: "Pertahankan konsistensi harianmu, setiap langkah kecil membawa perubahan besar!"
};

// Ambil semua habit beserta data log harian dan total habit aktif untuk heatmap dinamis
export const getHabits = (req, res, next) => {
    try {
        const habits = db.prepare('SELECT * FROM habits ORDER BY id DESC').all();
        
        // Ambil riwayat log centang dari tabel habit_logs untuk keperluan heatmap frontend
        const logs = db.prepare('SELECT habit_id, date FROM habit_logs').all();

        // Hitung total habit yang aktif saat ini untuk acuan persentase heatmap
        const totalHabits = habits.length;

        res.json({ 
            success: true, 
            data: habits, 
            logs: logs,
            totalHabits: totalHabits // <-- Properti baru untuk perhitungan rasio warna heatmap
        });
    } catch (error) {
        next(error);
    }
};

export const createHabit = (req, res, next) => {
    try {
        const { title, frequency } = req.body;
        const stmt = db.prepare('INSERT INTO habits (title, frequency, streak, last_checked_date) VALUES (?, ?, ?, ?)');
        const info = stmt.run(title, frequency || 'daily', 0, null);
        res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
        next(error);
    }
};

// Fungsi untuk menghapus habit berdasarkan ID
export const deleteHabit = (req, res, next) => {
    try {
        const { id } = req.params;
        const stmt = db.prepare('DELETE FROM habits WHERE id = ?');
        const info = stmt.run(id);

        if (info.changes === 0) {
            return res.status(404).json({ success: false, message: "Kebiasaan tidak ditemukan." });
        }

        res.json({ success: true, message: "Kebiasaan berhasil dihapus." });
    } catch (error) {
        next(error);
    }
};

// Menggunakan Caching Harian & maxOutputTokens agar Super Hemat Token
export const getHabitInsight = async (req, res, next) => {
    try {
        const habits = db.prepare('SELECT title, frequency, streak FROM habits').all();
        
        if (!habits || habits.length === 0) {
            return res.json({ 
                success: true, 
                insight: "Mulai buat kebiasaan baik pertamamu hari ini untuk membangun konsistensi jangka panjang!" 
            });
        }

        const todayStr = getLocalISODate(); // Menggunakan tanggal lokal murni

        // Jika hari ini sudah ada cache insight, gunakan langsung (0 Token tambahan!)
        if (cachedHabitInsight.date === todayStr) {
            return res.json({ success: true, insight: cachedHabitInsight.text });
        }

        let insightText = "Pertahankan konsistensi harianmu, setiap langkah kecil membawa perubahan besar!";
        
        try {
            const model = getGeminiModel();
            // Data yang dikirim ke AI dibuat lebih ringkas (hanya title, frequency, streak) untuk menghemat input token
            const prompt = `Analisis daftar kebiasaan berikut dan berikan 1-2 kalimat motivasi padat dalam bahasa Indonesia: ${JSON.stringify(habits)}`;
            
            const aiResponse = await model.generateContent({
                contents: prompt,
                generationConfig: { 
                    maxOutputTokens: 100, // Batasan sangat ketat agar hemat token
                    temperature: 0.7 
                }
            });
            
            if (aiResponse && aiResponse.response) {
                insightText = aiResponse.response.text().trim();
                // Simpan ke cache
                cachedHabitInsight = { date: todayStr, text: insightText };
            }
        } catch (aiError) {
            console.warn("Peringatan: Gagal memuat AI Habit Insight (Rate Limit/Kuot Habis), menggunakan fallback lokal.");
        }

        res.json({ success: true, insight: insightText });
    } catch (error) {
        next(error);
    }
};

export const getAIPlan = async (req, res, next) => {
    try {
        const { goal } = req.body; 
        const targetGoal = goal || 'Membangun kebiasaan produktif';
        
        const model = getGeminiModel();
        const prompt = `Bertindaklah sebagai AI productivity coach. Tujuan: "${targetGoal}". 
        Instruksi:
        1. Buat 3 langkah kebiasaan (habit) spesifik.
        2. Format output WAJIB JSON Array murni tanpa teks lain, tanpa markdown (\`\`\`json).
        3. Atribut tiap objek: "title" (string), "frequency" ("daily" / "weekly"), "resource_title" (string), "resource_url" (string atau "").`;

        const response = await model.generateContent({
            contents: prompt,
            generationConfig: { 
                maxOutputTokens: 300, // Batasi token output untuk pembuatan rencana
                temperature: 0.7 
            }
        });
        
        const textResponse = response.response.text().trim();
        const cleaned = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedHabits = JSON.parse(cleaned);

        if (Array.isArray(parsedHabits) && parsedHabits.length > 0) {
            return res.json({ success: true, habits: parsedHabits });
        }

        throw new Error("Format JSON dari AI tidak valid");
        
    } catch (error) {
        console.error("Error saat memuat AI Habit Plan:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Agen AI sedang sibuk atau kuota habis. Silakan coba beberapa saat lagi." 
        });
    }
};

export const saveAIPlanHabits = (req, res, next) => {
    try {
        const { habitsList } = req.body; 

        if (!habitsList || !Array.isArray(habitsList) || habitsList.length === 0) {
            return res.status(400).json({ success: false, message: "Tidak ada data habit yang valid untuk disimpan." });
        }

        const insertStmt = db.prepare('INSERT INTO habits (title, frequency, streak, last_checked_date) VALUES (?, ?, ?, ?)');
        
        const insertMany = db.transaction((habits) => {
            for (const item of habits) {
                insertStmt.run(item.title, item.frequency || 'daily', 0, null);
            }
        });

        insertMany(habitsList);

        res.json({ success: true, message: "Rencana kebiasaan berhasil disimpan ke daftar Anda!" });
    } catch (error) {
        next(error);
    }
};

// Menggunakan tabel log harian (habit_logs) agar centang hari sebelumnya tidak tertimpa
export const toggleHabit = (req, res, next) => {
    try {
        const { id } = req.params;
        const today = getLocalISODate(); // Menggunakan tanggal lokal yang akurat (WIB/lokal server)

        const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
        if (!habit) {
            return res.status(404).json({ success: false, message: "Kebiasaan tidak ditemukan" });
        }

        // Cek apakah hari ini sudah ada log centangnya
        const existingLog = db.prepare('SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?').get(id, today);

        if (existingLog) {
            return res.status(400).json({ 
                success: false, 
                message: "Kebiasaan ini sudah diselesaikan hari ini dan tidak dapat dibatalkan." 
            });
        }

        // Simpan log harian ke tabel habit_logs agar riwayat tanggal-tanggal sebelumnya aman
        db.prepare('INSERT INTO habit_logs (habit_id, date, completed) VALUES (?, ?, 1)').run(id, today);

        const newStreak = habit.streak + 1;
        const stmt = db.prepare('UPDATE habits SET streak = ?, last_checked_date = ? WHERE id = ?');
        stmt.run(newStreak, today, id);

        res.json({ 
            success: true, 
            message: "Habit berhasil dicentang", 
            streak: newStreak,
            last_checked_date: today 
        });
    } catch (error) {
        next(error);
    }
};