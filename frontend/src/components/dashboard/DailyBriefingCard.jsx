import { Sparkles } from "lucide-react";
import { useMemo } from "react";

export default function DailyBriefingCard({ briefing }) {
    // 1. Deteksi waktu lokal secara presisi
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 3 && hour < 11) return "Selamat Pagi";
        if (hour >= 11 && hour < 15) return "Selamat Siang";
        if (hour >= 15 && hour < 18) return "Selamat Sore";
        return "Selamat Malam";
    };

    const greeting = getGreeting();

    // 2. Menggunakan useMemo untuk menyaring placeholder kaku & meracik kalimat stabil
    const finalSentence = useMemo(() => {
        // Cek apakah teks dari backend masih mengandung placeholder kaku [...] atau kosong
        const hasPlaceholder = briefing && (briefing.includes("[Tugas") || briefing.includes("[Task") || briefing.includes("["));
        const isCleanBriefing = briefing && !hasPlaceholder;

        const cleanBriefing = isCleanBriefing 
            ? briefing.replace(/^(halo[!,\s]*)?(selamat\s+(pagi|siang|sore|malam)[!,\s]*)*/i, "").trim()
            : "";

        const templates = [
            (g, text) => `${g}! ${text}`,
            (g, text) => `Halo! ${g}, ${text.charAt(0).toLowerCase() + text.slice(1)}`,
            (g, text) => `${g} pejuang kode! ${text}`,
            (g, text) => `Semangat ya! ${g}, ${text.charAt(0).toLowerCase() + text.slice(1)}`,
            (g, text) => `Fokus hari ini: ${text}`
        ];

        // Jika kosong atau terdeteksi placeholder kaku, gunakan kalimat suportif untuk kondisi kosong
        const fallbackText = "Jadwal tugasmu sedang bersih hari ini. Waktu yang sangat tepat untuk merencanakan target baru atau menikmati hari dengan santai!";
        const activeText = cleanBriefing || fallbackText;
        
        const templateIndex = Math.floor(Math.random() * templates.length);
        return templates[templateIndex](greeting, activeText);
    }, [briefing]);

    return (
        <div className="bg-card/50 rounded-2xl shadow-sm border border-primary/20 overflow-hidden relative p-4 md:p-6 bg-gradient-to-br from-primary/5 via-card/50 to-card">
            {/* Efek pendar cahaya latar belakang */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-foreground tracking-tight">
                        Vireo AI Daily Briefing
                    </h2>
                    <p className="text-xs text-muted-foreground">Ringkasan dan arahan fokus harian Anda</p>
                </div>
            </div>

            <div className="mt-2">
                <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-medium italic bg-primary/5 p-4 rounded-xl border border-primary/10">
                    "{finalSentence}"
                </p>
            </div>
        </div>
    );
}