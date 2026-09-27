import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, MessageSquareQuote } from "lucide-react";
import EmptyState from "../common/EmptyState";

export default function ReflectionResult({ analysis }) {
    return (
        <Card className="shadow-sm border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
            <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" /> AI Reflection Analysis
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!analysis ? (
                    <EmptyState 
                        title="Belum ada analisis" 
                        description="Kirim catatan refleksi Anda di samping untuk melihat hasil analisis dan masukan dari agen AI." 
                    />
                ) : (
                    <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center space-x-2 text-primary font-medium text-xs uppercase tracking-wider">
                            <MessageSquareQuote className="w-4 h-4" /> Umpan Balik Agen
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                            {analysis}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}