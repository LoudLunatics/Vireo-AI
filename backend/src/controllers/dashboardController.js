import db from '../config/database.js';
import { getGeminiModel } from '../config/openclaw.js';

// Cache sederhana di memori server agar AI tidak dipanggil berulang kali di hari yang sama (Hemat Token 100%)
let cachedDashboardBriefing = {
    date: null,
    text: "Tetap fokus dan selesaikan tugas serta habit harian Anda dengan penuh semangat!",
    isBurnout: false,
    overdueCount: 0
};

export const getDashboardData = async (req, res, next) => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Mengambil statistik dasar secara lokal (0 Token, Super Cepat)
        const habitsCount = db.prepare('SELECT COUNT(*) as count FROM habits').get().count;
        const tasksPending = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'").get().count;
        const goalsCount = db.prepare('SELECT COUNT(*) as count FROM goals').get().count;
        
        // Menghitung total akumulasi streak dari semua habit
        const totalStreakResult = db.prepare('SELECT SUM(streak) as total FROM habits').get();
        const userStreak = totalStreakResult?.total || 0;

        // 2. Deteksi tugas yang sudah lewat deadline (overdue / telat) secara lokal
        const overdueTasks = db.prepare(`
            SELECT * FROM tasks 
            WHERE status != 'completed' AND deadline < ?
        `).all(todayStr);
        const overdueCount = overdueTasks.length;
        const isBurnout = overdueCount >= 3;

        // Mengambil daftar tugas, habit, dan target aktif
        const todayTasks = db.prepare(`
            SELECT * FROM tasks 
            ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, priority DESC 
            LIMIT 5
        `).all();
        
        const habitsToday = db.prepare('SELECT * FROM habits').all();
        const activeGoals = db.prepare('SELECT * FROM goals LIMIT 3').all();
        
        // Mengambil catatan refleksi terbaru
        let recentReflections = [];
        try {
            recentReflections = db.prepare('SELECT * FROM reflections ORDER BY id DESC LIMIT 2').all();
        } catch (refErr) {
            // Abaikan jika tabel reflections belum dibuat
        }

        // 3. PENGELOLAAN CACHE & AI BRIEFING (Mencegah Error 429 & Boros Token)
        let dailyBriefing = cachedDashboardBriefing.text;

        // Cek apakah tanggal hari ini sudah berubah atau belum ada cache
        if (cachedDashboardBriefing.date !== todayStr) {
            try {
                const model = getGeminiModel();
                
                // Prompt dibuat lebih ringkas agar menghemat token output
                const prompt = isBurnout 
                    ? `Sebagai AI Productivity Coach, pengguna mengalami BURNOUT karena ada ${overdueCount} tugas lewat deadline. Berikan briefing 'Recovery Mode' yang menenangkan dan solutif maksimal 2 kalimat pendek.`
                    : `Sebagai AI Productivity Coach, berikan daily briefing produktivitas harian yang memotivasi dan padat berdasarkan tugas aktif hari ini (${todayStr}). Maksimal 2 kalimat pendek.`;
                
                const aiResponse = await model.generateContent({
                    contents: prompt,
                    generationConfig: { maxOutputTokens: 150, temperature: 0.7 }
                });
                
                dailyBriefing = aiResponse.response.text();

                // Simpan ke cache server untuk hari ini
                cachedDashboardBriefing = {
                    date: todayStr,
                    text: dailyBriefing,
                    isBurnout: isBurnout,
                    overdueCount: overdueCount
                };
            } catch (aiError) {
                // Jika terkena kuota habis (429) atau error jaringan, gunakan fallback lokal otomatis!
                console.warn("⚠️ Kuota AI habis / Rate Limit tercapai. Menggunakan fallback briefing lokal.");
                dailyBriefing = isBurnout
                    ? "Recovery Mode aktif: Ambil napas dalam-dalam, selesaikan satu tugas paling penting hari ini, dan abaikan sisanya."
                    : "Hari ini adalah momentum tepat untuk meraih progres signifikan pada target dan tugasmu.";
                
                cachedDashboardBriefing = {
                    date: todayStr,
                    text: dailyBriefing,
                    isBurnout: isBurnout,
                    overdueCount: overdueCount
                };
            }
        }

        // 4. Mengembalikan respons terstruktur ke frontend
        res.json({
            success: true,
            stats: {
                totalHabits: habitsCount,
                pendingTasks: tasksPending,
                activeGoals: goalsCount,
                streak: userStreak
            },
            todayTasks,
            todayHabits: habitsToday,
            activeGoals,
            dailyBriefing,
            isBurnout: cachedDashboardBriefing.isBurnout,
            overdueCount: cachedDashboardBriefing.overdueCount
        });
    } catch (error) {
        next(error);
    }
};