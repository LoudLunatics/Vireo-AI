import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle, RefreshCw } from "lucide-react";
import { breakdownGoalAI } from '@/services/api';

export default function GoalBreakdown({ goals }) {
    const [selectedGoal, setSelectedGoal] = useState('');
    const [breakdownResult, setBreakdownResult] = useState('');
    const [loading, setLoading] = useState(false);

    const handleBreakdown = async () => {
        if (!selectedGoal) return;
        setLoading(true);
        try {
            const res = await breakdownGoalAI(selectedGoal);
            // Mengambil hasil breakdown dari respons AI
            setBreakdownResult(res.breakdown || res.plan || "Berhasil memecah target.");
        } catch (error) {
            console.error("Gagal memecah goal:", error);
            alert("Terjadi kesalahan saat menghubungi agen AI.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card/50 rounded-2xl shadow-sm border border-border/60 overflow-hidden relative h-full flex flex-col p-6">
            {/* Efek pendar cahaya latar belakang */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

            <div className="mb-5">
                <h2 className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <Sparkles className="w-4 h-4 text-primary" /> AI Goal Breakdown Agent
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                    Pilih target mingguan untuk dibantu pecah oleh agen AI menjadi langkah mikro.
                </p>
            </div>

            <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Pilih Target untuk Dipecah:</label>
                        <select 
                            className="w-full px-3 py-2 border rounded-xl bg-background/50 text-foreground text-sm border-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 h-10 transition-all cursor-pointer"
                            value={selectedGoal}
                            onChange={(e) => setSelectedGoal(e.target.value)}
                        >
                            <option value="">-- Pilih Target Anda --</option>
                            {/* Menggunakan fallback multi-properti (title/name/goal) agar aman dari perbedaan nama kolom database */}
                            {goals && goals.length > 0 ? (
                                goals.map((g) => {
                                    const goalText = g.title || g.name || g.goal || g.text;
                                    return (
                                        <option key={g.id || goalText} value={goalText}>
                                            {goalText}
                                        </option>
                                    );
                                })
                            ) : (
                                <option value="" disabled>Belum ada target aktif tersedia</option>
                            )}
                        </select>
                    </div>

                    <Button 
                        onClick={handleBreakdown} 
                        disabled={loading || !selectedGoal} 
                        className="w-full rounded-xl font-medium text-xs h-10 cursor-pointer shadow-xs"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Agen AI sedang berpikir...
                            </>
                        ) : (
                            "Pecah Menjadi Langkah Mikro"
                        )}
                    </Button>
                </div>

                {breakdownResult && (
                    <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2 animate-in fade-in-50 duration-300">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-primary" /> Rencana Aksi AI:
                        </h4>
                        <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">{breakdownResult}</p>
                    </div>
                )}
            </div>
        </div>
    );
}