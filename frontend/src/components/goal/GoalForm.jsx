import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, RefreshCw, CalendarDays, Sparkles, Clock } from "lucide-react";

export default function GoalForm({ onGoalCreated }) {
    const [title, setTitle] = useState('');
    const [timeframe, setTimeframe] = useState('Mingguan');
    const [customDate, setCustomDate] = useState('');
    const [loading, setLoading] = useState(false);

    // Helper untuk memformat tanggal menjadi teks yang mudah dibaca (Human Readable)
    const formatDateHuman = (dateObj) => {
        if (!dateObj || isNaN(dateObj.getTime())) return '-';
        return dateObj.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Kalkulasi dinamis berdasarkan pilihan dropdown
    const getCalculatedDeadline = () => {
        const today = new Date();
        
        if (timeframe === 'Mingguan') {
            today.setDate(today.getDate() + 7);
            return formatDateHuman(today);
        }
        if (timeframe === 'Bulanan') {
            today.setMonth(today.getMonth() + 1);
            return formatDateHuman(today);
        }
        if (timeframe === 'Tahunan') {
            today.setFullYear(today.getFullYear() + 1);
            return formatDateHuman(today);
        }
        if (timeframe === 'Custom') {
            if (!customDate) return 'Pilih tanggal di bawah';
            const customObj = new Date(customDate);
            return formatDateHuman(customObj);
        }
        return '-';
    };

    const deadlineStr = getCalculatedDeadline();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        if (timeframe === 'Custom' && !customDate) return;

        setLoading(true);
        try {
            // Gabungkan rentang waktu dan tanggal pasti agar AI mengerti konteksnya
            const finalTargetDate = timeframe === 'Custom' 
                ? `Custom (${deadlineStr})` 
                : `${timeframe} (${deadlineStr})`;

            await onGoalCreated({ 
                title, 
                target_date: finalTargetDate, 
                progress: 0 
            });
            
            setTitle('');
            setTimeframe('Mingguan');
            setCustomDate('');
        } catch (error) {
            console.error("Gagal membuat target:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
                {/* Input Judul Target */}
                <div className="space-y-1.5">
                    <Label htmlFor="goalTitle" className="text-xs font-medium">Judul Target</Label>
                    <Input 
                        id="goalTitle"
                        placeholder="Contoh: Turun 15kg, Selesaikan integrasi database..." 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="rounded-xl bg-background/50 border-border/80 text-sm h-10"
                        required 
                    />
                </div>

                {/* Dropdown Rentang Waktu */}
                <div className="space-y-1.5">
                    <Label htmlFor="timeframe" className="text-xs font-medium flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary" /> Rentang Waktu
                        </span>
                    </Label>
                    
                    <select
                        id="timeframe"
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-background/50 text-foreground text-sm border-border/85 focus:outline-none focus:ring-2 focus:ring-primary/20 h-10 transition-all cursor-pointer appearance-none"
                    >
                        <option value="Mingguan">🎯 Mingguan (7 Hari)</option>
                        <option value="Bulanan">📅 Bulanan (1 Bulan)</option>
                        <option value="Tahunan">🚀 Tahunan (1 Tahun)</option>
                        <option value="Custom">⚙️ Custom (Pilih Sendiri)</option>
                    </select>
                </div>

                {/* Input Tanggal Khusus (Hanya muncul jika opsi "Custom" dipilih) */}
                {timeframe === 'Custom' && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Label htmlFor="customDate" className="text-xs font-medium flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 text-primary" /> Pilih Tanggal Deadline
                        </Label>
                        <input 
                            type="date"
                            id="customDate"
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]} // Mencegah pilih tanggal di masa lalu
                            className="w-full px-3 py-2 border rounded-xl bg-background/50 text-foreground text-sm border-border/85 focus:outline-none focus:ring-2 focus:ring-primary/20 h-10 transition-all cursor-pointer"
                            required
                        />
                    </div>
                )}

                {/* Kotak Penjelasan Tanggal Terakhir / Deadline Otomatis */}
                <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1 mt-2">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Batas Waktu Otomatis:
                        </p>
                        <span className="text-[10px] text-primary flex items-center gap-1 bg-primary/10 px-1.5 py-0.5 rounded-md font-medium">
                            <Sparkles className="w-2.5 h-2.5" /> 7-Day Kickstart AI
                        </span>
                    </div>
                    <p className="text-xs font-bold text-primary pl-3.5">
                        {deadlineStr}
                    </p>
                </div>
            </div>

            <Button type="submit" className="w-full rounded-xl font-medium text-xs h-10 cursor-pointer shadow-xs" disabled={loading}>
                {loading ? (
                    <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Menyimpan Target...
                    </>
                ) : (
                    "Simpan Target"
                )}
            </Button>
        </form>
    );
}