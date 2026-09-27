import { NavLink } from "react-router-dom";
import { LayoutDashboard, CheckSquare, Target, Repeat, BookOpen, History, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

export default function Sidebar({ isOpen, onClose }) {
    const [isDark, setIsDark] = useState(false);

    // Sinkronisasi status awal tombol light/dark dengan class di root HTML
    useEffect(() => {
        const isDarkModeActive = document.documentElement.classList.contains('dark');
        setIsDark(isDarkModeActive);
    }, []);

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle('dark');
    };

    const navItems = [
        { name: "Dashboard", path: "/", icon: LayoutDashboard },
        { name: "Tasks", path: "/tasks", icon: CheckSquare },
        { name: "Habits", path: "/habits", icon: Repeat },
        { name: "Goals", path: "/goals", icon: Target },
        { name: "Reflection", path: "/reflection", icon: BookOpen },
        { name: "History", path: "/history", icon: History },
    ];

    return (
        <>
            {/* Backdrop / Overlay gelap di HP saat sidebar terbuka */}
            {isOpen && (
                <div 
                    onClick={onClose}
                    className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-xs transition-opacity"
                />
            )}

            {/* Sidebar menempel tetap di kiri layar */}
            <aside className={`
                fixed left-0 top-16 z-30 w-64 border-r border-border/60 bg-card/95 md:bg-card/90 backdrop-blur-md 
                flex flex-col justify-between p-4 select-none transition-transform duration-300 ease-in-out shadow-xl md:shadow-none
                h-[calc(100vh-4rem)] overflow-y-auto
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Bagian Atas: Theme Switcher & Menu */}
                <div className="space-y-6">
                    {/* Theme Switcher (Light / Dark) */}
                    <div className="mx-2 p-1 rounded-xl bg-muted/70 border border-border/60 flex items-center justify-between">
                        <button
                            onClick={toggleTheme}
                            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                !isDark ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                            <span>Light</span>
                        </button>
                        <button
                            onClick={toggleTheme}
                            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                isDark ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Moon className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Dark</span>
                        </button>
                    </div>

                    {/* Navigasi Menu */}
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === "/"}
                                    onClick={onClose} // Otomatis menutup sidebar di HP saat menu diklik
                                    className={({ isActive }) =>
                                        `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold"
                                                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                        }`
                                    }
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span>{item.name}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                </div>
            </aside>
        </>
    );
}