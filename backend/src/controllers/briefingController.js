import db from '../config/database.js';
import { getGeminiModel } from '../config/openclaw.js';

// Helper untuk mendapatkan format tanggal lokal YYYY-MM-DD
const getLocalISODate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Cache harian (ditambahkan taskCount agar cache otomatis refresh jika ada task baru)
let cachedBriefingData = {
    date: null,
    briefing: null,
    isBurnout: false,
    overdueCount: 0,
    taskCount: 0
};

export const getDailyBriefing = async (req, res, next) => {
    try {
        const today = getLocalISODate();

        // Format tanggal manusia (Contoh: "Selasa, 22 September 2026")
        const options = { timeZone: 'Asia/Jakarta', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const humanDate = new Date().toLocaleDateString('id-ID', options);

        // 1. Ambil daftar tugas aktif dan urutkan berdasarkan prioritas
        const pendingTasks = db.prepare(`
            SELECT title, priority, deadline FROM tasks 
            WHERE status != 'completed'
            ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END ASC
        `).all();

        const urgentTasks = pendingTasks.filter(t => t.priority === 'high');
        const overdueTasks = pendingTasks.filter(t => t.deadline && t.deadline < today);
        const overdueCount = overdueTasks.length;
        const isBurnout = overdueCount >= 3;

        // 2. Ambil SEMUA target (Goals) agar tahu mana yang selesai (100%) dan yang aktif
        const allGoals = db.prepare(`SELECT title, progress FROM goals`).all();
        const completedGoals = allGoals.filter(g => g.progress === 100);
        const activeGoals = allGoals.filter(g => g.progress < 100);

        // 3. Ambil daftar kebiasaan (Habits)
        const activeHabits = db.prepare(`SELECT title FROM habits`).all();

        // Cek cache harian (diperbarui dengan taskCount)
        if (cachedBriefingData.date === today && 
            cachedBriefingData.overdueCount === overdueCount && 
            cachedBriefingData.taskCount === pendingTasks.length) {
            return res.json({ 
                success: true, 
                briefing: cachedBriefingData.briefing,
                isBurnout: isBurnout,
                overdueCount: overdueCount
            });
        }

        let briefingText = "";

        try {
            const model = getGeminiModel();

            // Susun teks konteks data untuk AI secara spesifik
            const tasksContext = pendingTasks.length > 0 
                ? pendingTasks.map(t => `- [Prioritas: ${t.priority.toUpperCase()}] ${t.title} ${t.deadline ? `(Deadline: ${t.deadline})` : ''}`).join('\n')
                : "Tidak ada tugas aktif.";

            const goalsContext = allGoals.length > 0
                ? allGoals.map(g => `- Target: "${g.title}" (${g.progress}% selesai)`).join('\n')
                : "Belum ada target spesifik.";

            const habitsContext = activeHabits.length > 0
                ? activeHabits.map(h => `- Habit: ${h.title}`).join('\n')
                : "Belum ada habit.";

            // Prompt ketat yang memaksa AI merinci angka tugas, task urgent, telat, goal, dan habit
            const prompt = `
ATURAN MUTLAK: Hari ini adalah ${humanDate} (${today}). Kamu WAJIB menyebutkan tanggal hari ini ("${humanDate}") di awal kalimat briefing.
Bertindaklah sebagai AI Productivity Coach yang cerdas, detail, dan memotivasi. Buatlah Daily Briefing komprehensif dalam 2-3 kalimat yang wajib merangkum:
1. Tanggal hari ini (${humanDate}).
2. Total tugas aktif (${pendingTasks.length} tugas), sebutkan berapa yang URGENT (prioritas high: ${urgentTasks.length}) dan berapa yang TELAT/overdue (${overdueCount} tugas).
3. Status Target (Goals): Berapa target yang sudah selesai (100% dari ${completedGoals.length} target) dan berapa yang masih berjalan (${activeGoals.length} target).
4. Status Kebiasaan (Habits): Jumlah kebiasaan rutin yang perlu dijaga (${activeHabits.length} habit).

Data Mentah Pengguna:
- Tanggal: ${humanDate}
- Total Tugas Aktif: ${pendingTasks.length} (Urgent: ${urgentTasks.length}, Telat: ${overdueCount})
- Daftar Tugas:
${tasksContext}
- Status Target (Goals): ${completedGoals.length} selesai, ${activeGoals.length} berjalan.
${goalsContext}
- Kebiasaan (Habits): ${activeHabits.length} habit aktif.
${habitsContext}

Gunakan gaya bahasa yang memotivasi, profesional, dan sebutkan detail angka-angka tersebut secara natural dan ringkas dalam kalimat.
            `.trim();

            const aiResponse = await model.generateContent({
                contents: prompt,
                generationConfig: {
                    maxOutputTokens: 220, 
                    temperature: 0.7,
                }
            });

            briefingText = aiResponse.response.text().trim();

        } catch (aiError) {
            console.warn("⚠️ Gagal memuat AI Briefing, menggunakan fallback kaya data.");
            const mainGoal = activeGoals.length > 0 ? activeGoals[0].title : "target utamamu";
            briefingText = `Selamat Pagi! Hari ini ${humanDate}, kamu memiliki ${pendingTasks.length} tugas aktif (${urgentTasks.length} urgent, ${overdueCount} telat), dengan ${completedGoals.length} target selesai, ${activeGoals.length} target aktif, dan ${activeHabits.length} habit rutin. Tetap semangat!`;
        }

        // Simpan ke cache harian dengan taskCount terbaru
        cachedBriefingData = {
            date: today,
            briefing: briefingText,
            isBurnout: isBurnout,
            overdueCount: overdueCount,
            taskCount: pendingTasks.length
        };

        res.json({ 
            success: true, 
            briefing: briefingText,
            isBurnout: isBurnout,
            overdueCount: overdueCount
        });

    } catch (error) {
        console.error("Gagal menghasilkan Daily Briefing:", error);
        next(error);
    }
};