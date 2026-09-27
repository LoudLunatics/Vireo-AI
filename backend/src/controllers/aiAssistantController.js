import db from '../config/database.js';
import { getGeminiModel } from '../config/openclaw.js';
import { createAndStoreEmbedding, findRelevantMemories } from '../services/vectorService.js';

// 🛠️ HELPER: Format tanggal lokal perangkat agar bebas dari pergeseran UTC
const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// 🛡️ SECURITY GUARD HELPER 1: Deteksi perintah berbahaya / Prompt Injection / SQL Injection
const isSuspiciousPrompt = (text) => {
    if (!text || typeof text !== 'string') return false;
    const lower = text.toLowerCase();
    
    // Daftar pola serangan injection & instruksi merusak
    const dangerPatterns = [
        'drop table',
        'delete from',
        'truncate',
        'alter table',
        'ignore previous',
        'ignore all previous',
        'system prompt',
        'bypass security',
        'exec(',
        '<script'
    ];

    return dangerPatterns.some(pattern => lower.includes(pattern));
};

// 🛡️ SECURITY GUARD HELPER 2: Validasi kata kunci agar kebal dari Wildcard Abuse
const isValidKeyword = (keyword) => {
    if (!keyword || typeof keyword !== 'string') return false;
    const trimmed = keyword.trim();
    return trimmed.length >= 2 && !/^[%_\s]+$/.test(trimmed);
};

// 🛠️ UTILITY: Parser teks deadline relatif atau rentang waktu goal
const parseDeadlineText = (deadlineText) => {
    if (!deadlineText) return 'Mingguan';
    
    const lower = deadlineText.toLowerCase().trim();
    
    if (lower.includes('tahun') || lower.includes('yearly')) return 'Tahunan';
    if (lower.includes('bulan') || lower.includes('monthly')) return 'Bulanan';
    if (lower.includes('minggu') || lower.includes('weekly')) return 'Mingguan';

    const today = new Date();
    
    if (lower.includes('hari ini') || lower.includes('today') || lower.includes('sekarang')) {
        return getLocalDateString(today);
    } 
    if (lower.includes('besok') || lower.includes('tomorrow')) {
        const target = new Date(today);
        target.setDate(today.getDate() + 1);
        return getLocalDateString(target);
    }
    if (lower.includes('lusa')) {
        const target = new Date(today);
        target.setDate(today.getDate() + 2);
        return getLocalDateString(target);
    }
    
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
        return getLocalDateString(target);
    }
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(deadlineText)) {
        return deadlineText;
    }
    
    return deadlineText;
};

