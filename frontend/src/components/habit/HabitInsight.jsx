import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw} from "lucide-react";
import { fetchHabitInsight } from '@/services/api';

export default function HabitInsight() {
    const [insight, setInsight] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGetInsight = async () => {
        setLoading(true);
        try {
            const res = await fetchHabitInsight();
            setInsight(res.insight);
        } catch (error) {
            console.error("Gagal mengambil insight:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card/50 rounded-2xl shadow-sm border border-border/60 overflow-hidden relative h-full flex flex-col p-6">
            {/* Efek pendar cahaya latar belakang */}
            <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <Sparkles className="w-4 h-4 text-primary" /> Habit AI Coach
                </h2>
                <Button 
                    size="sm" 
                    onClick={handleGetInsight} 
                    disabled={loading}
                    className="rounded-xl h-8 px-3 text-xs font-medium cursor-pointer shadow-xs"
                >
                    {loading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        "Dapatkan Insight"
                    )}
                </Button>
            </div>

            <div className="flex-1 flex items-center">
                <p className="text-xs text-muted-foreground leading-relaxed bg-primary/5 p-3.5 rounded-xl border border-primary/10 w-full">
                    {insight || "Klik tombol di atas untuk membiarkan agen AI menganalisis konsistensi dan pola kebiasaan Anda."}
                </p>
            </div>
        </div>
    );
}