import { Sparkles, BrainCircuit } from "lucide-react";
import EmptyState from "../common/EmptyState";

export default function PriorityResult({ analysis }) {
    // Fungsi untuk mem-parsing data JSON dari AI dengan aman
    const renderParsedAnalysis = () => {
        if (!analysis) return null;

        try {
            // Bersihkan format markdown block jika ada dari response AI
            const cleaned = analysis.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(cleaned);
            const list = Array.isArray(parsedData) ? parsedData : [parsedData];

            return (
                <div className="space-y-3">
                    {list.map((item, index) => (
                        <div key={index} className="space-y-1.5 p-3 rounded-lg bg-card/80 border border-border/80 shadow-2xs">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                    {item.title || "Tugas Utama"}
                                </span>
                                {item.deadline && (
                                    <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md font-medium">
                                        Deadline: {item.deadline}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-foreground/90 leading-relaxed">
                                {item.reason || item.analysis || "Segera kerjakan tugas ini sesuai prioritas."}
                            </p>
                        </div>
                    ))}
                </div>
            );
        } catch (e) {
            // Fallback jika ternyata formatnya bukan JSON (teks biasa)
            return (
                <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
                    {analysis}
                </p>
            );
        }
    };

    return (
        <div className="bg-card/50 rounded-2xl shadow-sm border border-border/60 overflow-hidden relative h-full flex flex-col p-6">
            {/* Efek pendar cahaya latar belakang */}
            <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

            <div className="mb-4">
                <h2 className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <Sparkles className="w-4 h-4 text-primary" /> AI Smart Task Prioritizer
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                    Analisis cerdas untuk menentukan urutan eksekusi tugas harian Anda.
                </p>
            </div>

            <div className="flex-1 flex flex-col justify-center">
                {!analysis ? (
                    <div className="py-4">
                        <EmptyState 
                            title="Belum ada analisis" 
                            description="Klik tombol 'Prioritaskan dengan AI' di atas untuk menyusun urutan eksekusi terbaik." 
                        />
                    </div>
                ) : (
                    <div className="space-y-2.5 p-4 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in-50 duration-300">
                        <div className="flex items-center space-x-1.5 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                            <BrainCircuit className="w-4 h-4 text-primary" /> Rekomendasi Urutan Eksekusi
                        </div>
                        
                        {/* Menampilkan hasil parsing yang bersih */}
                        {renderParsedAnalysis()}
                    </div>
                )}
            </div>
        </div>
    );
}