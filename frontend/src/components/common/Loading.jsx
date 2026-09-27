import { Loader2 } from 'lucide-react';

export default function Loading({ text = "Memuat data..." }) {
    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{text}</p>
        </div>
    );
}