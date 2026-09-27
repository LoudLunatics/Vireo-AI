import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";

export default function ReflectionForm({ onReflectionSubmitted }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setLoading(true);
        try {
            await onReflectionSubmitted(content);
            setContent('');
        } catch (error) {
            console.error("Gagal mengirim refleksi:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Send className="w-4 h-4 text-primary" /> Tulis Refleksi Anda
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="reflectionContent">Apa pencapaian atau kendala Anda hari ini?</Label>
                        <Textarea 
                            id="reflectionContent"
                            placeholder="Tuliskan refleksi, hambatan, atau hal yang disyukuri hari ini..." 
                            rows={5}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required 
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Agen AI sedang menganalisis..." : "Kirim & Analisis dengan AI"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}