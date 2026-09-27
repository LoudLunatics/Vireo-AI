import { Badge } from "@/components/ui/badge";
import EmptyState from "../common/EmptyState";
import { CheckSquare } from "lucide-react";

export default function TodayList({ tasks }) {
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'bg-destructive/10 text-destructive border-destructive/20';
            case 'Medium': return 'bg-primary/10 text-primary border-primary/20';
            default: return 'bg-secondary text-secondary-foreground border-secondary/20';
        }
    };

    return (
        <div className="bg-card/50 rounded-2xl shadow-sm border border-border/60 overflow-hidden relative p-6">
            {/* Efek pendar cahaya latar belakang khas Bento */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

            <div className="mb-4">
                <h2 className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <CheckSquare className="w-4 h-4 text-primary" /> Tugas Prioritas Hari Ini
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                    Daftar pekerjaan mendesak yang perlu segera Anda selesaikan.
                </p>
            </div>

            <div>
                {!tasks || tasks.length === 0 ? (
                    <div className="py-6">
                        <EmptyState 
                            title="Tidak ada tugas mendesak" 
                            description="Semua tugas prioritas Anda telah selesai!" 
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <div 
                                key={task.id} 
                                className="flex items-center justify-between p-3.5 border border-border/70 rounded-xl bg-card hover:border-border transition-all shadow-2xs"
                            >
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                                    <p className="text-xs text-muted-foreground">Deadline: {task.deadline || 'Hari ini'}</p>
                                </div>
                                <Badge variant="outline" className={`font-semibold text-xs ${getPriorityColor(task.priority)}`}>
                                    {task.priority || 'Medium'}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}