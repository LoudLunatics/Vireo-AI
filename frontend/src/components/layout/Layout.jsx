import { useState } from 'react';
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
            {/* Navbar di atas */}
            <Navbar onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
            
            {/* Ubah pt-14 menjadi pt-0 agar langsung merapat ke bawah navbar */}
            <div className="flex flex-1 overflow-hidden relative pt-0">
                {/* Backdrop gelap di HP saat sidebar terbuka */}
                {isSidebarOpen && (
                    <div 
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-xs transition-opacity"
                    />
                )}

                {/* Sidebar */}
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                {/* Konten Utama: Berikan padding atas secukupnya (misal: pt-4 atau pt-3) di sini agar rapat dengan navbar */}
                <main className="flex-1 px-4 md:px-6 pt-3 md:pt-4 pb-6 overflow-y-auto max-w-7xl mx-auto w-full md:ml-64">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}