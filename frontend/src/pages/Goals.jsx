import { useEffect, useState, useCallback, useMemo } from 'react';
import Loading from '@/components/common/Loading';
import GoalForm from '@/components/goal/GoalForm';
import EmptyState from '@/components/common/EmptyState';
import ConfirmModal from '@/components/ui/ConfirmModal'; // 🛠️ Import Modal Konfirmasi Kustom
import { Target, CheckCircle2, Trash2, Plus, X, ChevronDown, ChevronUp, Trophy, Loader2, Sparkles } from 'lucide-react';
import { fetchGoals, createGoal } from '@/services/api';
import confetti from 'canvas-confetti';

export default function Goals() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    
    const [expandedGoalId, setExpandedGoalId] = useState(null);

    // 🛠️ State terpusat untuk Modal Konfirmasi Hapus Target
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        goalId: null,
        goalTitle: ''
    });
    
    // Inisialisasi state cache langkah mikro dari localStorage agar aman saat pindah halaman
    const [goalStepsCache, setGoalStepsCache] = useState(() => {
        try {
            const saved = localStorage.getItem('vireo_ai_goal_steps');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });
    
    const [loadingStepsId, setLoadingStepsId] = useState(null);
    
    // Inisialisasi state checklist dari localStorage
    const [checklistState, setChecklistState] = useState(() => {
        try {
            const saved = localStorage.getItem('vireo_goal_checklists');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    const loadGoals = useCallback(async () => {
        try {
            const res = await fetchGoals();
            if (res.success) {
                setGoals(res.data);
            }
        } catch (error) {
            console.error("Gagal memuat goals:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGoals();

        // 🚀 LIVE SYNC LISTENER: Mendengarkan sinyal pembaruan data dari AI Assistant Chat
        const handleDataUpdate = () => {
            loadGoals();
        };
        window.addEventListener('vireo-data-updated', handleDataUpdate);

        return () => {
            window.removeEventListener('vireo-data-updated', handleDataUpdate);
        };
    }, [loadGoals]);

    const handleGoalCreated = async (goalData) => {
        const res = await createGoal(goalData);
        if (res.success) {
            setShowAddModal(false); 
            loadGoals();
        }
    };

    // FUNGSI UTAMA: Mengambil langkah mikro AI dan mengirimkan target_date agar dinamis
    const fetchDynamicStepsForGoal = async (goal) => {
        if (goalStepsCache[goal.id]) return; 

        setLoadingStepsId(goal.id);
        try {
            const response = await fetch('http://localhost:5000/api/goals/breakdown', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    goalTitle: goal.title,
                    targetDate: goal.target_date // Mengirim durasi goal (Bulanan/Tahunan/Mingguan)
                })
            });
            const data = await response.json();

            if (data.success && data.steps && Array.isArray(data.steps)) {
                setGoalStepsCache(prev => {
                    const updated = { ...prev, [goal.id]: data.steps };
                    try {
                        localStorage.setItem('vireo_ai_goal_steps', JSON.stringify(updated));
                    } catch (e) {
                        console.error("Gagal menyimpan cache langkah mikro ke localStorage", e);
                    }
                    return updated;
                });
            } else {
                setGoalStepsCache(prev => ({ 
                    ...prev, 
                    [goal.id]: [
                        `Fase 1: Analisis awal untuk ${goal.title} - Sumber: https://developer.mozilla.org`,
                        `Fase 2: Pelajari dokumentasi resmi - Sumber: Official Documentation`,
                        `Fase 3: Setup environment dan latihan dasar - Sumber: https://www.freecodecamp.org`,
                        `Fase 4: Implementasi awal dan struktur - Sumber: https://github.com`
                    ] 
                }));
            }
        } catch (error) {
            console.error("Gagal memuat langkah mikro AI:", error);
            setGoalStepsCache(prev => ({ 
                ...prev, 
                [goal.id]: [
                    `Fase 1: Analisis awal untuk ${goal.title} - Sumber: https://developer.mozilla.org`,
                    `Fase 2: Pelajari dokumentasi resmi - Sumber: Official Documentation`,
                    `Fase 3: Setup environment dan latihan dasar - Sumber: https://www.freecodecamp.org`,
                    `Fase 4: Implementasi awal dan struktur - Sumber: https://github.com`
                ] 
            }));
        } finally {
            setLoadingStepsId(null);
        }
    };

    const handleToggleExpand = (goal) => {
        const isExpanded = expandedGoalId === goal.id;
        if (!isExpanded) {
            setExpandedGoalId(goal.id);
            fetchDynamicStepsForGoal(goal);
        } else {
            setExpandedGoalId(null);
        }
    };

    const handleToggleStep = async (goal, stepIndex, totalSteps) => {
        const goalId = goal.id;
        
        setChecklistState(prev => {
            const goalSteps = prev[goalId] || {};
            const updatedGoalSteps = { ...goalSteps, [stepIndex]: !goalSteps[stepIndex] };
            
            const completedCount = Object.values(updatedGoalSteps).filter(Boolean).length;
            const calculatedProgress = Math.round((completedCount / totalSteps) * 100);

            setGoals(currentGoals => 
                currentGoals.map(g => g.id === goalId ? { ...g, progress: calculatedProgress } : g)
            );

            const newState = { ...prev, [goalId]: updatedGoalSteps };

            try {
                localStorage.setItem('vireo_goal_checklists', JSON.stringify(newState));
            } catch (e) {
                console.error("Gagal menyimpan ke localStorage", e);
            }

            // Simpan progres ke database SQLite
            fetch(`http://localhost:5000/api/goals/${goalId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ progress: calculatedProgress })
            }).catch(err => {
                console.error("Gagal menyimpan progress ke database:", err);
            });

            // Jika progress mencapai 100%, jalankan transisi siklus adaptif lanjutan secara otomatis
            if (calculatedProgress === 100) {
                try {
                    confetti({
                        particleCount: 150,
                        spread: 90,
                        origin: { y: 0.6 }
                    });
                } catch (e) {
                    console.log("Confetti effect skipped");
                }

                // Auto-Advance ke siklus berikutnya setelah perayaan singkat
                setTimeout(async () => {
                    // 1. Bersihkan checklist lokal untuk goal ini
                    setChecklistState(prevChecklist => {
                        const copy = { ...prevChecklist };
                        delete copy[goalId];
                        try {
                            localStorage.setItem('vireo_goal_checklists', JSON.stringify(copy));
                        } catch (err) {}
                        return copy;
                    });

                    // 2. Hapus cache langkah lama agar AI men-generate materi tingkat lanjut
                    setGoalStepsCache(prevCache => {
                        const copy = { ...prevCache };
                        delete copy[goalId];
                        try {
                            localStorage.setItem('vireo_ai_goal_steps', JSON.stringify(copy));
                        } catch (err) {}
                        return copy;
                    });

                    try {
                        // 3. Deteksi nomor siklus saat ini atau mulai dari Siklus 2 jika belum ada label siklus
                        const currentTitle = goal.title;
                        let nextCycleNum = 2;
                        const match = currentTitle.match(/Siklus\s*(\d+)/i);
                        if (match) {
                            nextCycleNum = parseInt(match[1]) + 1;
                        }

                        const baseTitle = currentTitle.replace(/\s*\(Siklus.*?\)/gi, '').trim();
                        const nextTitle = `${baseTitle} (Siklus ${nextCycleNum})`;

                        // 4. Update judul dengan nomor siklus baru dan reset progres ke 0% di database
                        await fetch(`http://localhost:5000/api/goals/${goalId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                title: nextTitle, 
                                progress: 0 
                            })
                        });

                        // 5. Muat ulang daftar goal dari database
                        await loadGoals(); 

                        // 6. Panggil AI secara otomatis untuk meracik roadmap tingkat lanjut berdasarkan siklus baru
                        fetchDynamicStepsForGoal({ ...goal, title: nextTitle });
                    } catch (err) {
                        console.error("Gagal mereset siklus goal:", err);
                    }
                }, 800);
            }

            return newState;
        });
    };

    if (loading) return <Loading text="Memuat target..." />;

    return (
        <div className="space-y-4 max-w-7xl mx-auto w-full pb-6 px-2 md:px-0 relative pt-0 mt-0">
            
            {/* Header + Tombol Tambah Target Baru */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2.5 border-b border-border/70 gap-2">
                <div>
                    <h1 className="text-base font-bold text-foreground tracking-tight">Target & Goals</h1>
                    <p className="text-[11px] text-muted-foreground">Tetapkan tujuan besar Anda dan biarkan agen AI memecahnya menjadi roadmap strategis.</p>
                </div>

                <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/95 transition-colors shadow-2xs cursor-pointer shrink-0"
                >
                    <Plus className="w-3.5 h-3.5" /> Tambah Target Baru
                </button>
            </div>

            {/* POP-UP MODAL CARD */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-card rounded-2xl shadow-xl border border-border/80 p-5 w-full max-w-md relative overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Plus className="w-4 h-4 text-primary" /> Tambah Target Baru
                            </h2>
                            <button 
                                onClick={() => setShowAddModal(false)}
                                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <GoalForm onGoalCreated={handleGoalCreated} />
                    </div>
                </div>
            )}

            {/* Layout Full-Width Daftar Target Aktif */}
            <div className="w-full">
                <div className="bg-card/50 rounded-2xl shadow-2xs border border-border/60 p-4 relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-28 h-28 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

                    <div className="mb-3">
                        <h2 className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                            <Target className="w-3.5 h-3.5 text-primary" /> Daftar Target Aktif
                        </h2>
                        <p className="text-[10px] text-muted-foreground">Klik pada kartu target untuk melihat roadmap langkah mikro dari AI.</p>
                    </div>

                    <div className="space-y-2.5">
                        {goals.length === 0 ? (
                            <div className="py-6">
                                <EmptyState title="Belum ada target" description="Klik tombol 'Tambah Target Baru' di atas untuk memulai." />
                            </div>
                        ) : (
                            goals.map((goal) => {
                                const isExpanded = expandedGoalId === goal.id;
                                const steps = goalStepsCache[goal.id] || [];
                                const isLoadingSteps = loadingStepsId === goal.id;
                                const currentGoalChecklist = checklistState[goal.id] || {};
                                const isCompleted = (goal.progress || 0) === 100;
                                const progressVal = goal.progress || 0;

                                // Deteksi jenis durasi untuk label dinamis
                                const targetDateLower = (goal.target_date || '').toLowerCase();
                                const isYearly = targetDateLower.includes('tahun') || targetDateLower.includes('yearly');
                                const isMonthly = targetDateLower.includes('bulan') || targetDateLower.includes('monthly');

                                return (
                                    <div 
                                        key={goal.id} 
                                        className={`border rounded-xl bg-card transition-all shadow-2xs overflow-hidden ${isCompleted ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]' : 'border-border/70 hover:border-border hover:shadow-xs'}`}
                                    >
                                        {/* Baris Utama Kartu */}
                                        <div 
                                            onClick={() => handleToggleExpand(goal)}
                                            className="flex items-center justify-between p-3 cursor-pointer select-none bg-card hover:bg-muted/30 transition-colors gap-3"
                                        >
                                            <div className="flex items-center space-x-2.5 min-w-0">
                                                <div className={`p-2 rounded-lg border shrink-0 ${isCompleted ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'}`}>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                                <div className="space-y-1 min-w-0">
                                                    <p className={`text-xs font-medium truncate ${isCompleted ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-foreground'}`}>
                                                        {goal.title}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-muted-foreground">Kategori/Deadline: {goal.target_date}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0">
                                                {/* Progress Bar Visual Mini & Persentase */}
                                                <div className="hidden sm:flex flex-col items-end gap-1 w-24">
                                                    <div className="flex justify-between w-full text-[10px] font-semibold">
                                                        <span className="text-muted-foreground">Progres</span>
                                                        <span className={isCompleted ? "text-emerald-600" : "text-primary"}>{progressVal}%</span>
                                                    </div>
                                                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                                        <div 
                                                            className={`h-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-primary'}`} 
                                                            style={{ width: `${progressVal}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all sm:hidden ${isCompleted ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                                    {isCompleted && <Trophy className="w-3 h-3 text-amber-300" />}
                                                    {progressVal}%
                                                </span>
                                                
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // 🛠️ Memicu modal konfirmasi kustom
                                                        setDeleteModal({ isOpen: true, goalId: goal.id, goalTitle: goal.title });
                                                    }}
                                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                                                    title="Hapus Target"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>

                                                <div className="text-muted-foreground p-1">
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bagian Dropdown Checklist Roadmap AI (Dinamis Berdasarkan Durasi) */}
                                        {isExpanded && (
                                            <div className="px-4 pb-3.5 pt-2.5 border-t border-border/50 bg-muted/20 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                    <Sparkles className="w-3 h-3 text-primary animate-pulse" /> 
                                                    {isYearly 
                                                        ? 'Fase Utama (Tahunan - AI Roadmap):' 
                                                        : isMonthly 
                                                        ? 'Roadmap 4 Minggu (Bulanan - AI Breakdown):' 
                                                        : 'Roadmap Milestone Harian / Custom (AI-Generated):'}
                                                </p>

                                                {isLoadingSteps ? (
                                                    <div className="py-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                        <span>Agen AI sedang menyusun roadmap strategis...</span>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {steps.map((stepText, idx) => {
                                                            const isChecked = !!currentGoalChecklist[idx];
                                                            
                                                            const parts = stepText.split("- Sumber:");
                                                            const mainAction = parts[0];
                                                            const sourceInfo = parts[1] ? parts[1].trim() : '';

                                                            // 🚀 LOGIKA PINTAR: Cek URL langsung ATAU buat link pencarian Google otomatis jika berupa teks biasa
                                                            const urlMatch = sourceInfo.match(/(https?:\/\/[^\s]+)/);
                                                            const targetUrl = urlMatch ? urlMatch[0] : (sourceInfo ? `https://www.google.com/search?q=${encodeURIComponent(sourceInfo)}` : null);
                                                            const sourceName = urlMatch ? sourceInfo.replace(urlMatch[0], '').trim() : sourceInfo;

                                                            return (
                                                                <label 
                                                                    key={idx} 
                                                                    className="flex items-start gap-2.5 text-xs text-foreground/90 cursor-pointer bg-card p-2.5 rounded-xl border border-border/50 hover:border-primary/40 transition-all shadow-2xs"
                                                                >
                                                                    <input 
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={() => handleToggleStep(goal, idx, steps.length)}
                                                                        className="mt-0.5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer shrink-0"
                                                                    />
                                                                    <div className={`space-y-1 flex-1 min-w-0 ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
                                                                        <p className="leading-relaxed font-medium">{mainAction}</p>
                                                                        
                                                                        {sourceInfo && (
                                                                            <div className="flex items-center gap-1.5 pt-0.5">
                                                                                <span className="text-[10px] text-muted-foreground font-semibold">Sumber:</span>
                                                                                <a 
                                                                                    href={targetUrl} 
                                                                                    target="_blank" 
                                                                                    rel="noopener noreferrer"
                                                                                    onClick={(e) => e.stopPropagation()} 
                                                                                    className="text-[10px] text-primary hover:underline font-medium inline-flex items-center gap-1 truncate"
                                                                                >
                                                                                    {sourceName || targetUrl} ↗
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* 🛠️ KOMPONEN MODAL KONFIRMASI KUSTOM UNTUK TARGET & GOALS */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="Konfirmasi Hapus Target"
                message={`Apakah Anda yakin ingin menghapus target "${deleteModal.goalTitle || 'ini'}"?`}
                onConfirm={async () => {
                    try {
                        const response = await fetch(`http://localhost:5000/api/goals/${deleteModal.goalId}`, {
                            method: 'DELETE',
                        });
                        const data = await response.json();
                        
                        if (data.success) {
                            if (expandedGoalId === deleteModal.goalId) setExpandedGoalId(null);
                            setDeleteModal({ isOpen: false, goalId: null, goalTitle: '' });
                            loadGoals();
                        }
                    } catch (error) {
                        console.error("Gagal menghapus target:", error);
                    }
                }}
                onCancel={() => setDeleteModal({ isOpen: false, goalId: null, goalTitle: '' })}
            />
        </div>
    );
}