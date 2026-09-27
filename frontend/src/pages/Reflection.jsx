import { useState } from 'react';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, RefreshCw, BookOpen, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Cpu } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Reflection() {
    // State untuk masing-masing 3 pertanyaan refleksi
    const [successInput, setSuccessInput] = useState('');
    const [obstacleInput, setObstacleInput] = useState('');
    const [improveInput, setImproveInput] = useState('');

    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [suggestedItem, setSuggestedItem] = useState(null);
    const [itemAdded, setItemAdded] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    const handleAnalyze = async () => {
        if (!successInput.trim() && !obstacleInput.trim() && !improveInput.trim()) return;

        setAnalyzing(true);
        setAiAnalysis(null);
        setSuggestedItem(null);
        setItemAdded(false);

        try {
            const response = await fetch('http://localhost:5000/api/reflections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    successPoint: successInput, 
                    blocker: obstacleInput, 
                    improvement: improveInput 
                })
            });
            const data = await response.json();
            
            if (data.success) {
                setAiAnalysis(data.analysis);
                setSuggestedItem(data.suggestedItem);

                try {
                    confetti({
                        particleCount: 80,
                        spread: 60,
                        origin: { y: 0.6 }
                    });
                } catch (e) {
                    // Abaikan jika confetti gagal dimuat
                }
            } else {
                console.error("Validasi gagal:", data.errors);
                alert(data.message || "Gagal memproses refleksi.");
            }
        } catch (error) {
            console.error("Gagal menganalisis:", error);
            alert("Terjadi kesalahan koneksi ke server AI.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleAddSuggestedAction = async () => {
        if (!suggestedItem) return;

        try {
            const response = await fetch('http://localhost:5000/api/reflections/convert-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    actionText: suggestedItem.text,
                    type: suggestedItem.type
                })
            });
            const data = await response.json();
            if (data.success) {
                setItemAdded(true);
                alert(`Berhasil! ${suggestedItem.type === 'goal' ? 'Goal' : 'Habit'} "${suggestedItem.text}" telah ditambahkan ke sistem Anda.`);
            } else {
                alert("Gagal menambahkan aksi otomatis.");
            }
        } catch (err) {
            console.error("Gagal koneksi:", err);
        }
    };

    return (
        <div className="space-y-3.5 max-w-7xl mx-auto w-full pb-6 px-2 md:px-0">
            
            {/* Header Ringkas */}
            <div className="pb-2 border-b border-border/70">
                <h1 className="text-base font-bold text-foreground tracking-tight flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Weekly Reflection
                </h1>
                <p className="text-[11px] text-muted-foreground">Renungkan minggu ini dan dapatkan insight tajam untuk minggu depan.</p>
            </div>

            {/* Layout Bento Grid Kompak (2 Kolom Seimbang) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                
                {/* Kolom Kiri: Form Pertanyaan Refleksi */}
                <div className="bg-card/40 rounded-2xl shadow-2xs border border-border/60 p-3.5 relative overflow-hidden flex flex-col backdrop-blur-xs">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />

                    <div className="mb-2.5 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                                <BookOpen className="w-3.5 h-3.5 text-primary" /> Pertanyaan Refleksi
                            </h2>
                            <p className="text-[10px] text-muted-foreground">Jawab singkat untuk mendapatkan insight terbaik.</p>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Apa yang paling berhasil minggu ini?
                            </label>
                            <Textarea 
                                placeholder="Contoh: Berhasil menyelesaikan proyek tepat waktu..."
                                className="min-h-[55px] resize-none text-xs rounded-xl bg-background/50 border-border/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs p-2.5"
                                value={successInput}
                                onChange={(e) => setSuccessInput(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-500" /> Apa yang menghambat?
                            </label>
                            <Textarea 
                                placeholder="Contoh: Sering terdistraksi media sosial..."
                                className="min-h-[55px] resize-none text-xs rounded-xl bg-background/50 border-border/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs p-2.5"
                                value={obstacleInput}
                                onChange={(e) => setObstacleInput(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                                <ArrowRight className="w-3 h-3 text-primary" /> Apa yang ingin diperbaiki minggu depan?
                            </label>
                            <Textarea 
                                placeholder="Contoh: Ingin lebih konsisten olahraga..."
                                className="min-h-[55px] resize-none text-xs rounded-xl bg-background/50 border-border/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs p-2.5"
                                value={improveInput}
                                onChange={(e) => setImproveInput(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-border/60">
                        <Button 
                            onClick={handleAnalyze} 
                            disabled={analyzing || (!successInput.trim() && !obstacleInput.trim() && !improveInput.trim())} 
                            className="w-full gap-1.5 rounded-xl text-xs font-semibold h-8 cursor-pointer shadow-2xs transition-all"
                        >
                            {analyzing ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-foreground" /> 
                                    <span>Menganalisis...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-3.5 h-3.5 text-primary-foreground animate-pulse" /> 
                                    <span>Dapatkan Insight AI</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Kolom Kanan: Hasil Analisis AI & Aksi Cerdas */}
                <div className="w-full h-full">
                    <div className="bg-card/40 rounded-2xl shadow-2xs border border-primary/20 p-3.5 relative overflow-hidden bg-gradient-to-br from-primary/5 via-card/40 to-card flex flex-col h-full min-h-[350px] backdrop-blur-xs">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />

                        <div className="mb-2.5 flex items-center justify-between">
                            <div>
                                <h2 className="text-xs font-bold flex items-center gap-1.5 text-primary">
                                    <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Hasil Analisis Agen AI
                                </h2>
                                <p className="text-[10px] text-muted-foreground">Evaluasi dan rekomendasi strategis.</p>
                            </div>
                            {analyzing && (
                                <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 animate-pulse">
                                    <Cpu className="w-3 h-3 animate-spin" /> Processing...
                                </span>
                            )}
                        </div>

                        <div className="flex-1 bg-background/50 p-3.5 rounded-xl border border-primary/20 overflow-y-auto max-h-[310px] shadow-inner flex flex-col justify-between text-xs">
                            {analyzing ? (
                                <div className="h-full flex flex-col items-center justify-center py-10 text-center space-y-2">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-foreground">AI Sedang Menyusun Analisis...</p>
                                        <p className="text-[10px] text-muted-foreground max-w-[200px]">
                                            Mengevaluasi pola performa mingguan Anda.
                                        </p>
                                    </div>
                                </div>
                            ) : !aiAnalysis ? (
                                <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2 text-primary shadow-2xs">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-xs font-semibold text-foreground mb-0.5">Belum ada analisis</h3>
                                    <p className="text-[10px] text-muted-foreground max-w-[220px] leading-relaxed">
                                        Isi form lalu klik <span className="font-semibold text-primary">'Dapatkan Insight AI'</span>.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="prose prose-sm text-foreground/90 whitespace-pre-wrap leading-relaxed animate-in fade-in duration-300">
                                        {aiAnalysis}
                                    </div>

                                    {suggestedItem && (
                                        <div className="p-2.5 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-between gap-2.5 animate-in fade-in duration-300">
                                            <div className="space-y-0.5 min-w-0 flex-1">
                                                <p className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                                                    <span>💡</span> Rekomendasi ({suggestedItem.type === 'goal' ? 'Goal' : 'Habit'})
                                                </p>
                                                <p className="text-xs font-semibold text-foreground truncate">
                                                    Jadikan: <span className="underline italic">"{suggestedItem.text}"</span>
                                                </p>
                                            </div>
                                            <Button 
                                                size="sm"
                                                disabled={itemAdded}
                                                onClick={handleAddSuggestedAction}
                                                className="text-[10px] h-7 px-2.5 rounded-lg shrink-0 cursor-pointer shadow-2xs"
                                            >
                                                {itemAdded ? "✓ Ditambahkan" : `+ Buat ${suggestedItem.type === 'goal' ? 'Goal' : 'Habit'}`}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}