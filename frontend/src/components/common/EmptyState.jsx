import { FolderOpen } from 'lucide-react';

export default function EmptyState({ title = "Belum ada data", description = "Mulai tambahkan aktivitas atau tugas baru Anda." }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg border-border bg-card/50">
            <div className="p-3 mb-3 rounded-full bg-muted text-muted-foreground">
                <FolderOpen className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="max-w-xs mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
    );
}