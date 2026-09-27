import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`🚀 Vireo AI Server berjalan di port ${PORT}`);
    console.log(`🔗 Endpoint Utama: http://localhost:${PORT}/api`);
    console.log(`===========================================`);
});