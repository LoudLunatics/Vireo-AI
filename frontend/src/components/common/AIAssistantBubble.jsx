import { useState, useRef, useEffect } from 'react';
import { X, Send, User, Loader2, RotateCcw, BarChart3, Flame, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChatBubble() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]); 
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    
    const scrollContainerRef = useRef(null);

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const sendTextMessage = async (textToSend) => {
        if (!textToSend.trim() || loading) return;

        const userMsg = textToSend.trim();
        setInput('');
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/ai/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userMsg })
            });
            const data = await res.json();

            if (data.success) {
                setMessages(prev => [...prev, { sender: 'ai', text: data.data.replyMessage }]);
                
                // 🚀 DAFTAR AKSI BACA / UMUM YANG TIDAK PERLU MEMICU LIVE SYNC
                const nonMutativeActions = [
                    'GENERAL', 
                    'GET_REFLECTION', 
                    'GET_HABIT_STREAK', 
                    'GET_URGENT_TASKS', 
                    'GET_TODAY_PRIORITIES',
                    'GET_GOALS'
                ];

                // Jika aksi termasuk perubahan data (ADD_TASK, UPDATE_GOAL, dll), pancarkan sinyal!
                if (data.data.action && !nonMutativeActions.includes(data.data.action)) {
                    window.dispatchEvent(new CustomEvent('vireo-data-updated', { 
                        detail: { action: data.data.action } 
                    }));
                }
            } else {
                setMessages(prev => [...prev, { sender: 'ai', text: 'Maaf, terjadi kesalahan pada sistem AI.' }]);
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { sender: 'ai', text: 'Gagal terhubung ke server backend AI.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        sendTextMessage(input);
    };

    const handleResetChat = () => {
        setMessages([]);
    };

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
            {/* Tombol Floating Bubble PNG Custom */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none cursor-pointer"
                    title="Vireo Chat"
                    aria-label="Vireo Chat"
                >
                    <img 
                        src="/vireo_chat_bubble.png" 
                        alt="Vireo Chat" 
                        className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-2xl"
                    />
                </button>
            )}

            {/* Jendela Chat Kompak & Minimalis */}
            {isOpen && (
                <div className="bg-card text-card-foreground border border-border/80 rounded-2xl shadow-2xl w-[90vw] max-w-[360px] sm:w-[350px] flex flex-col h-[80dvh] sm:h-[480px] overflow-hidden animate-in zoom-in-95 duration-200">
                    
                    {/* Header Chat Ringkas dengan Logo (Tanpa Kedip) */}
                    <div className="px-3.5 py-2.5 flex items-center justify-between shrink-0 border-b border-border/60 bg-card z-10">
                        <div className="flex items-center gap-2">
                            <img src="/vireo_chat_bubble.png" alt="Logo" className="w-7 h-7 object-contain" />
                            <div>
                                <h3 className="text-xs font-bold tracking-tight text-foreground">Vireo AI Chat</h3>
                                <p className="text-[10px] text-muted-foreground">Asisten produktivitas</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={handleResetChat}
                                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer"
                                title="Reset Percakapan"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer"
                                title="Tutup"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Area Konten Chat, Tutorial & Quick Chips */}
                    <div 
                        ref={scrollContainerRef}
                        className="flex-1 p-3 overflow-y-auto space-y-2.5 scroll-smooth flex flex-col bg-muted/10 text-xs"
                    >
                        {messages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center px-1 my-auto space-y-2.5">
                                <img src="/vireo_chat_bubble.png" alt="Vireo AI" className="w-10 h-10 object-contain" />
                                <h4 className="text-xs font-bold text-foreground">Vireo Chat Siap Membantu</h4>
                                
                                {/* Quick Action Chips dengan Desain Card Elegan */}
                                <div className="w-full space-y-1 text-left">
                                    <p className="text-[10px] font-semibold text-muted-foreground px-0.5">Pintasan Cepat (Demo):</p>
                                    <div className="grid grid-cols-1 gap-1">
                                        <button 
                                            onClick={() => sendTextMessage("Bagaimana progres produktivitas-ku minggu ini?")}
                                            disabled={loading}
                                            className="w-full flex items-center gap-2 bg-card hover:bg-primary/5 border border-border/70 hover:border-primary/40 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs group text-left"
                                        >
                                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                <BarChart3 className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-semibold text-foreground">Cek Progres Mingguan</p>
                                                <p className="text-[9px] text-muted-foreground">Analisis performa & targetmu</p>
                                            </div>
                                        </button>

                                        <button 
                                            onClick={() => sendTextMessage("Cek streak habit hari ini")}
                                            disabled={loading}
                                            className="w-full flex items-center gap-2 bg-card hover:bg-primary/5 border border-border/70 hover:border-primary/40 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs group text-left"
                                        >
                                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                <Flame className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-semibold text-foreground">Cek Streak Habit</p>
                                                <p className="text-[9px] text-muted-foreground">Lihat konsistensi harianmu</p>
                                            </div>
                                        </button>

                                        <button 
                                            onClick={() => sendTextMessage("Rangkum tugas mendesak saya")}
                                            disabled={loading}
                                            className="w-full flex items-center gap-2 bg-card hover:bg-primary/5 border border-border/70 hover:border-primary/40 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs group text-left"
                                        >
                                            <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <CheckSquare className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-semibold text-foreground">Rangkum Tugas Mendesak</p>
                                                <p className="text-[9px] text-muted-foreground">Prioritas pekerjaan hari ini</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Tutorial & Panduan */}
                                <div className="text-[10px] text-muted-foreground text-left bg-card/70 border border-border/60 p-2.5 rounded-xl space-y-1 w-full shadow-2xs">
                                    <p className="font-semibold text-foreground">Panduan Perintah Ketik:</p>
                                    <ul className="list-disc list-inside space-y-0.5">
                                        <li><strong className="text-foreground">Tugas:</strong> <span className="text-primary">"Tambah tugas [nama] deadline besok"</span></li>
                                        <li><strong className="text-foreground">Habit:</strong> <span className="text-primary">"Tambah habit [nama rutin]"</span></li>
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.sender === 'ai' && (
                                            <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                                                <img src="/vireo_chat_bubble.png" alt="AI" className="w-4 h-4 object-contain" />
                                            </div>
                                        )}
                                        {/* ✨ whitespace-pre-line ditambahkan agar baris baru \n dan \n\n merender rapi */}
                                        <div className={`p-2.5 rounded-xl max-w-[82%] text-xs leading-relaxed whitespace-pre-line ${
                                            msg.sender === 'user' 
                                                ? 'bg-primary text-primary-foreground rounded-br-xs shadow-xs' 
                                                : 'bg-card border border-border/80 text-card-foreground rounded-bl-xs shadow-2xs'
                                        }`}>
                                            {msg.text}
                                        </div>
                                        {msg.sender === 'user' && (
                                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5 text-primary-foreground shadow-xs">
                                                <User className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex gap-1.5 items-center text-muted-foreground text-[10px] pt-1">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                        <span>Vireo AI sedang memproses...</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Kotak Input Bawah Minimalis */}
                    <div className="p-2.5 bg-card shrink-0 border-t border-border/55">
                        <form onSubmit={handleSendMessage} className="bg-background/80 border border-border rounded-xl p-2 flex flex-col gap-1.5 shadow-sm focus-within:border-primary/50 transition-colors">
                            <textarea 
                                rows="1"
                                placeholder="Ketik instruksi atau perintah..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendTextMessage(input);
                                    }
                                }}
                                className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none resize-none px-0.5"
                            />
                            
                            <div className="flex items-center justify-end pt-1 border-t border-border/40">
                                <Button 
                                    type="submit" 
                                    size="icon" 
                                    disabled={loading || !input.trim()} 
                                    className="h-6 w-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 cursor-pointer disabled:opacity-40"
                                >
                                    <Send className="w-3 h-3" />
                                </Button>
                            </div>
                        </form>
                    </div>

                </div>
            )}
        </div>
    );
}