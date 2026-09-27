export const errorHandler = (err, req, res, next) => {
    console.error("❌ Internal Server Error:", err.stack || err.message);
    
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Terjadi kesalahan pada server.",
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};