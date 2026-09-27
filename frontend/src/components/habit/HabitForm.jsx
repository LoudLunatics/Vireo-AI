import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Repeat } from "lucide-react";

export default function HabitForm({ onHabitCreated }) {
    const [title, setTitle] = useState('');
    const [frequency, setFrequency] = useState('daily');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        try {
            await onHabitCreated({ title, frequency });
            setTitle('');
            setFrequency('daily');
        } catch (error) {
            console.error("Gagal membuat habit:", error);
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
                    <Repeat className="w-4 h-4 text-primary" /> Tambah Kebiasaan Baru
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                    Bangun konsistensi harian dengan melacak rutinitas positif Anda.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="habitTitle" className="text-xs font-medium">Nama Kebiasaan</Label>
                        <Input 
                            id="habitTitle"
                            placeholder="Contoh: Membaca Buku 20 Menit" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="rounded-xl bg-background/50 border-border/80 text-sm h-10"
                            required 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="frequency" className="text-xs font-medium">Frekuensi</Label>
                        <select 
                            id="frequency"
                            className="w-full px-3 py-2 border rounded-xl bg-background/50 text-foreground text-sm border-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 h-10 transition-all"
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                        >
                            <option value="daily">Setiap Hari (Daily)</option>
                            <option value="weekly">Mingguan (Weekly)</option>
                        </select>
                    </div>
                </div>

                <Button type="submit" className="w-full rounded-xl font-medium text-xs h-10 cursor-pointer shadow-xs" disabled={loading}>
                    {loading ? (
                        <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Menyimpan...
                        </>
                    ) : (
                        "Tambah Kebiasaan"
                    )}
                </Button>
            </form>
        </div>
    );
}