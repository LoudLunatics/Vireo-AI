import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Repeat, Target, BookOpen, CheckSquare, CheckCircle2, Circle, Flame, Trophy, Menu, ShieldAlert } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/common/EmptyState";
import DailyBriefingCard from '@/components/dashboard/DailyBriefingCard';
import { fetchDashboardData } from '@/services/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State untuk mengontrol buka/tutup dropdown menu di mode HP
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 🛠️ Helper untuk mendapatkan format 'YYYY-MM-DD' berdasarkan waktu lokal perangkat (bebas dari offset UTC)
  const getLocalISODate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // State untuk melacak tanggal saat ini (auto-reset tengah malam)
  const [currentDateStr, setCurrentDateStr] = useState(getLocalISODate());

  const loadData = useCallback(async () => {
    try {
      const res = await fetchDashboardData();
      if (res.success) {
        setData(res);
      } else {
        setError('Gagal memuat data dashboard');
      }
    } catch (err) {
      console.error('Gagal memuat dashboard:', err);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // 🚀 LIVE SYNC LISTENER: Mendengarkan sinyal pembaruan data dari AI Assistant Chat
    const handleDataUpdate = () => {
      loadData();
    };
    window.addEventListener('vireo-data-updated', handleDataUpdate);

    // 🛠️ AUTO-RESET TIMER: Mengecek setiap 30 detik apakah hari sudah berganti (lewat 00:00)
    const midnightInterval = setInterval(() => {
      const newDateStr = getLocalISODate();
      if (newDateStr !== currentDateStr) {
        setCurrentDateStr(newDateStr);
        loadData();
      }
    }, 30000); // Cek tiap 30 detik

    return () => {
      window.removeEventListener('vireo-data-updated', handleDataUpdate);
      clearInterval(midnightInterval);
    };
  }, [currentDateStr, loadData]);

  // Fungsi toggle habit yang disesuaikan dengan validasi database sekali sehari
  const handleToggleHabit = async (habitId, isAlreadyChecked) => {
    if (isAlreadyChecked) return;

    try {
      const response = await fetch(`http://localhost:5000/api/habits/${habitId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'increment' })
      });
      const result = await response.json();
      if (result.success) {
        loadData();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Gagal memperbarui status kebiasaan:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse max-w-7xl mx-auto px-2 md:px-0">
        <div className="h-12 bg-muted rounded-xl w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
        <p className="text-muted-foreground text-xs">{error}</p>
        <button onClick={() => window.location.reload()} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-medium cursor-pointer shadow-xs">
          Coba Lagi
        </button>
      </div>
    );
  }

  const rawTasks = data?.todayTasks || [];
  const habits = data?.todayHabits || [];
  const goals = data?.activeGoals || [];
  const stats = data?.stats || { pendingTasks: 0, totalHabits: 0, activeGoals: 0, streak: 0 };
  
  // Status Burnout dari Backend Briefing / Stats
  const isBurnoutMode = data?.isBurnout || false;
  const overdueCount = data?.overdueCount || 0;

  // RECOVERY MODE: Jika burnout aktif, saring hanya tugas prioritas tinggi atau urgent
  const tasks = isBurnoutMode 
    ? rawTasks.filter(t => t.priority === 'High' || t.status !== 'completed') 
    : rawTasks;

  const hasItems = tasks.length > 0 || habits.length > 0 || goals.length > 0;
  
  // 🛠️ Menggunakan fungsi lokal murni agar sinkron dengan pergantian hari tengah malam
  const today = getLocalISODate();

  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full pb-6 px-2 md:px-0 relative">
      
      {/* Header + Quick Actions yang Lebih Ramping & Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2.5 border-b border-border/70 gap-2">
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-[11px] text-muted-foreground">Ringkasan produktivitas harian Anda.</p>
        </div>

        {/* TAMPILAN LAPTOP / TABLET: Tombol Aksi Cepat Lebih Ringkas (Compact Mode) */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <Link to="/tasks" className="flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/95 transition-colors shadow-2xs">
            <PlusCircle className="w-3.5 h-3.5" /> Tugas Baru
          </Link>
          <Link to="/habits" className="flex items-center gap-1 px-2.5 py-1 bg-card/60 border border-border/80 rounded-lg text-xs font-medium hover:bg-muted/60 transition-colors shadow-2xs">
            <Repeat className="w-3.5 h-3.5 text-emerald-500" /> Habit
          </Link>
          <Link to="/goals" className="flex items-center gap-1 px-2.5 py-1 bg-card/60 border border-border/80 rounded-lg text-xs font-medium hover:bg-muted/60 transition-colors shadow-2xs">
            <Target className="w-3.5 h-3.5 text-purple-500" /> Target
          </Link>
          <Link to="/reflection" className="flex items-center gap-1 px-2.5 py-1 bg-card/60 border border-border/80 rounded-lg text-xs font-medium hover:bg-muted/60 transition-colors shadow-2xs">
            <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Reflection
          </Link>
        </div>

        {/* TAMPILAN MODE HP: Tombol Menu Dropdown */}
        <div className="sm:hidden relative w-full">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-card border border-border rounded-xl text-xs font-medium text-foreground shadow-2xs cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Menu className="w-3.5 h-3.5 text-primary" /> Menu Aksi Cepat
            </span>
            <span className="text-muted-foreground text-[10px]">{mobileMenuOpen ? "Tutup ▲" : "Buka ▼"}</span>
          </button>

          {/* Kotak Menu Dropdown HP */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
              <Link to="/tasks" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">
                <PlusCircle className="w-3.5 h-3.5" /> Tugas Baru
              </Link>
              <Link to="/habits" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted/60 rounded-lg text-xs font-medium text-foreground transition-colors">
                <Repeat className="w-3.5 h-3.5 text-emerald-500" /> Habit
              </Link>
              <Link to="/goals" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted/60 rounded-lg text-xs font-medium text-foreground transition-colors">
                <Target className="w-3.5 h-3.5 text-purple-500" /> Target
              </Link>
              <Link to="/reflection" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted/60 rounded-lg text-xs font-medium text-foreground transition-colors">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Reflection
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* BANNER RECOVERY MODE (AI Burnout Early Warning System) */}
      {isBurnoutMode && (
        <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in duration-300 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                Recovery Mode Aktif (Perlindungan Burnout)
              </p>
              <p className="text-[10px] text-muted-foreground">
                AI mendeteksi {overdueCount} tugas menumpuk. Beban diringankan agar kamu bisa fokus memulihkan energi.
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold px-2.5 py-1 rounded-xl shrink-0">
            Mode Tenang 🛡️
          </span>

        </div>
      )}

      {/* Bagian Atas: Daily Briefing & Statistik */}
      <div className="space-y-3">
        
        {/* Kartu Daily Briefing */}
        <div className="w-full">
          <DailyBriefingCard briefing={data?.dailyBriefing} />
        </div>

        {/* 4 Card Statistik Berjajar Rapi di Bawah Briefing */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          
          {/* Card 1: Tugas Pending */}
          <div className="bg-card/60 border border-border/70 rounded-xl p-3 flex flex-col justify-between shadow-2xs relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-primary/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tugas Pending</span>
              <CheckSquare className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="mt-1.5">
              <h3 className="text-lg font-bold text-foreground">{stats.pendingTasks}</h3>
              <p className="text-[10px] text-muted-foreground">Perlu diselesaikan</p>
            </div>
          </div>

          {/* Card 2: Total Kebiasaan */}
          <div className="bg-card/60 border border-border/70 rounded-xl p-3 flex flex-col justify-between shadow-2xs relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Kebiasaan</span>
              <Repeat className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="mt-1.5">
              <h3 className="text-lg font-bold text-foreground">{stats.totalHabits}</h3>
              <p className="text-[10px] text-muted-foreground">Rutin harian</p>
            </div>
          </div>

          {/* Card 3: Target Mingguan */}
          <div className="bg-card/60 border border-border/70 rounded-xl p-3 flex flex-col justify-between shadow-2xs relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Target Mingguan</span>
              <Target className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="mt-1.5">
              <h3 className="text-lg font-bold text-foreground">{stats.activeGoals}</h3>
              <p className="text-[10px] text-muted-foreground">Fokus aktif</p>
            </div>
          </div>

          {/* Card 4: Streak Produktif */}
          <div className="bg-card/60 border border-border/70 rounded-xl p-3 flex flex-col justify-between shadow-2xs relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Streak Produktif</span>
              <Flame className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="mt-1.5">
              <h3 className="text-lg font-bold text-foreground">{stats.streak} Hari</h3>
              <p className="text-[10px] text-muted-foreground">Konsistensi total</p>
            </div>
          </div>

        </div>

      </div>

      {/* Bagian Bawah: Agenda, Kebiasaan & Target Aktif */}
      <div className="w-full">
        <div className="bg-card/50 rounded-2xl shadow-2xs border border-border/60 overflow-hidden relative p-3.5 flex flex-col">
          
          <div className="mb-2.5">
            <h2 className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <CheckSquare className="w-3.5 h-3.5 text-primary" /> Agenda, Kebiasaan & Target Aktif
            </h2>
            <p className="text-[10px] text-muted-foreground">Tinjau tugas, kebiasaan, dan target mingguan Anda.</p>
          </div>

          <div className="flex-1 max-h-[340px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
            {!hasItems ? (
              <div className="py-3">
                <EmptyState title="Tidak ada agenda aktif" description="Semua tugas, kebiasaan, dan target hari ini sudah bersih." />
              </div>
            ) : (
              <div className="space-y-3">
                
                {/* Tugas Prioritas */}
                {tasks.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tugas Prioritas</p>
                    {tasks.map((task) => {
                      const isTaskCompleted = task.status === 'completed';
                      return (
                        <div key={task.id} className="flex items-center justify-between p-2 border border-border/70 rounded-xl bg-card hover:border-border transition-all shadow-2xs gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <p className={`text-xs font-medium truncate ${isTaskCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {task.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Deadline: {task.deadline || 'Hari ini'}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5 shrink-0">
                            {task.priority || 'Medium'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Kebiasaan Aktif */}
                {habits.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Daftar Kebiasaan Aktif</p>
                    {habits.map((habit) => {
                      const isCompletedToday = habit.last_checked_date === today;

                      return (
                        <div key={habit.id} className="flex items-center justify-between p-2 border border-border/70 rounded-xl bg-card hover:border-border transition-all shadow-2xs gap-2">
                          <div className="flex items-center space-x-2 min-w-0">
                            <button 
                              onClick={() => handleToggleHabit(habit.id, isCompletedToday)}
                              disabled={isCompletedToday}
                              className={`transition-colors focus:outline-none shrink-0 ${isCompletedToday ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer text-muted-foreground hover:text-primary'}`}
                              title={isCompletedToday ? "Sudah diselesaikan hari ini" : "Tandai selesai"}
                            >
                              {isCompletedToday ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-primary" />
                              )}
                            </button>
                            <div className="space-y-0.5 min-w-0">
                              <p className={`text-xs font-medium truncate ${isCompletedToday ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {habit.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground capitalize">Frekuensi: {habit.frequency}</p>
                            </div>
                          </div>
                          
                          <Badge variant="outline" className="text-[10px] font-semibold bg-orange-500/10 text-orange-600 border-orange-500/20 flex items-center gap-1 px-2 py-0.5 shrink-0">
                            <Flame className="w-3 h-3 text-orange-500" /> {habit.streak || 0} Streak
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Target Mingguan */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Target Mingguan</p>
                  {goals.length === 0 ? (
                    <div className="p-2.5 border border-dashed border-border/80 rounded-xl text-center bg-card/30">
                      <p className="text-xs text-muted-foreground italic">Tidak ada target</p>
                    </div>
                  ) : (
                    goals.map((goal) => (
                      <div key={goal.id} className="flex items-center justify-between p-2 border border-border/70 rounded-xl bg-card hover:border-border transition-all shadow-2xs gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{goal.title}</p>
                          <p className="text-[10px] text-muted-foreground">Batas Waktu: {goal.target_date || 'Minggu Ini'}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-semibold bg-purple-500/10 text-purple-600 border-purple-500/20 flex items-center gap-1 px-2 py-0.5 shrink-0">
                          <Trophy className="w-3 h-3 text-purple-500" /> {goal.progress || 0}%
                        </Badge>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}