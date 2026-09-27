import { useMemo, useState, useEffect } from 'react';

export default function HabitHeatmap({ historyData = {}, totalHabits = 0 }) {
    // State untuk mendeteksi lebar layar agar jumlah hari bisa menyesuaikan otomatis
    const [daysCount, setDaysCount] = useState(180);

    useEffect(() => {
        const handleResize = () => {
            // Jika di bawah layar 640px (HP), tampilkan 90 hari, jika komputer tampilkan 180 hari penuh
            if (window.innerWidth < 640) {
                setDaysCount(90);
            } else {
                setDaysCount(180);
            }
        };

        handleResize(); // Cek saat pertama render
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Helper untuk menghasilkan format YYYY-MM-DD berdasarkan waktu lokal perangkat
    const getLocalISODate = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Mempersiapkan data hari dan label bulan berdasarkan jumlah hari responsif
    const { days, months, totalWeeks } = useMemo(() => {
        const arr = [];
        const today = new Date();
        const monthLabels = [];
        let lastMonth = -1;

        // Tentukan tanggal mulai (mundur sebanyak daysCount hari)
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - daysCount);

        // Geser ke hari Minggu terdekat di awal agar grid rata sejajar mingguan (seperti GitHub)
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);

        const targetTime = today.getTime();
        let curr = new Date(startDate);

        while (curr.getTime() <= targetTime) {
            const dateStr = getLocalISODate(curr);
            const completedCount = historyData[dateStr] || 0;
            const monthIndex = curr.getMonth();

            // Mendeteksi perubahan bulan untuk label di atas grid
            if (monthIndex !== lastMonth) {
                monthLabels.push({
                    month: curr.toLocaleString('id-ID', { month: 'short' }),
                    weekIndex: Math.floor(arr.length / 7)
                });
                lastMonth = monthIndex;
            }

            arr.push({ date: dateStr, count: completedCount, dayObj: new Date(curr) });
            curr.setDate(curr.getDate() + 1);
        }

        const weeks = Math.ceil(arr.length / 7);
        return { days: arr, months: monthLabels, totalWeeks: weeks };
    }, [historyData, daysCount]);

    // 🛠️ Logika Warna Dinamis Berdasarkan Rasio Penyelesaian
    const getColorClass = (count) => {
        if (count === 0 || totalHabits === 0) {
            return "bg-muted/60 hover:bg-muted/80"; 
        }

        const ratio = count / totalHabits;

        if (ratio === 1) {
            return "bg-emerald-600 hover:bg-emerald-500 ring-2 ring-emerald-600/20"; 
        } else if (ratio >= 0.75) {
            return "bg-emerald-500 hover:bg-emerald-400"; 
        } else if (ratio >= 0.4) {
            return "bg-emerald-500/60 hover:bg-emerald-500/80"; 
        } else {
            return "bg-emerald-500/30 hover:bg-emerald-500/50"; 
        }
    };

    // Format tanggal untuk tooltip menggunakan standar bahasa Indonesia
    const formatDateReadable = (dateStr) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', options);
    };

    return (
        <div className="bg-card/40 border border-border/60 rounded-2xl p-4 sm:p-6 space-y-4 shadow-2xs backdrop-blur-xs w-full overflow-hidden relative">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />

            {/* Header Heatmap */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2 flex-wrap">
                        Konsistensi Habit 
                        <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {days.length} Hari Terakhir
                        </span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Visualisasi kontribusi harian dari kebiasaan Anda.</p>
                </div>

                {/* Legenda Indikator */}
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-xl border border-border/40 self-start sm:self-auto">
                    <span>Kurang</span>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-xs bg-muted/60" />
                        <div className="w-3 h-3 rounded-xs bg-emerald-500/30" />
                        <div className="w-3 h-3 rounded-xs bg-emerald-500/60" />
                        <div className="w-3 h-3 rounded-xs bg-emerald-600" />
                    </div>
                    <span>Lebih</span>
                </div>
            </div>

            {/* Grid Kontribusi Heatmap dengan Penataan Center di Komputer & Scroll Halus di HP */}
            <div className="w-full overflow-x-auto pb-2 pt-1 scrollbar-thin flex justify-start lg:justify-center">
                <div className="inline-block min-w-max space-y-2">
                    
                    {/* Baris Label Bulan */}
                    <div className="flex text-[10px] text-muted-foreground font-medium pl-6 relative h-4" style={{ width: `${totalWeeks * 18}px` }}>
                        {months.map((m, idx) => (
                            <span 
                                key={idx} 
                                className="absolute truncate"
                                style={{ left: `${m.weekIndex * 18}px` }} 
                            >
                                {m.month}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-start gap-2">
                        {/* Label Hari di Sisi Kiri (Senin, Rabu, Jumat) */}
                        <div className="grid grid-rows-7 text-[10px] text-muted-foreground h-[116px] pr-1 select-none leading-[16px] shrink-0">
                            <span className="h-3"></span>
                            <span className="h-3 font-medium">Sen</span>
                            <span className="h-3"></span>
                            <span className="h-3 font-medium">Rabu</span>
                            <span className="h-3"></span>
                            <span className="h-3 font-medium">Jum</span>
                            <span className="h-3"></span>
                        </div>

                        {/* Kotak-kotak Grid Heatmap */}
                        <div 
                            className="grid grid-flow-col grid-rows-7 gap-1.5"
                            style={{ gridTemplateColumns: `repeat(${totalWeeks}, minmax(0, 1fr))` }}
                        >
                            {days.map((day, idx) => (
                                <div
                                    key={idx}
                                    tabIndex={0}
                                    aria-label={`${day.date}: ${day.count} dari ${totalHabits} selesai`}
                                    className={`w-3.5 h-3.5 rounded-sm transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${getColorClass(day.count)}`}
                                    title={`${formatDateReadable(day.date)}: ✅ ${day.count}/${totalHabits} Selesai`}
                                />
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}