import { CheckCircle2, ListTodo, Target, Flame } from "lucide-react";

export default function StatsCards({ stats }) {
    const items = [
        {
            title: "Tugas Pending",
            value: stats?.pendingTasks || 0,
            icon: ListTodo,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            glow: "group-hover:bg-blue-500/5",
        },
        {
            title: "Total Kebiasaan",
            value: stats?.totalHabits || 0,
            icon: CheckCircle2,
            color: "text-green-500",
            bg: "bg-green-500/10",
            glow: "group-hover:bg-green-500/5",
        },
        {
            title: "Target Mingguan",
            value: stats?.activeGoals || 0,
            icon: Target,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            glow: "group-hover:bg-purple-500/5",
        },
        {
            title: "Streak Produktif",
            value: `${stats?.streak || 0} Hari`,
            icon: Flame,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            glow: "group-hover:bg-orange-500/5",
        },
    ];

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item, index) => {
                const Icon = item.icon;
                return (
                    <div 
                        key={index} 
                        className="group bg-card/50 rounded-2xl shadow-2xs border border-border/60 hover:border-border transition-all duration-200 overflow-hidden relative p-4 flex flex-col justify-between h-full space-y-2"
                    >
                        {/* Efek pendar cahaya tipis di sudut kartu saat di-hover */}
                        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-xl pointer-events-none transition-all duration-300 ${item.bg}`} />

                        {/* Baris Atas: Judul dan Kotak Ikon */}
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {item.title}
                            </span>
                            <div className={`p-2 rounded-xl ${item.bg} ${item.color} shrink-0 border border-current/10`}>
                                <Icon className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        
                        {/* Baris Bawah: Nilai Angka (Tidak Bold) */}
                        <div className="relative z-10">
                            <h3 className="text-2xl font-normal tracking-tight text-foreground">
                                {item.value}
                            </h3>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}