import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmptyState from "../common/EmptyState";
import { CheckSquare, Trash2, AlertCircle, CheckCircle2, Circle, Clock } from "lucide-react";

export default function TaskList({ tasks, onRefresh, statusFilter = 'all', onRequestDelete }) {
    
    // Fungsi untuk memicu modal konfirmasi kustom di level parent (Tasks.jsx)
    const handleDeleteTask = (task, e) => {
        e.stopPropagation();
        if (onRequestDelete) {
            onRequestDelete(task.id, task.title);
        }
    };

    // Fungsi untuk mengubah status selesai/pending
    const handleToggleTask = async (taskId, currentStatus) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

        try {
            const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await response.json();
            if (data.success && onRefresh) {
                onRefresh();
            }
        } catch (error) {
            console.error("Gagal memperbarui status tugas:", error);
        }
    };

    // Fungsi deteksi deadline telat menggunakan standar YYYY-MM-DD
    const checkIfOverdue = (deadlineStr, status) => {
        if (status === 'completed' || !deadlineStr) return false;
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            return deadlineStr < todayStr;
        } catch (e) {
            return false;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'bg-destructive/10 text-destructive border-destructive/20';
            case 'Medium': return 'bg-primary/10 text-primary border-primary/20';
            default: return 'bg-secondary text-secondary-foreground border-secondary/20';
        }
    };

    // Kelompokkan tugas berdasarkan status dan kondisi (Aktif, Telat, Selesai)
    const activeTasks = (tasks || []).filter(task => task.status !== 'completed' && !checkIfOverdue(task.deadline, task.status));
    const overdueTasks = (tasks || []).filter(task => task.status !== 'completed' && checkIfOverdue(task.deadline, task.status));
    const completedTasks = (tasks || []).filter(task => task.status === 'completed');

    // Komponen kecil untuk merender baris tugas agar kodenya rapi
    const renderTaskItem = (task, isOverdueFlag = false) => {
        const isCompleted = task.status === 'completed';

        return (
            <div 
                key={task.id} 
                className={`flex items-center justify-between p-3.5 border rounded-xl bg-card transition-all shadow-2xs group ${
                    isOverdueFlag ? 'border-destructive/50 bg-destructive/5 shadow-destructive/5' : 'border-border/70 hover:border-border hover:shadow-sm'
                }`}
            >
                <div className="flex items-center space-x-3 min-w-0 flex-1 mr-3">
                    <button 
                        onClick={() => handleToggleTask(task.id, task.status)}
                        className="text-muted-foreground hover:text-primary transition-colors focus:outline-none cursor-pointer shrink-0"
                        title={isCompleted ? "Batalkan selesai" : "Tandai selesai"}
                    >
                        {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                        ) : (
                            <Circle className="w-5 h-5 text-muted-foreground/60 hover:text-primary" />
                        )}
                    </button>

                    <div className="space-y-1 min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${
                            isCompleted ? 'line-through text-muted-foreground' : 
                            isOverdueFlag ? 'text-destructive font-semibold' : 'text-foreground'
                        }`}>
                            {task.title}
                        </p>

                        <div className="flex items-center gap-2 text-xs">
                            <span className={`${isOverdueFlag ? 'text-destructive font-medium flex items-center gap-1' : 'text-muted-foreground'}`}>
                                {isOverdueFlag && <AlertCircle className="w-3 h-3 inline shrink-0" />}
                                Deadline: {task.deadline || 'Hari Ini'}
                            </span>
                            {isOverdueFlag && (
                                <span className="text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                    Telat
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    <Badge variant="outline" className={`font-semibold text-xs px-2.5 py-0.5 ${getPriorityColor(task.priority)}`}>
                        {task.priority || 'Medium'}
                    </Badge>

                    <button
                        onClick={(e) => handleDeleteTask(task, e)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer border border-border/40 hover:border-destructive/30"
                        title="Hapus Tugas"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    // Tentukan pesan kosong (Empty State) secara dinamis berdasarkan filter yang aktif
    let emptyTitle = "Belum ada tugas";
    let emptyDesc = "Tambahkan tugas baru melalui asisten AI atau formulir untuk mulai mengelola pekerjaan Anda.";

    if (statusFilter === 'telat') {
        emptyTitle = "Belum ada tugas yang telat";
        emptyDesc = "Kerja bagus! Tidak ada tugas yang melewati batas waktu saat ini.";
    } else if (statusFilter === 'completed') {
        emptyTitle = "Belum ada tugas yang selesai";
        emptyDesc = "Selesaikan beberapa tugasmu untuk melihatnya tercatat di sini.";
    } else if (statusFilter === 'pending') {
        emptyTitle = "Belum ada tugas pending";
        emptyDesc = "Semua tugas pending Anda sudah bersih.";
    }

    return (
        <Card className="bg-card/50 rounded-2xl shadow-sm border border-border/60 overflow-hidden relative p-2">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <CheckSquare className="w-4 h-4 text-primary" /> Manajemen Tugas & Status
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Daftar tugas yang dikelompokkan otomatis berdasarkan status (Aktif, Telat, dan Selesai).
                </p>
            </CardHeader>

            <CardContent className="pt-0 space-y-6">
                {!tasks || tasks.length === 0 ? (
                    <div className="py-6">
                        <EmptyState 
                            title={emptyTitle} 
                            description={emptyDesc} 
                        />
                    </div>
                ) : (
                    <>
                        {/* TABEL 1: Tugas Telat / Overdue (Prioritas Perhatian Tertinggi) */}
                        {overdueTasks.length > 0 && (
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-destructive uppercase tracking-wider px-1">
                                    <AlertCircle className="w-3.5 h-3.5" /> Tugas Terlewat ({overdueTasks.length})
                                </div>
                                <div className="space-y-2">
                                    {overdueTasks.map(task => renderTaskItem(task, true))}
                                </div>
                            </div>
                        )}

                        {/* TABEL 2: Tugas Aktif / Pending */}
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider px-1">
                                <Clock className="w-3.5 h-3.5 text-primary" /> Tugas Aktif ({activeTasks.length})
                            </div>
                            {activeTasks.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic px-1">Tidak ada tugas aktif saat ini.</p>
                            ) : (
                                <div className="space-y-2">
                                    {activeTasks.map(task => renderTaskItem(task, false))}
                                </div>
                            )}
                        </div>

                        {/* TABEL 3: Tugas Selesai (Completed) */}
                        {completedTasks.length > 0 && (
                            <div className="space-y-2.5 pt-2 border-t border-border/50">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 uppercase tracking-wider px-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Selesai ({completedTasks.length})
                                </div>
                                <div className="space-y-2 opacity-85">
                                    {completedTasks.map(task => renderTaskItem(task, false))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}