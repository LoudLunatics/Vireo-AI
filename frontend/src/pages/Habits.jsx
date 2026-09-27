import { useEffect, useState, useCallback, useMemo } from 'react';
import Loading from '@/components/common/Loading';
import HabitForm from '@/components/habit/HabitForm';
import HabitList from '@/components/habit/HabitList';
import HabitInsight from '@/components/habit/HabitInsight';
import HabitHeatmap from '@/components/habit/HabitHeatmap';
import ConfirmModal from '@/components/ui/ConfirmModal'; // 🛠️ Import Modal Konfirmasi Kustom
import { Button } from '@/components/ui/button';
import { Sparkles, Plus, X, RefreshCw, Send, CheckCircle2 } from 'lucide-react';
import { fetchHabits, createHabit } from '@/services/api';

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]); // Menyimpan riwayat log permanen untuk heatmap
  const [totalHabitsCount, setTotalHabitsCount] = useState(0); // Total habit aktif untuk perhitungan persentase heatmap
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlanAI, setShowPlanAI] = useState(false);

  // 🛠️ State terpusat untuk Modal Konfirmasi Hapus Habit
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    habitId: null,
    habitTitle: ''
  });

  const [aiGoalPrompt, setAiGoalPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]); 
  const [savingPlan, setSavingPlan] = useState(false);

  // Helper untuk mendapatkan format tanggal lokal YYYY-MM-DD
  const getLocalISODate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // State untuk melacak tanggal saat ini (auto-reset tengah malam)
  const [currentDateStr, setCurrentDateStr] = useState(getLocalISODate());

  const loadHabits = useCallback(async () => {
    try {
      const res = await fetchHabits();
      if (res.success) {
        setHabits(res.data || []);
        setLogs(res.logs || []);
        setTotalHabitsCount(res.totalHabits || res.data.length || 0); // Menangkap total habit aktif dari backend
      }
    } catch (error) {
      console.error('Gagal memuat kebiasaan:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();

    // 🚀 LIVE SYNC LISTENER: Mendengarkan sinyal pembaruan data dari AI Assistant Chat
    const handleDataUpdate = () => {
      loadHabits();
    };
    window.addEventListener('vireo-data-updated', handleDataUpdate);

    // AUTO-RESET TIMER: Mengecek setiap 30 detik apakah hari sudah berganti (lewat 00:00)
    const midnightInterval = setInterval(() => {
      const newDateStr = getLocalISODate();
      if (newDateStr !== currentDateStr) {
        setCurrentDateStr(newDateStr);
        loadHabits();
      }
    }, 30000);

    return () => {
      window.removeEventListener('vireo-data-updated', handleDataUpdate);
      clearInterval(midnightInterval);
    };
  }, [currentDateStr, loadHabits]);

  const handleHabitCreated = async (habitData) => {
    try {
      const res = await createHabit(habitData);
      if (res.success) {
        setShowAddModal(false);
        await loadHabits();
      }
    } catch (error) {
      console.error('Gagal menambahkan habit:', error);
    }
  };

  const handleGenerateAIPlan = async (e) => {
    e.preventDefault();
    if (!aiGoalPrompt.trim()) return;

    setAiLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/habits/ai-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: aiGoalPrompt })
      });
      const data = await response.json();
      
      if (data.success) {
        setAiSuggestions(data.habits || []); 
      } else {
        alert(data.message || 'Gagal membuat rencana habit dengan AI.');
      }
    } catch (error) {
      console.error('Gagal menghubungi AI Planner:', error);
      alert('Terjadi kesalahan pada server AI.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAIHabits = async () => {
    if (!aiSuggestions || aiSuggestions.length === 0) return;

    setSavingPlan(true);
    try {
      const response = await fetch('http://localhost:5000/api/habits/ai-plan/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitsList: aiSuggestions })
      });
      const data = await response.json();

      if (data.success) {
        alert("Rencana kebiasaan berhasil disimpan ke daftar Anda!");
        setShowPlanAI(false);
        setAiSuggestions([]);
        setAiGoalPrompt('');
        loadHabits(); 
      } else {
        alert(data.message || 'Gagal menyimpan habit.');
      }
    } catch (error) {
      console.error('Gagal menyimpan habit AI:', error);
    } finally {
      setSavingPlan(false);
    }
  };

  // Mengubah array logs menjadi objek Map penghitung jumlah centang per tanggal
  const habitHistoryMap = useMemo(() => {
    const map = {};
    logs.forEach(log => {
      map[log.date] = (map[log.date] || 0) + 1;
    });
    return map;
  }, [logs]);

  if (loading) {
    return <Loading text="Memuat kebiasaan..." />;
  }

  return (
    <div className="space-y-3.5 max-w-7xl mx-auto w-full pb-6 px-2 md:px-0 relative pt-0 mt-0">
      
      {/* Header + Tombol Aksi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2.5 border-b border-border/70 gap-2">
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight">Habits</h1>
          <p className="text-[11px] text-muted-foreground">Bangun konsistensi harian dan dapatkan insight dari AI.</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            onClick={() => setShowAddModal(true)}
            className="gap-1 h-7 text-xs px-2.5 rounded-lg cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Habit Baru
          </Button>

          <Button
            onClick={() => setShowPlanAI(true)}
            variant="outline"
            className="gap-1 h-7 text-xs px-2.5 rounded-lg cursor-pointer border-border/80 shadow-2xs hover:bg-primary/5 hover:text-primary transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Rencanakan dengan AI
          </Button>
        </div>
      </div>

      {/* POP-UP MODAL CARD TAMBAH HABIT */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl shadow-xl border border-border/80 p-4.5 w-full max-w-md relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-primary" /> Tambah Kebiasaan Baru
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <HabitForm onHabitCreated={handleHabitCreated} />
          </div>
        </div>
      )}

      {/* GRID ATAS: Asimetris Bento Grid (7 : 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        
        {/* Kolom Kiri: Daftar Kebiasaan Aktif (7 Kolom) */}
        <div className="w-full lg:col-span-7 bg-card/40 rounded-2xl border border-border/60 p-4 relative overflow-hidden shadow-2xs">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
          <HabitList 
            habits={habits} 
            onRefresh={loadHabits} 
            // 🛠️ Menghubungkan fungsi pemicu modal hapus kustom
            onRequestDelete={(id, title) => setDeleteModal({ isOpen: true, habitId: id, habitTitle: title })}
          />
        </div>

        {/* Kolom Kanan: Habit AI Coach (5 Kolom) */}
        <div className="w-full lg:col-span-5 bg-card/40 rounded-2xl border border-primary/20 p-4 relative overflow-hidden bg-gradient-to-br from-primary/5 via-card/40 to-card shadow-2xs">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
          <HabitInsight habits={habits} />
        </div>

      </div>

      {/* BAGIAN BAWAH: Heatmap Konsistensi Habit Dinamis */}
      <div className="w-full bg-card/40 rounded-2xl border border-border/60 p-4 relative overflow-hidden shadow-2xs">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
        <HabitHeatmap historyData={habitHistoryMap} totalHabits={totalHabitsCount} />
      </div>

      {/* MODAL CARD: Rencanakan dengan AI */}
      {showPlanAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl p-4.5 w-full max-w-lg shadow-xl border border-border relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Rencanakan Habit dengan AI
              </h3>
              <button 
                onClick={() => { setShowPlanAI(false); setAiSuggestions([]); setAiGoalPrompt(''); }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleGenerateAIPlan} className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">Apa tujuan utama atau resolusi Anda?</label>
                <textarea 
                  rows="2"
                  placeholder="Contoh: Saya ingin menguasai arsitektur backend Go dalam sebulan"
                  value={aiGoalPrompt}
                  onChange={(e) => setAiGoalPrompt(e.target.value)}
                  className="w-full p-2.5 text-xs bg-background/50 border border-border/80 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  required
                />
              </div>

              <Button type="submit" disabled={aiLoading} className="w-full h-8 text-xs font-semibold rounded-xl cursor-pointer">
                {aiLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> AI Sedang Menyusun Rencana...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" /> Buat Rekomendasi AI
                  </>
                )}
              </Button>
            </form>

            {/* AREA HASIL REKOMENDASI AI */}
            {aiSuggestions && aiSuggestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/60 space-y-2">
                <p className="text-[11px] font-semibold text-primary">Rekomendasi Tahapan & Jadwal dari AI:</p>
                
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {aiSuggestions.map((item, index) => (
                    <div key={index} className="p-2 bg-muted/40 border border-border/60 rounded-xl text-xs space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground text-xs">{item.title}</p>
                          <span className="text-[10px] text-muted-foreground capitalize">Frekuensi: {item.frequency}</span>
                        </div>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      </div>

                      {item.resource_url && (
                        <div className="pt-1 border-t border-border/40 flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">Sumber Belajar:</span>
                          <a 
                            href={item.resource_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary font-medium hover:underline flex items-center gap-1"
                          >
                            {item.resource_title || 'Kunjungi Referensi'} ↗
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleSaveAIHabits} 
                  disabled={savingPlan}
                  className="w-full h-8 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer mt-1"
                >
                  {savingPlan ? "Menyimpan ke Daftar..." : "Setuju & Simpan ke Daftar Habit"}
                </Button>
              </div>
            )}

            <div className="flex justify-end mt-2.5">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setShowPlanAI(false); setAiSuggestions([]); setAiGoalPrompt(''); }} 
                className="rounded-xl h-7 text-xs cursor-pointer"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 🛠️ KOMPONEN MODAL KONFIRMASI KUSTOM UNTUK HABIT */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Konfirmasi Hapus Kebiasaan"
        message={`Apakah Anda yakin ingin menghapus kebiasaan "${deleteModal.habitTitle || 'ini'}"?`}
        onConfirm={async () => {
          try {
            const response = await fetch(`http://localhost:5000/api/habits/${deleteModal.habitId}`, {
              method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
              setDeleteModal({ isOpen: false, habitId: null, habitTitle: '' });
              loadHabits();
            }
          } catch (error) {
            console.error('Gagal menghapus habit:', error);
          }
        }}
        onCancel={() => setDeleteModal({ isOpen: false, habitId: null, habitTitle: '' })}
      />

    </div>
  );
}