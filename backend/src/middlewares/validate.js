import { z } from 'zod';

export const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: "Validasi data gagal.",
                    errors: (error.issues || error.errors).map(e => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                });
            }
            next(error);
        }
    };
};

// Skema validasi entitas Task
export const taskSchema = z.object({
    body: z.object({
        title: z.string({ required_error: "Judul tugas wajib diisi" }).min(3, "Judul terlalu pendek"),
        deadline: z.string().optional(),
        priority: z.enum(['High', 'Medium', 'Low']).optional()
    })
});

// Skema validasi entitas Habit
export const habitSchema = z.object({
    body: z.object({
        title: z.string({ required_error: "Nama kebiasaan wajib diisi" }).min(2, "Nama kebiasaan terlalu pendek"),
        frequency: z.string().optional()
    })
});

// Skema validasi entitas Goal
export const goalSchema = z.object({
    body: z.object({
        title: z.string({ required_error: "Target mingguan wajib diisi" }).min(3, "Target terlalu pendek"),
        target_date: z.string().optional()
    })
});

// [UPDATE] Skema validasi Weekly Reflection disesuaikan dengan 3 input form di frontend
export const reflectionSchema = z.object({
    body: z.object({
        successPoint: z.string().optional(),
        blocker: z.string().optional(),
        improvement: z.string().optional()
    })
});