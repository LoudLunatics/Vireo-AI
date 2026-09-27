/**
 * Komponen Skeleton Loader yang dapat digunakan kembali untuk placeholder loading.
 * 
 * @param {Object} props
 * @param {string} props.className - Kelas tambahan Tailwind untuk mengatur lebar, tinggi, dan bentuk.
 * @param {boolean} [props.shimmer=true] - Mengaktifkan efek kilau cahaya (shimmer) modern.
 */
export function Skeleton({ className = "", shimmer = true }) {
    return (
        <div 
            aria-hidden="true"
            className={`
                relative overflow-hidden rounded-xl 
                bg-muted-foreground/15 dark:bg-muted/40 
                ${shimmer ? "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent dark:before:via-white/10" : "animate-pulse"}
                ${className}
            `} 
        />
    );
}