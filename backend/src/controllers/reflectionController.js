import db from '../config/database.js';
import { getGeminiModel } from '../config/openclaw.js';

// 1. Mengambil semua riwayat refleksi
export const getReflections = (req, res, next) => {
    try {
        const reflections = db.prepare('SELECT * FROM reflections ORDER BY id DESC').all();
        res.json({ success: true, data: reflections });
    } catch (error) {
        next(error);
    }
};

// 2. Membuat refleksi baru & mendapatkan analisis serta deteksi aksi AI secara efisien
export const createReflection = async (req, res, next) => {
    try {
        const { successPoint, blocker, improvement } = req.body;
        
        let analysisText = "- Evaluasi rutin mingguan dicatat dengan baik.\n- Pertahankan momentum positif untuk minggu depan.";
        let suggestedItem = null; // Menyimpan objek { text, type } (type bisa 'habit' atau 'goal')

        try {
            const model = getGeminiModel();

            // Prompt diperbarui agar AI menentukan apakah saran ini masuk ke 'habit' atau 'goal'
            const prompt = `Analisis refleksi mingguan berikut:
- Sukses: "${successPoint || '-'}"
- Hambatan: "${blocker || '-'}"
- Perbaikan: "${improvement || '-'}"

Berikan balasan HANYA dalam format JSON murni tanpa markdown (\`\`\`json) dengan struktur:
{
  "analysis": "- Analisis 1\\n- Analisis 2",
  "suggestedItem": {
    "text": "Judul singkat aksi perbaikan",
    "type": "habit" 
  }
}
Catatan untuk type: pilih "habit" jika berupa rutinitas harian/mingguan yang berulang, atau "goal" jika berupa target pencapaian/proyek akhir.`;

            const aiResponse = await model.generateContent({
                contents: prompt,
                generationConfig: { 
                    maxOutputTokens: 250, 
                    temperature: 0.7 
                }
            });

            const rawText = aiResponse.response.text();
            const cleanedJsonText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
            
            const parsedResult = JSON.parse(cleanedJsonText);
            if (parsedResult.analysis) analysisText = parsedResult.analysis;
            if (parsedResult.suggestedItem) suggestedItem = parsedResult.suggestedItem;

        } catch (aiError) {
            console.warn("⚠️ Gagal memuat analisis AI Reflection (Rate Limit / Kuota Habis), menggunakan fallback lokal.");
            analysisText = `- Evaluasi hambatan: ${blocker || 'Tidak ada hambatan khusus'}.\n- Fokus perbaikan: ${improvement || 'Tingkatkan konsistensi'}.`;
            suggestedItem = improvement ? { text: `Review ${improvement}`, type: 'habit' } : null;
        }

        // Menyimpan riwayat refleksi ke database SQLite lokal
        const stmt = db.prepare(`
            INSERT INTO reflections (success_point, blocker, improvement, ai_analysis, created_at) 
            VALUES (?, ?, ?, ?, datetime('now'))
        `);
        
        const info = stmt.run(
            successPoint || '', 
            blocker || '', 
            improvement || '', 
            analysisText
        );

        res.json({ 
            success: true, 
            id: info.lastInsertRowid, 
            analysis: analysisText,
            suggestedItem: suggestedItem // Mengirim objek terstruktur ke frontend
        });

    } catch (error) {
        next(error);
    }
};

// 3. Konversi otomatis rekomendasi AI menjadi Habit atau Goal baru di SQLite
export const convertSuggestedAction = async (req, res, next) => {
    try {
        const { actionText, type } = req.body; // type menerima 'habit' atau 'goal'

        if (!actionText) {
            return res.status(400).json({ success: false, message: "Teks aksi tidak boleh kosong." });
        }

        let insertedId = null;
        let targetTable = '';

        if (type === 'goal') {
            targetTable = 'goals';
            const stmt = db.prepare('INSERT INTO goals (title, status) VALUES (?, ?)');
            const info = stmt.run(actionText, 'active');
            insertedId = info.lastInsertRowid;
        } else {
            // [DIperbaiki] Menggunakan kolom 'title' alih-alih 'name' agar sesuai dengan struktur tabel habits
            targetTable = 'habits';
            const stmt = db.prepare('INSERT INTO habits (title, streak) VALUES (?, 0)');
            const info = stmt.run(actionText);
            insertedId = info.lastInsertRowid;
        }

        res.json({
            success: true,
            message: `Berhasil menambahkan "${actionText}" ke daftar ${type ? type.toUpperCase() : 'HABIT'} Anda!`,
            itemId: insertedId,
            type: type || 'habit'
        });

    } catch (error) {
        console.error("Gagal konversi aksi otomatis:", error);
        next(error);
    }
};