export const handleAIAssistantCommand = async (req, res, next) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ success: false, message: "Prompt tidak boleh kosong." });
        }

        // 🛡️ SECURITY GUARD: Filter & log jika terdeteksi Prompt Injection / SQL Injection
        if (isSuspiciousPrompt(prompt)) {
            console.warn(`[SECURITY GUARD] Blocked suspicious SQL/Prompt Injection payload from client: "${prompt}"`);
            return res.json({
                success: true,
                data: {
                    action: "GENERAL",
                    replyMessage: "Sepertinya kamu mencoba memberikan instruksi yang tidak relevan dengan fungsi produktivitasku. Aku di sini untuk membantumu mengelola tugas, kebiasaan, dan targetmu!"
                }
            });
        }

        const todayDateStr = getLocalDateString(new Date());

        // 1. [RAG RETRIEVAL]: Cari memori masa lalu yang relevan secara semantik
        const relevantMemories = await findRelevantMemories(prompt, 2);
        let memoryContext = "";
        if (relevantMemories && relevantMemories.length > 0) {
            memoryContext = `\nKonteks memori masa lalu pengguna:\n- ${relevantMemories.join('\n- ')}`;
        }

        const model = getGeminiModel();
        
        const systemInstruction = `
            Anda adalah Vireo AI Assistant, co-pilot produktivitas untuk developer di aplikasi Vireo.ai.
            
            [INFORMASI WAKTU SISTEM]: Hari ini adalah tanggal ${todayDateStr}. Gunakan tanggal ini sebagai titik acuan mutlak untuk semua perhitungan waktu relatif.

            Analisis perintah user: "${prompt}"
            ${memoryContext}
            
            ATURAN UTAMA:
            1. Tentukan kategori tindakan (action) yang paling tepat:
               - "ADD_TASK": Menambah tugas baru. Ekstrak: title, priority, deadline.
               - "ADD_HABIT": Menambah kebiasaan baru. Ekstrak: title, frequency.
               - "ADD_GOAL": Menambah target besar. Ekstrak: title, target_date.
               - "UPDATE_TASK", "DELETE_TASK", "COMPLETE_TASK": Manajemen tugas. Ekstrak: title, newTitle, priority, deadline.
               - "UPDATE_HABIT", "DELETE_HABIT": Manajemen kebiasaan. Ekstrak: title, newTitle, frequency.
               - "UPDATE_GOAL", "DELETE_GOAL": Manajemen target. Ekstrak: title, newTitle, target_date.
               - "GET_GOALS": Menampilkan daftar target jangka panjang yang sedang berjalan.
               - "GET_REFLECTION": Meminta ringkasan umum / progres mingguan sistem.
               - "GET_HABIT_STREAK": Mengecek konsistensi / streak habit harian.
               - "GET_URGENT_TASKS": Meminta rangkuman tugas mendesak atau prioritas tinggi.
               - "GET_TODAY_PRIORITIES": Menanyakan prioritas pekerjaan khusus hari ini.
               - "MOTIVATE" atau "GENERAL": Motivasi, sapaan, atau penolakan pertanyaan di luar konteks produktivitas.

            2. KHUSUS UNTUK PERTANYAAN DI LUAR KONTEKS PRODUKTIVITAS:
               - Gunakan action "GENERAL".
               - Berikan respons penolakan yang ramah, santai, humanis, dan SINGKAT (maksimal 2-3 kalimat) pada "replyMessage".

            3. Format respons HARUS berupa JSON murni TANPA markdown block (tanpa \`\`\`json):
            {
              "action": "...",
              "replyMessage": "...",
              "data": {
                "title": "...",
                "newTitle": "...",
                "priority": "Medium",
                "deadline": "...",
                "frequency": "daily",
                "target_date": "..."
              }
            }
        `;

        const response = await model.generateContent(systemInstruction);
        const rawText = response.response.text().trim();

        // Pengaman JSON Parsing agar terhindar dari error SyntaxError
        let aiResult;
        try {
            const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : cleanJson;
            aiResult = JSON.parse(jsonString);
        } catch (parseErr) {
            console.error("Gagal parse JSON AI:", parseErr.message, "Raw Response:", rawText);
            aiResult = {
                action: "GENERAL",
                replyMessage: "Wah, tanggapan saya tadi sempat terpotong. 😅 Mari fokus kembali ke produktivitasmu, ada tugas yang ingin dibereskan?"
            };
        }

        if (!aiResult.action) aiResult.action = "GENERAL";
        if (!aiResult.replyMessage) aiResult.replyMessage = "Perintah berhasil diproses.";

        // 2. EKSEKUSI KE DATABASE SQLITE & VECTOR
        if (aiResult.action === "ADD_TASK" && aiResult.data) {
            const { title, priority, deadline } = aiResult.data;
            const finalTitle = title || prompt;
            const formattedDeadline = parseDeadlineText(deadline);

            const stmt = db.prepare('INSERT INTO tasks (title, priority, deadline, status) VALUES (?, ?, ?, ?)');
            const info = stmt.run(finalTitle, priority || 'Medium', formattedDeadline, 'pending');
            
            await createAndStoreEmbedding('task', info.lastInsertRowid, `Tugas aktif: ${finalTitle} (Prioritas: ${priority || 'Medium'}, Deadline: ${formattedDeadline})`);
        } 
        else if (aiResult.action === "ADD_HABIT" && aiResult.data) {
            const { title, frequency } = aiResult.data;
            const finalTitle = title || prompt;
            const stmt = db.prepare('INSERT INTO habits (title, frequency, streak) VALUES (?, ?, ?)');
            const info = stmt.run(finalTitle, frequency || 'daily', 0);
            
            await createAndStoreEmbedding('habit', info.lastInsertRowid, `Kebiasaan rutin: ${finalTitle} (${frequency || 'daily'})`);
        } 
        else if (aiResult.action === "ADD_GOAL" && aiResult.data) {
            const { title, target_date } = aiResult.data;
            const finalTitle = title || prompt;
            const formattedTargetDate = parseDeadlineText(target_date);

            const stmt = db.prepare('INSERT INTO goals (title, target_date, progress) VALUES (?, ?, ?)');
            const info = stmt.run(finalTitle, formattedTargetDate, 0);
            
            await createAndStoreEmbedding('goal', info.lastInsertRowid, `Target (${formattedTargetDate}): ${finalTitle}`);
        }
        else if (aiResult.action === "UPDATE_HABIT" && aiResult.data) {
            const { title, newTitle, frequency } = aiResult.data;
            if (isValidKeyword(title)) {
                const stmt = db.prepare("UPDATE habits SET title = COALESCE(?, title), frequency = COALESCE(?, frequency) WHERE title LIKE ?");
                const info = stmt.run(newTitle ? newTitle.trim() : null, frequency || null, `%${title.trim()}%`);
                if (info.changes > 0) aiResult.replyMessage = `Berhasil memperbarui kebiasaan "${title}"! 🔄`;
                else aiResult.replyMessage = `Kebiasaan "${title}" tidak ditemukan.`;
            } else {
                aiResult.replyMessage = "Kata kunci kebiasaan tidak valid.";
            }
        }
        else if (aiResult.action === "DELETE_HABIT" && aiResult.data) {
            const { title } = aiResult.data;
            if (isValidKeyword(title)) {
                const stmt = db.prepare("DELETE FROM habits WHERE title LIKE ?");
                const info = stmt.run(`%${title.trim()}%`);
                if (info.changes > 0) aiResult.replyMessage = `Kebiasaan "${title}" berhasil dihapus. 🗑️`;
                else aiResult.replyMessage = `Kebiasaan "${title}" tidak ditemukan.`;
            } else {
                aiResult.replyMessage = "Kata kunci kebiasaan tidak valid.";
            }
        }
        else if (aiResult.action === "UPDATE_GOAL" && aiResult.data) {
            const { title, newTitle, target_date } = aiResult.data;
            if (isValidKeyword(title)) {
                const formattedTargetDate = target_date ? parseDeadlineText(target_date) : null;
                const stmt = db.prepare("UPDATE goals SET title = COALESCE(?, title), target_date = COALESCE(?, target_date) WHERE title LIKE ?");
                const info = stmt.run(newTitle ? newTitle.trim() : null, formattedTargetDate, `%${title.trim()}%`);
                if (info.changes > 0) aiResult.replyMessage = `Berhasil memperbarui target "${title}"! 🎯`;
                else aiResult.replyMessage = `Target "${title}" tidak ditemukan.`;
            } else {
                aiResult.replyMessage = "Kata kunci target tidak valid.";
            }
        }
        else if (aiResult.action === "DELETE_GOAL" && aiResult.data) {
            const { title } = aiResult.data;
            if (isValidKeyword(title)) {
                const stmt = db.prepare("DELETE FROM goals WHERE title LIKE ?");
                const info = stmt.run(`%${title.trim()}%`);
                if (info.changes > 0) aiResult.replyMessage = `Target "${title}" berhasil dihapus. 🗑️`;
                else aiResult.replyMessage = `Target "${title}" tidak ditemukan.`;
            } else {
                aiResult.replyMessage = "Kata kunci target tidak valid.";
            }
        }
        else if (aiResult.action === "COMPLETE_TASK" && aiResult.data) {
            const { title } = aiResult.data;
            if (isValidKeyword(title)) {
                const stmt = db.prepare("UPDATE tasks SET status = 'completed' WHERE title LIKE ? AND status = 'pending'");
                const info = stmt.run(`%${title.trim()}%`);
                if (info.changes > 0) aiResult.replyMessage = `Berhasil! Tugas "${title}" ditandai selesai. 🎉`;
                else aiResult.replyMessage = `Tugas aktif "${title}" tidak ditemukan.`;
            } else {
                aiResult.replyMessage = "Kata kunci tugas tidak valid.";
            }
        }
        else if (aiResult.action === "DELETE_TASK" && aiResult.data) {
            const { title } = aiResult.data;
            if (isValidKeyword(title)) {
                const stmt = db.prepare("DELETE FROM tasks WHERE title LIKE ?");
                const info = stmt.run(`%${title.trim()}%`);
                if (info.changes > 0) aiResult.replyMessage = `Tugas "${title}" berhasil dihapus. 🗑️`;
                else aiResult.replyMessage = `Tugas "${title}" tidak ditemukan.`;
            } else {
                aiResult.replyMessage = "Kata kunci tugas tidak valid atau berisiko tinggi.";
            }
        }
        else if (aiResult.action === "UPDATE_TASK" && aiResult.data) {
            const { title, newTitle, priority, deadline } = aiResult.data;
            if (isValidKeyword(title)) {
                const formattedDeadline = deadline ? parseDeadlineText(deadline) : null;
                const stmt = db.prepare(`
                    UPDATE tasks 
                    SET title = COALESCE(?, title), priority = COALESCE(?, priority), deadline = COALESCE(?, deadline) 
                    WHERE title LIKE ? AND status = 'pending'
                `);
                const info = stmt.run(newTitle ? newTitle.trim() : null, priority || null, formattedDeadline, `%${title.trim()}%`);
                if (info.changes > 0) aiResult.replyMessage = `Berhasil memperbarui tugas "${title}"! 🛠️`;
                else aiResult.replyMessage = `Tugas aktif "${title}" tidak ditemukan.`;
            } else {
                aiResult.replyMessage = "Kata kunci tugas tidak valid.";
            }
        }
        else if (aiResult.action === "GET_GOALS") {
            const goals = db.prepare("SELECT title, target_date, progress FROM goals").all();
            if (goals.length > 0) {
                const goalText = goals.map((g, index) => 
                    `${index + 1}. 🎯 **${g.title}**\n   └ *Target:* ${g.target_date} | *Progres:* ${g.progress}%`
                ).join('\n\n');
                
                aiResult.replyMessage = `🎯 **Daftar Target Jangka Panjang Anda:**\n\n${goalText}\n\nTerus kejar targetmu hingga tuntas!`;
            } else {
                aiResult.replyMessage = "Belum ada target jangka panjang yang tercatat. Coba buat target baru sekarang!";
            }
        }
        else if (aiResult.action === "GET_REFLECTION") {
            const taskCount = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status='pending'").get().count;
            const habitCount = db.prepare("SELECT COUNT(*) as count FROM habits").get().count;
            const goalCount = db.prepare("SELECT COUNT(*) as count FROM goals").get().count;
            aiResult.replyMessage = `📊 **Analisis Progres Mingguan:**\n\n• Tugas Pending: ${taskCount}\n• Kebiasaan Aktif: ${habitCount}\n• Target Berjalan: ${goalCount}\n\nPertahankan ritme kerja yang produktif ini!`;
        }
        else if (aiResult.action === "GET_HABIT_STREAK") {
            const habits = db.prepare("SELECT title, streak, frequency FROM habits").all();
            if (habits.length > 0) {
                const habitText = habits.map(h => `• **${h.title}** (${h.frequency}) — Streak: 🔥 ${h.streak} hari`).join('\n\n');
                aiResult.replyMessage = `🔥 **Konsistensi Habit Harian:**\n\n${habitText}\n\nJaga terus konsistensinya setiap hari!`;
            } else {
                aiResult.replyMessage = "Belum ada habit yang tercatat. Coba buat habit baru sekarang!";
            }
        }
        else if (aiResult.action === "GET_URGENT_TASKS") {
            const urgentTasks = db.prepare("SELECT title, priority, deadline FROM tasks WHERE status='pending' AND (priority='High' OR deadline <= date('now'))").all();
            if (urgentTasks.length > 0) {
                const taskText = urgentTasks.map(t => `• **${t.title}**\n   └ *Prioritas:* ${t.priority} | *Deadline:* ${t.deadline}`).join('\n\n');
                aiResult.replyMessage = `⚡ **Daftar Tugas Mendesak:**\n\n${taskText}\n\nFokus selesaikan tugas-tugas ini terlebih dahulu!`;
            } else {
                aiResult.replyMessage = "✨ Luar biasa! Tidak ada tugas mendesak atau prioritas tinggi yang tertunda saat ini.";
            }
        }
        else if (aiResult.action === "GET_TODAY_PRIORITIES") {
            const todayTasks = db.prepare("SELECT title, priority FROM tasks WHERE status='pending' AND deadline = ?").all(todayDateStr);
            if (todayTasks.length > 0) {
                const taskText = todayTasks.map(t => `• **${t.title}** (Prioritas: ${t.priority})`).join('\n\n');
                aiResult.replyMessage = `🎯 **Prioritas Pekerjaan Hari Ini (${todayDateStr}):**\n\n${taskText}\n\nSemangat menyelesaikannya!`;
            } else {
                aiResult.replyMessage = `☕ Tidak ada deadline tugas khusus untuk hari ini (${todayDateStr}). Waktu yang tepat untuk merencanakan tugas baru atau merapikan target!`;
            }
        }

        res.json({ success: true, data: aiResult });
    } catch (error) {
        console.error("AI Assistant Error:", error);
        res.json({ 
            success: true, 
            data: { 
                action: "GENERAL", 
                replyMessage: "Maaf, terjadi kendala saat memproses perintah asisten Anda. Silakan coba ulangi!" 
            } 
        });
    }
};