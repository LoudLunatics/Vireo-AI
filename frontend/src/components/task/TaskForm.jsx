import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, RefreshCw, CalendarDays } from "lucide-react";

export default function TaskForm({ onTaskCreated }) {
    const [title, setTitle] = useState('');
    const [deadline, setDeadline] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        // Format tanggal & jam agar mudah dibaca (Opsional: konversi dari format ISO "YYYY-MM-DDTHH:MM")
        let formattedDeadline = 'Hari Ini';
        if (deadline) {
            const dateObj = new Date(deadline);
            formattedDeadline = dateObj.toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        setLoading(true);
        try {
            await onTaskCreated({ title, deadline: formattedDeadline, priority });
            setTitle('');
            setDeadline('');
            setPriority('Medium');
        } catch (error) {
            console.error("Gagal membuat tugas:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card/50 rounded-2xl shadow-sm border border-border/60 overflow-hidden relative h-full flex flex-col p-6">
            {/* Efek pendar cahaya latar belakang khas Bento */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

            <div className="mb-5">
                <h2 className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <PlusCircle className="w-4 h-4 text-primary" /> Tambah Tugas Baru
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                    Catat tugas harian Anda dan tentukan prioritasnya.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                    {/* Nama Tugas */}
                    <div className="space-y-1.5">
                        <Label htmlFor="taskTitle" className="text-xs font-medium">Nama Tugas</Label>
                        <Input 
                            id="taskTitle"
                            placeholder="Contoh: Implementasi API Frontend" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="rounded-xl bg-background/50 border-border/80 text-sm h-10"
                            required 
                        />
                    </div>

                    {/* Deadline dengan Kalender & Jam Bawaan HTML5 */}
                    <div className="space-y-1.5">
                        <Label htmlFor="deadline" className="text-xs font-medium flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 text-primary" /> Deadline (Tanggal & Jam)
                        </Label>
                        <input 
                            type="datetime-local"
                            id="deadline"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full px-3 py-2 border rounded-xl bg-background/50 text-foreground text-sm border-border/85 focus:outline-none focus:ring-2 focus:ring-primary/20 h-10 transition-all cursor-pointer"
                        />
                    </div>

                    {/* Prioritas */}
                    <div className="space-y-1.5">
                        <Label htmlFor="priority" className="text-xs font-medium">Prioritas</Label>
                        <select 
                            id="priority"
                            className="w-full px-3 py-2 border rounded-xl bg-background/50 text-foreground text-sm border-border/85 focus:outline-none focus:ring-2 focus:ring-primary/20 h-10 transition-all cursor-pointer"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                        >
                            <option value="High">High (Tinggi)</option>
                            <option value="Medium">Medium (Sedang)</option>
                            <option value="Low">Low (Rendah)</option>
                        </select>
                    </div>
                </div>

                <Button type="submit" className="w-full rounded-xl font-medium text-xs h-10 cursor-pointer shadow-xs" disabled={loading}>
                    {loading ? (
                        <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Menyimpan...
                        </>
                    ) : (
                        "Simpan Tugas"
                    )}
                </Button>
            </form>
        </div>
    );
}