import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/common/EmptyState";
import { CheckCircle2, Circle, Flame, Trash2, Repeat } from "lucide-react";

export default function HabitList({ habits, onRefresh, onRequestDelete }) {

    // Helper untuk mendapakan format 'YYYY-MM-DD' murni berdasarkan zona waktu lokal perangkat (WIB, dll)
    const getLocalISODate = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Fungsi untuk menandai habit selesai sekali sehari
    const handleToggleHabit = async (habitId, isAlreadyChecked) => {
        if (isAlreadyChecked) return;

        try {
            const response = await fetch(`http://localhost:5000/api/habits/${habitId}/toggle`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'increment' })
            });
            const data = await response.json();
            
            if (data.success && onRefresh) {
                onRefresh(); 
            } else if (!data.success) {
                alert(data.message);
            }
        } catch (error) {
            console.error("Gagal memperbarui status habit:", error);
        }
    };

    // Fungsi untuk menghapus habit menggunakan modal konfirmasi kustom
    const handleDeleteHabit = (habit, e) => {
        e.stopPropagation();
        if (onRequestDelete) {
            onRequestDelete(habit.id, habit.title);
        }
    };

    // Mendapatkan tanggal hari ini menggunakan waktu lokal perangkat yang akurat
    const today = getLocalISODate();

    return (
        <div className="space-y-6">
            {/* Kartu Daftar Kebiasaan Aktif */}
            <div className="bg-card/50 rounded-2xl shadow-sm border border-border/60 overflow-hidden relative p-6 h-full flex flex-col">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="mb-4">
                    <h2 className="text-base font-semibold flex items-center gap-2 text-foreground">
                        <Repeat className="w-4 h-4 text-emerald-500" /> Daftar Kebiasaan Aktif
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                        Centang rutinitas harian Anda untuk membangun konsistensi dan menjaga streak.
                    </p>
                </div>

                <div className="flex-1">
                    {!habits || habits.length === 0 ? (
                        <div className="py-6">
                            <EmptyState 
                                title="Belum ada kebiasaan" 
                                description="Tambahkan kebiasaan harian Anda untuk mulai membangun konsistensi." 
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {habits.map((habit) => {
                                const isCompletedToday = habit.last_checked_date === today;

                                return (
                                    <div 
                                        key={habit.id} 
                                        className="flex items-center justify-between p-3.5 border border-border/70 rounded-xl bg-card hover:border-border transition-all shadow-2xs group"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <button 
                                                onClick={() => handleToggleHabit(habit.id, isCompletedToday)}
                                                disabled={isCompletedToday}
                                                className={`transition-colors focus:outline-none ${isCompletedToday ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer text-muted-foreground hover:text-primary'}`}
                                                title={isCompletedToday ? "Sudah diselesaikan hari ini" : "Tandai selesai"}
                                            >
                                                {isCompletedToday ? (
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                                                ) : (
                                                    <Circle className="w-5 h-5 text-muted-foreground/60 hover:text-primary" />
                                                )}
                                            </button>

                                            <div className="space-y-0.5">
                                                <p className={`text-sm font-medium transition-colors ${isCompletedToday ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                    {habit.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground capitalize">Frekuensi: {habit.frequency}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="flex items-center gap-1 bg-orange-500/10 text-orange-600 border border-orange-500/20 font-semibold text-xs py-1 px-2.5">
                                                <Flame className="w-3.5 h-3.5 text-orange-500" /> {habit.streak || 0} Streak
                                            </Badge>
                                            
                                            <button 
                                                onClick={(e) => handleDeleteHabit(habit, e)}
                                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                                title="Hapus Habit"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}