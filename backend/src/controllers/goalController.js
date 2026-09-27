import db from '../config/database.js';
import { getGeminiModel } from '../config/openclaw.js';
import { createAndStoreEmbedding } from '../services/vectorService.js';

export const getGoals = (req, res, next) => {
    try {
        const goals = db.prepare('SELECT * FROM goals ORDER BY id DESC').all();
        res.json({ success: true, data: goals });
    } catch (error) {
        next(error);
    }
};

export const createGoal = async (req, res, next) => {
    try {
        const { title, target_date } = req.body;
        if (!title) {
            return res.status(400).json({ success: false, message: "Judul goal tidak boleh kosong." });
        }

        const stmt = db.prepare('INSERT INTO goals (title, target_date, progress) VALUES (?, ?, ?)');
        const info = stmt.run(title, target_date || 'Mingguan', 0);
        const goalId = info.lastInsertRowid;

        // [ZERO-CLICK INGESTION]: Otomatis rekam target ke vector memory / sqlite-vec
        await createAndStoreEmbedding('goal', goalId, `Target: ${title} (Kategori: ${target_date || 'Mingguan'})`);

        res.json({ success: true, id: goalId });
    } catch (error) {
        next(error);
    }
};

export const updateGoalProgress = (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, progress } = req.body;

        const stmt = db.prepare(`
            UPDATE goals 
            SET title = COALESCE(?, title), 
                progress = COALESCE(?, progress) 
            WHERE id = ?
        `);
        const info = stmt.run(title || null, progress !== undefined ? progress : null, id);

        if (info.changes === 0) {
            return res.status(404).json({ success: false, message: 'Goal tidak ditemukan' });
        }

        res.json({ success: true, message: 'Goal berhasil diperbarui' });
    } catch (error) {
        next(error);
    }
};

export const deleteGoal = (req, res, next) => {
    try {
        const { id } = req.params;
        const stmt = db.prepare('DELETE FROM goals WHERE id = ?');
        const info = stmt.run(id);

        if (info.changes === 0) {
            return res.status(404).json({ success: false, message: 'Goal tidak ditemukan' });
        }

        res.json({ success: true, message: 'Goal berhasil dihapus' });
    } catch (error) {
        next(error);
    }
};

