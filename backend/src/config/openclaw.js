import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Inisialisasi Google GenAI khusus dipertahankan untuk layanan embedding
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getGeminiModel = (modelName = 'google/gemini-2.5-flash') => {
    return {
        // 1. Text Generation melalui OpenRouter dengan pembatasan max_tokens yang aman
        async generateContent(prompt) {
            try {
                const textPrompt = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);

                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        "HTTP-Referer": "http://localhost:5173", 
                        "X-Title": "Vireo.ai",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: modelName, 
                        messages: [
                            { role: "user", content: textPrompt }
                        ],
                        max_tokens: 400 // <--- DITAMBAHKAN AGAR TIDAK MELEBIHI KUOTA SALDO/KREDIT AKUN
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`OpenRouter API Error: ${JSON.stringify(errorData)}`);
                }

                const data = await response.json();
                const replyText = data.choices?.[0]?.message?.content || '';

                // Format kembalian disamakan persis agar controller lama tidak perlu diubah
                return {
                    response: {
                        text: () => replyText
                    }
                };
            } catch (error) {
                console.error("OpenRouter API Error:", error);
                throw error;
            }
        },

        // 2. Fungsi Vector Embedding TETAP MENGGUNAKAN Google Gemini (karena kuotanya masih sangat aman)
        async embedContent(payload) {
            try {
                const textToEmbed = typeof payload === 'string' 
                    ? payload 
                    : payload?.content?.parts?.[0]?.text || payload?.contents || '';

                const response = await ai.models.embedContent({
                    model: 'gemini-embedding-001',
                    contents: textToEmbed,
                });

                const embeddingValues = response.embedding?.values || response.embeddings?.[0]?.values || [];

                return {
                    embedding: {
                        values: embeddingValues
                    }
                };
            } catch (error) {
                console.error("Gemini Embedding Error:", error);
                throw error;
            }
        }
    };
};

export const openclawConfig = {
    framework: "OpenClaw Agentic Core",
    version: "1.0.0",
    defaultModel: "mistralai/mistral-7b-instruct:free"
};

export default ai;

//backup
//gemini-3.6-flash

//utama
//gemini-2.5-flash