-- ==========================================
-- 1. MODUL HABITS (Kebiasaan & Streak)
-- ==========================================
CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    frequency TEXT DEFAULT 'daily',
    streak INTEGER DEFAULT 0,
    last_checked_date TEXT, -- Format: 'YYYY-MM-DD' untuk validasi sekali sehari
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Log Harian Kebiasaan (Untuk Heatmap & Riwayat Permanen)
CREATE TABLE IF NOT EXISTS habit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    date TEXT NOT NULL, -- Format: 'YYYY-MM-DD'
    completed INTEGER DEFAULT 1,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE(habit_id, date) -- Memastikan 1 habit hanya tercatat 1 kali dalam 1 tanggal yang sama
);

-- ==========================================
-- 2. MODUL TASKS (Tugas & Prioritas)
-- ==========================================
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    deadline TEXT, -- Format standar 'YYYY-MM-DD'
    priority TEXT DEFAULT 'Medium', -- High, Medium, Low
    status TEXT DEFAULT 'pending', -- pending, completed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. MODUL GOALS (Target Mingguan)
-- ==========================================
CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    target_date TEXT, -- Format standar 'YYYY-MM-DD'
    progress INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. MODUL REFLECTIONS (Refleksi Mingguan)
-- ==========================================
CREATE TABLE IF NOT EXISTS reflections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    success_point TEXT,
    blocker TEXT,
    improvement TEXT,
    ai_analysis TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. MODUL RAG & VECTOR MEMORY (sqlite-vec)
-- ==========================================
-- Menyimpan memori teks dari tasks, goals, atau reflections secara otomatis 
-- di latar belakang untuk pencarian semantik yang hemat token dan super cepat.
CREATE TABLE IF NOT EXISTS vector_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_type TEXT NOT NULL, -- Contoh: 'task', 'goal', 'reflection'
    source_id INTEGER NOT NULL, -- ID relasi ke tabel asalnya
    content TEXT NOT NULL,     -- Teks asli yang diubah menjadi embedding
    embedding TEXT NOT NULL,   -- Menyimpan array float embedding dalam bentuk JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);