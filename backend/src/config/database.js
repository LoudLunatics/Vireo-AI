import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as sqliteVec from 'sqlite-vec'; // <-- Import paket sqlite-vec

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'vireo.db');
const db = new Database(dbPath);

// 1. Muat ekstensi vector search ke dalam instance SQLite
sqliteVec.load(db);

// Mengaktifkan foreign keys & WAL mode
db.pragma('journal_mode = WAL');

// 🛠️ MIGRASI OTOMATIS: Memastikan kolom last_checked_date ada di tabel habits
try {
    db.prepare('ALTER TABLE habits ADD COLUMN last_checked_date TEXT').run();
    console.log("Kolom last_checked_date berhasil ditambahkan secara otomatis ke database.");
} catch (error) {
    // Error diabaikan jika kolom sudah ada
}

// 🛠️ MIGRASI OTOMATIS: Menyesuaikan kolom tabel reflections jika menggunakan struktur lama (content/analysis)
try {
    // Cek apakah tabel reflections memiliki kolom success_point, jika belum buat atau sesuaikan
    db.prepare(`
        CREATE TABLE IF NOT EXISTS reflections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            success_point TEXT,
            blocker TEXT,
            improvement TEXT,
            ai_analysis TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
} catch (error) {
    console.error("Gagal melakukan migrasi tabel reflections:", error);
}

export default db;