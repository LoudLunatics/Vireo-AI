import { useEffect, useState, useCallback } from 'react';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import { History as HistoryIcon, Trash2, Sparkles, Calendar, Clock, ChevronLeft, ChevronRight, Eye, X, Target, CheckSquare, Repeat, BookOpen } from 'lucide-react';
import { fetchUnifiedHistory } from '@/services/api';
import { Button } from '@/components/ui/button';

export default function History() {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Pagination & Detail Modal (Diubah menjadi 10 item per halaman)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedItem, setSelectedItem] = useState(null);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetchUnifiedHistory();
      if (res.success) {
        setHistoryList(res.data || []);
      }
    } catch (error) {
      console.error('Gagal memuat pusat riwayat aktivitas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadDataSafe = async () => {
      if (isMounted) {
        await loadHistory();
      }
    };

    loadDataSafe();

    // 🚀 LIVE SYNC LISTENER: Mendengarkan sinyal pembaruan data dari AI Assistant Chat
    const handleDataUpdate = () => {
      if (isMounted) {
        loadHistory();
      }
    };
    window.addEventListener('vireo-data-updated', handleDataUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('vireo-data-updated', handleDataUpdate);
    };
  }, [loadHistory]);

  // Fungsi Hapus Item Berdasarkan Tipe dan ID Asli
  const handleDelete = async (item, e) => {
    e.stopPropagation();
    if (!window.confirm(`Yakin ingin menghapus item ${item.type} ini dari database?`)) return;

    try {
      let endpoint = '';
      if (item.type === 'reflection') endpoint = `http://localhost:5000/api/reflections/${item.originalId}`;
      else if (item.type === 'task') endpoint = `http://localhost:5000/api/tasks/${item.originalId}`;
      else if (item.type === 'goal') endpoint = `http://localhost:5000/api/goals/${item.originalId}`;
      else if (item.type === 'habit') endpoint = `http://localhost:5000/api/habits/${item.originalId}`;

      if (!endpoint) return;

      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();

      if (data.success || res.ok) {
        setHistoryList((prev) => prev.filter((i) => i.id !== item.id));
        if (selectedItem?.id === item.id) setSelectedItem(null);
      } else {
        alert('Gagal menghapus item.');
      }
    } catch (error) {
      console.error('Gagal menghapus:', error);
      alert('Terjadi kesalahan saat menghapus.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Baru saja';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'goal':
        return { label: 'Target', icon: <Target className="w-3 h-3 text-purple-500" />, bg: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };
      case 'task':
        return { label: 'Tugas', icon: <CheckSquare className="w-3 h-3 text-blue-500" />, bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      case 'habit':
        return { label: 'Habit', icon: <Repeat className="w-3 h-3 text-emerald-500" />, bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
      case 'reflection':
        return { label: 'Refleksi', icon: <BookOpen className="w-3 h-3 text-amber-500" />, bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
      default:
        return { label: 'Aktivitas', icon: <Sparkles className="w-3 h-3 text-primary" />, bg: 'bg-primary/10 text-primary border-primary/20' };
    }
  };

  const totalPages = Math.ceil(historyList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = historyList.slice(startIndex, startIndex + itemsPerPage);

  if (loading) return <Loading text="Memuat pusat riwayat aktivitas..." />;

  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full pb-6 px-2 sm:px-0">
      
      {/* Header Halaman Lebih Rapat */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/70 gap-2">
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight flex items-center gap-1.5">
            <HistoryIcon className="w-4 h-4 text-primary shrink-0" /> Pusat Riwayat Aktivitas
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Rekam jejak seluruh target, tugas, kebiasaan, dan catatan refleksi Anda dalam satu linimasa.
          </p>
        </div>
      </div>

      {historyList.length === 0 ? (
        <div className="bg-card/40 rounded-2xl border border-border/60 p-6 shadow-2xs">
          <EmptyState
            title="Belum ada riwayat aktivitas"
            description="Aktivitas yang Anda buat di Goal, Task, Habit, atau Refleksi akan otomatis tercatat rapi di sini."
          />
        </div>
      ) : (
        <>
          {/* Daftar List Lebih Rapat & Padat (Compact List) */}
          <div className="grid grid-cols-1 gap-2">
            {currentItems.map((item) => {
              const badge = getTypeBadge(item.type);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="bg-card/50 hover:bg-card border border-border/70 hover:border-primary/50 rounded-xl p-3 transition-all shadow-2xs relative overflow-hidden group cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-2.5"
                >
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none group-hover:bg-primary/10 transition-all" />

                  {/* Kiri: Badge, Tanggal & Teks Ringkas */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className={`flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded border ${badge.bg} shrink-0`}>
                        {badge.icon} {badge.label}
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3 text-primary" />
                        {formatDate(item.created_at)}
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatTime(item.created_at)} WIB
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-foreground truncate pr-2">
                      {item.title}
                    </p>
                  </div>

                  {/* Kanan: Tombol Detail & Hapus */}
                  <div className="flex items-center justify-end gap-2 shrink-0 pt-1.5 md:pt-0 border-t md:border-t-0 border-border/40">
                    <span className="text-[11px] text-primary font-medium flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-md">
                      <Eye className="w-3 h-3" /> Detail
                    </span>
                    <button
                      onClick={(e) => handleDelete(item, e)}
                      className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      title="Hapus Aktivitas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigasi Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-2">
              <p className="text-[11px] text-muted-foreground text-center sm:text-left">
                Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, historyList.length)} dari {historyList.length} aktivitas
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-7 text-xs rounded-lg cursor-pointer px-2.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Sebelumnya
                </Button>
                <span className="text-xs font-medium text-foreground px-2">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-7 text-xs rounded-lg cursor-pointer px-2.5"
                >
                  Selanjutnya <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* POP-UP MODAL DETAIL AKTIVITAS */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl p-4 w-full max-w-xl shadow-xl border border-border relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="absolute -right-8 -top-8 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header Modal */}
            <div className="flex items-center justify-between pb-2.5 border-b border-border/60 mb-3 gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded border ${getTypeBadge(selectedItem.type).bg}`}>
                  {getTypeBadge(selectedItem.type).icon} {getTypeBadge(selectedItem.type).label}
                </span>
                <span>{formatDate(selectedItem.created_at)} - {formatTime(selectedItem.created_at)} WIB</span>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Konten Detail Modal */}
            <div className="space-y-3 overflow-y-auto pr-1 flex-1 text-left text-xs">
              <div className="space-y-1">
                <h4 className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Judul / Catatan Utama:</h4>
                <div className="bg-background/60 p-3 rounded-xl border border-border/70 text-foreground font-medium leading-relaxed whitespace-pre-line">
                  {selectedItem.title}
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Informasi Tambahan:</h4>
                <div className="bg-muted/50 p-3 rounded-xl border border-border/60 text-foreground leading-relaxed">
                  {selectedItem.subtitle}
                </div>
              </div>

              {selectedItem.analysis && (
                <div className="space-y-1 pt-1">
                  <h4 className="font-bold text-primary uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Analisis AI Assistant:
                  </h4>
                  <div className="bg-muted/50 p-3 rounded-xl border border-border/60 text-muted-foreground leading-relaxed whitespace-pre-line">
                    {selectedItem.analysis}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-between pt-3 border-t border-border/60 mt-3">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={(e) => handleDelete(selectedItem, e)}
                className="rounded-xl h-7 text-xs cursor-pointer gap-1"
              >
                <Trash2 className="w-3 h-3" /> Hapus Item
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedItem(null)} 
                className="rounded-xl h-7 text-xs cursor-pointer"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}