// FITUR AI ADAPTIF: Mengambil histori dari SQLite dan memproses roadmap secara kontekstual
export const breakdownGoal = async (req, res, next) => {
    const goalTitle = req.body.goalTitle || req.body.goal;
    const targetDate = req.body.targetDate || req.body.target_date || 'Mingguan';

    try {
        if (!goalTitle) {
            return res.status(400).json({ success: false, message: "Judul goal tidak boleh kosong." });
        }

        // Ambil histori dari database SQLite secara dinamis untuk konteks adaptif
        let historicalContext = "Belum ada histori target sebelumnya.";
        try {
            const pastGoals = db.prepare('SELECT title, progress, target_date FROM goals ORDER BY id DESC LIMIT 5').all();
            if (pastGoals && pastGoals.length > 0) {
                historicalContext = pastGoals.map(g => `- Target: "${g.title}" (Status: ${g.progress}%, Durasi: ${g.target_date})`).join('\n');
            }
        } catch (dbErr) {
            console.error("Gagal memuat histori database:", dbErr);
        }

        const model = getGeminiModel();
        const isAdvancedCycle = /siklus\s*\d+|fase\s*\d+|berikutnya/i.test(goalTitle);

        let timeframeInstruction = "Buatkan tepat 7 langkah mikro harian yang praktis.";
        let formatExample = `
            {
              "steps": [
                "Hari 1: [Aksi spesifik] - Sumber: [Referensi]",
                "Hari 2: [Aksi spesifik] - Sumber: [Referensi]",
                "Hari 3: [Aksi spesifik] - Sumber: [Referensi]",
                "Hari 4: [Aksi spesifik] - Sumber: [Referensi]",
                "Hari 5: [Aksi spesifik] - Sumber: [Referensi]",
                "Hari 6: [Aksi spesifik] - Sumber: [Referensi]",
                "Hari 7: [Aksi spesifik] - Sumber: [Referensi]"
              ]
            }
        `;

        const lowerDate = targetDate.toLowerCase();
        if (lowerDate.includes('bulan') || lowerDate.includes('monthly')) {
            timeframeInstruction = isAdvancedCycle 
                ? "Karena ini SIKLUS LANJUTAN BULANAN, buatkan tepat 4 milestone mingguan tingkat lanjut yang relevan dengan topik target."
                : "Karena ini target BULANAN, buatkan tepat 4 milestone mingguan (Minggu 1 sampai Minggu 4).";
            formatExample = `
                {
                  "steps": [
                    "Minggu 1: [Fokus milestone] - Sumber: [Referensi]",
                    "Minggu 2: [Fokus milestone] - Sumber: [Referensi]",
                    "Minggu 3: [Fokus milestone] - Sumber: [Referensi]",
                    "Minggu 4: [Fokus milestone] - Sumber: [Referensi]"
                  ]
                }
            `;
        }

        const prompt = `
            Bertindaklah sebagai AI Productivity Coach dan Life Strategist kelas dunia yang sangat cerdas secara kontekstual.
            Target Aktif Saat Ini: "${goalTitle}"
            Durasi/Kategori Waktu: "${targetDate}"
            
            HISTORI TARGET DARI DATABASE:
            ${historicalContext}
            
            INSTRUKSI UTAMA (SANGAT PENTING):
            1. Sesuaikan 100% langkah mikro dengan domain target (Jika target tentang menabung, keuangan, atau membeli sesuatu, gunakan istilah finansial seperti alokasi dana, pemotongan pengeluaran, evaluasi tabungan. JANGAN gunakan istilah pemrograman/teknis seperti 'debug', 'coding', atau 'kendala teknis').
            2. Jika ini siklus lanjutan, tingkatkan fokus ke level strategi yang lebih mendalam berdasarkan histori.
            3. Di akhir setiap kalimat langkah, wajib sertakan rekomendasi referensi nyata (format: "- Sumber: [Nama Referensi / URL]").
            4. PENTING: Jangan gunakan tanda kutip ganda (") di dalam nilai string teks JSON agar tidak terjadi error parsing.

            Berikan respons HANYA dalam format JSON murni dengan struktur:
            ${formatExample}
        `;
        
        const response = await model.generateContent(prompt);
        const textResponse = response.response.text().trim();
        
        // Ekstraksi blok JSON secara aman untuk menghindari Unterminated string error
        let cleanJson = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        const firstBrace = cleanJson.indexOf('{');
        const lastBrace = cleanJson.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        }

        const parsed = JSON.parse(cleanJson);

        if (parsed.steps && Array.isArray(parsed.steps)) {
            return res.json({ 
                success: true, 
                steps: parsed.steps, 
                breakdown: parsed.steps.join('\n') 
            });
        }

        throw new Error("Format steps dari AI tidak valid");
    } catch (error) {
        console.error("Error breakdown goal:", error);
        
        const safeTitle = goalTitle || 'target Anda';
        const lowerTitle = safeTitle.toLowerCase();

        // Fallback cerdas berdasarkan kata kunci agar selalu nyambung dengan domain target
        let dynamicFallback = [];

        if (lowerTitle.includes('tabung') || lowerTitle.includes('uang') || lowerTitle.includes('beli') || lowerTitle.includes('mobil') || lowerTitle.includes('juta')) {
            dynamicFallback = [
                `Hari 1: Evaluasi kondisi keuangan saat ini dan hitung sisa kekurangan dana untuk ${safeTitle} - Sumber: Aplikasi Keuangan Pribadi`,
                `Hari 2: Pangkas pengeluaran non-esensial dan alokasikan persentase khusus - Sumber: Buku Budgeting Plan`,
                `Hari 3: Setor komitmen tabungan harian atau mingguan ke rekening terpisah - Sumber: Mobile Banking`,
                `Hari 4: Cari sumber pemasukan tambahan atau optimalkan aset yang ada - Sumber: Side Hustle Guide`,
                `Hari 5: Monitor konsistensi menabung dan tinjau ulang target bulanan - Sumber: Financial Dashboard`,
                `Hari 6: Lakukan simulasi perhitungan akumulasi dana hingga batas deadline - Sumber: Kalkulator Finansial`,
                `Hari 7: Review pencapaian minggu ini dan pertahankan kedisiplinan menabung - Sumber: Evaluasi Keuangan Bulanan`
            ];
        } else {
            dynamicFallback = [
                `Hari 1: Evaluasi pencapaian sebelumnya dan tentukan langkah strategis untuk ${safeTitle} - Sumber: Panduan Perencanaan`,
                `Hari 2: Riset metode atau langkah praktis terbaik yang relevan - Sumber: Best Practices`,
                `Hari 3: Eksekusi tindakan inti pertama tanpa menunda - Sumber: Action Plan`,
                `Hari 4: Evaluasi kendala atau hambatan yang muncul di tengah jalan - Sumber: Self Review`,
                `Hari 5: Tingkatkan konsistensi dan fokus pada target utama - Sumber: Habit Tracker`,
                `Hari 6: Lakukan penyesuaian atau simulasi kemajuan mandiri - Sumber: Studi Kasus`,
                `Hari 7: Review hasil siklus ini dan siapkan kelanjutan target berikutnya - Sumber: Summary Report`
            ];
        }

        res.json({ 
            success: true, 
            steps: dynamicFallback, 
            breakdown: dynamicFallback.join('\n') 
        });
    }
};