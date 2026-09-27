import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import db from './config/database.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();

// Middleware Global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inisialisasi Otomatis Tabel SQLite dari schema.sql saat aplikasi pertama kali berjalan
const initDatabase = () => {
    try {
        const schemaPath = path.join(process.cwd(), 'src', 'database', 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            db.exec(schemaSql);
            console.log("✅ Database SQLite berhasil diinisialisasi dari schema.sql");
        }
    } catch (error) {
        console.error("❌ Gagal menginisialisasi skema database:", error.message);
    }
};

initDatabase();

// Routing Utama API
app.use('/api', apiRoutes);

// Endpoint Kesehatan Server (Health Check)
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: "Vireo AI Backend (OpenClaw + Gemini Engine) is running smoothly! 🚀",
        version: "1.0.0"
    });
});

// Middleware Penanganan Error Global
app.use(errorHandler);

export default app;