import { useState, useEffect } from "react";
import { Calendar, Menu, X } from "lucide-react";

export default function Navbar({ onToggleSidebar, isSidebarOpen }) {
    const [currentDate, setCurrentDate] = useState("");

    useEffect(() => {
        // Menghasilkan format tanggal lokal yang aman dari hydration mismatch
        const formattedDate = new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        setCurrentDate(formattedDate);
    }, []);

    return (
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center space-x-3">
                {/* Tombol Menu Mobile (Toggle Hide/Show Sidebar) */}
                <button 
                    onClick={onToggleSidebar}
                    className="p-2 -ml-2 text-muted-foreground hover:text-foreground md:hidden rounded-lg hover:bg-muted/50 transition-colors focus:outline-none cursor-pointer"
                    aria-label="Toggle Sidebar"
                >
                    {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* Logo Gambar yang Berubah Otomatis Sesuai Dark / Light Mode */}
                <div className="flex items-center">
                    {/* Logo untuk Light Mode (Tampil saat mode terang) */}
                    <img 
                        src="/vireo_light_mode.png" 
                        alt="Vireo AI Light Logo" 
                        className="h-6 md:h-7 w-auto block dark:hidden object-contain"
                    />
                    {/* Logo untuk Dark Mode (Tampil saat mode gelap) */}
                    <img 
                        src="/vireo_dark_mode.png" 
                        alt="Vireo AI Dark Logo" 
                        className="h-6 md:h-7 w-auto hidden dark:block object-contain"
                    />
                </div>
            </div>
            
            <div className="flex items-center space-x-2 text-xs md:text-sm text-muted-foreground font-medium">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <span className="hidden sm:inline capitalize">{currentDate}</span>
            </div>
        </header>
    );
}