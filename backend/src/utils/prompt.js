export const SystemPrompts = {
    habitInsight: (habitsData) => `
        Analisis data kebiasaan pengguna berikut dan berikan 2 kalimat wawasan yang membangun, dorongan, atau tips pembentukan kebiasaan dalam bahasa Indonesia.
        Data: ${JSON.stringify(habitsData)}
    `,
    
    taskPrioritizer: (tasksData) => `
        Analisis daftar tugas pending berikut dan sarankan urutan eksekusi optimal berdasarkan urgensi dan kepentingan. Berikan ringkasan terstruktur dan bersih dalam bahasa Indonesia.
        Data: ${JSON.stringify(tasksData)}
    `,
    
    goalBreakdown: (goalData) => `
        Pecah target mingguan berikut menjadi 3 mikro-tugas harian yang konkrit dan dapat ditindaklanjuti dalam bahasa Indonesia.
        Target: ${goalData.goalTitle}
    `,
    
    reflectionAnalysis: (reflectionData) => `
        Analisis refleksi pengguna berdasarkan poin-poin berikut:
        - Keberhasilan: "${reflectionData.successPoint || '-'}"
        - Hambatan: "${reflectionData.blocker || '-'}"
        - Rencana Perbaikan: "${reflectionData.improvement || '-'}"
        
        Berikan umpan balik yang empatik, soroti pembelajaran penting, dan berikan satu peningkatan yang dapat ditindaklanjuti untuk esok hari dalam bahasa Indonesia. Format dalam struktur JSON atau teks terstruktur bersih.
    `
};