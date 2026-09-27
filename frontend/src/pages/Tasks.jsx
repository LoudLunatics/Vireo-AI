import { useEffect, useState, useCallback } from 'react';
import Loading from '@/components/common/Loading';
import TaskForm from '@/components/task/TaskForm';
import TaskList from '@/components/task/TaskList';
import PriorityResult from '@/components/task/PriorityResult';
import ConfirmModal from '@/components/ui/ConfirmModal'; // 🛠️ Import Modal Konfirmasi Kustom
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Plus, X, Filter, CheckSquare } from 'lucide-react';
import { fetchTasks, createTask, prioritizeTasksAI, deleteTask } from '@/services/api'; // ✅ Ditambahkan deleteTask

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // 🛠️ State terpusat untuk Modal Konfirmasi Hapus
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    taskId: null,
    taskTitle: ''
  });
  
  // State untuk Filter Status Tugas (ditambah 'telat')
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'telat', 'completed'

  // 🛠️ Helper untuk mendapatkan format 'YYYY-MM-DD' berdasarkan waktu lokal perangkat (bebas dari offset UTC)
  const getLocalISODate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // State untuk melacak tanggal saat ini (berguna untuk auto-reset tengah malam)
  const [currentDateStr, setCurrentDateStr] = useState(getLocalISODate());

  // Fungsi helper pengecekan tugas telat menggunakan tanggal lokal
  const isTaskOverdue = (deadlineStr, status) => {
    if (status === 'completed') return false;
    if (!deadlineStr) return false;
    
    try {
      const todayStr = getLocalISODate();
      return deadlineStr < todayStr;
    } catch (e) {
      return false;
    }
  };

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetchTasks();
      if (res.success) {
        // Tandai otomatis tugas yang sudah lewat deadline berdasarkan waktu lokal
        const processedTasks = (res.data || []).map(task => ({
          ...task,
          isOverdue: isTaskOverdue(task.deadline, task.status)
        }));
        setTasks(processedTasks);
      }
    } catch (error) {
      console.error('Gagal memuat tugas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();

    // 🚀 LIVE SYNC LISTENER: Mendengarkan sinyal pembaruan data dari AI Assistant Chat
    const handleDataUpdate = () => {
      loadTasks();
    };
    window.addEventListener('vireo-data-updated', handleDataUpdate);

    // 🛠️ AUTO-RESET TIMER: Mengecek setiap 30 detik apakah hari sudah berganti (lewat 00:00)
    const midnightInterval = setInterval(() => {
      const newDateStr = getLocalISODate();
      if (newDateStr !== currentDateStr) {
        setCurrentDateStr(newDateStr);
        loadTasks();
      }
    }, 30000); // Cek tiap 30 detik

    return () => {
      window.removeEventListener('vireo-data-updated', handleDataUpdate);
      clearInterval(midnightInterval);
    };
  }, [currentDateStr, loadTasks]);

  const handleTaskCreated = async (taskData) => {
    try {
      const res = await createTask(taskData);
      if (res.success) {
        setShowAddModal(false);
        await loadTasks();
      }
    } catch (error) {
      console.error('Gagal menambahkan tugas:', error);
    }
  };

  const handlePrioritizeAI = async () => {
    if (tasks.length === 0) {
      alert('Tambahkan minimal satu tugas terlebih dahulu.');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await prioritizeTasksAI();
      if (res.success) {
        setAiAnalysis(res.analysis || '');
        await loadTasks();
      } else {
        alert(res.message || 'Gagal memproses prioritas AI.');
      }
    } catch (error) {
      console.error('Gagal memproses prioritas AI:', error);
      alert('Terjadi kesalahan saat menganalisis prioritas.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Logika penyaringan tugas berdasarkan filter (termasuk filter 'telat')
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === 'pending') return task.status === 'pending' && !task.isOverdue;
    if (statusFilter === 'telat') return task.isOverdue;
    if (statusFilter === 'completed') return task.status === 'completed';
    return true; // 'all'
  });

  if (loading) {
    return <Loading text="Memuat tugas..." />;
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full pb-6 px-2 md:px-0 relative pt-0 mt-0">
      
      {/* Header + Tombol Aksi Cepat */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2.5 border-b border-border/70 gap-2">
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-primary" /> Tasks Management
          </h1>
          <p className="text-[11px] text-muted-foreground">Tambah tugas harian, lalu biarkan agen AI membantu menentukan prioritas.</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            onClick={() => setShowAddModal(true)}
            className="gap-1 h-7 text-xs px-2.5 rounded-lg cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Tugas Baru
          </Button>

          <Button
            onClick={handlePrioritizeAI}
            disabled={analyzing || tasks.length === 0}
            variant="outline"
            className="gap-1 h-7 text-xs px-2.5 rounded-lg cursor-pointer border-border/80 shadow-2xs hover:bg-primary/5 hover:text-primary transition-all"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Menganalisis...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Prioritaskan dengan AI
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Bar Filter Status Tugas Lengkap (Termasuk Filter "Telat") */}
      <div className="flex flex-wrap items-center gap-1 bg-card/60 p-1 rounded-xl border border-border/60 w-fit shadow-2xs">
        <span className="text-[10px] font-semibold text-muted-foreground px-2 flex items-center gap-1">
          <Filter className="w-3 h-3 text-primary" /> Filter:
        </span>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            statusFilter === 'all' ? 'bg-primary text-primary-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          Semua ({tasks.length})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            statusFilter === 'pending' ? 'bg-primary text-primary-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          Pending ({tasks.filter(t => t.status === 'pending' && !t.isOverdue).length})
        </button>
        <button
          onClick={() => setStatusFilter('telat')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            statusFilter === 'telat' ? 'bg-destructive text-destructive-foreground shadow-xs font-semibold' : 'text-destructive/80 hover:text-destructive hover:bg-destructive/10'
          }`}
        >
          Telat ({tasks.filter(t => t.isOverdue).length})
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            statusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          Selesai ({tasks.filter(t => t.status === 'completed').length})
        </button>
      </div>

      {/* POP-UP MODAL CARD TAMBAH TUGAS */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl shadow-xl border border-border/80 p-5 w-full max-w-md relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute -right-6 -top-6 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-primary" /> Tambah Tugas Baru
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <TaskForm onTaskCreated={handleTaskCreated} />
          </div>
        </div>
      )}

      {/* Content Layout Bento Grid 2 Kolom Seimbang dengan Efek Glow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        
        {/* Kolom Kiri: Daftar Tugas Aktif (Lebih Luas - 7 Kolom) */}
        <div className="w-full lg:col-span-7 bg-card/40 rounded-2xl border border-border/60 p-4 relative overflow-hidden shadow-2xs">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
          <TaskList 
            tasks={filteredTasks} 
            onRefresh={loadTasks} 
            statusFilter={statusFilter} 
            // 🛠️ Meneruskan fungsi trigger modal hapus ke TaskList
            onRequestDelete={(id, title) => setDeleteModal({ isOpen: true, taskId: id, taskTitle: title })}
          />
        </div>

        {/* Kolom Kanan: Hasil Analisis AI (Lebih Ringkas & Pas - 5 Kolom) */}
        <div className="w-full lg:col-span-5 bg-card/40 rounded-2xl border border-primary/20 p-4 relative overflow-hidden bg-gradient-to-br from-primary/5 via-card/40 to-card shadow-2xs">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
          <PriorityResult analysis={aiAnalysis} />
        </div>
        
      </div>

      {/* 🛠️ KOMPONEN MODAL KONFIRMASI KUSTOM (Menggantikan window.confirm bawaan browser) */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Konfirmasi Hapus Tugas"
        message={`Apakah Anda yakin ingin menghapus tugas "${deleteModal.taskTitle || 'ini'}"?`}
        onConfirm={async () => {
          try {
            // ✅ Memanggil fungsi API delete yang sebenarnya ke backend
            const res = await deleteTask(deleteModal.taskId);
            if (res.success) {
              setDeleteModal({ isOpen: false, taskId: null, taskTitle: '' });
              await loadTasks();
            } else {
              alert(res.message || 'Gagal menghapus tugas.');
            }
          } catch (error) {
            console.error('Gagal menghapus tugas:', error);
          }
        }}
        onCancel={() => setDeleteModal({ isOpen: false, taskId: null, taskTitle: '' })}
      />

    </div>
  );
}