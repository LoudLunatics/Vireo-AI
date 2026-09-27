import React from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 p-4">
      <div className="w-full max-w-md p-6 bg-card border border-border rounded-2xl shadow-2xl text-card-foreground animate-in zoom-in-95 duration-200">
        <h3 className="text-base font-bold text-foreground mb-2">
          {title || "Konfirmasi Hapus"}
        </h3>
        <p className="text-xs text-muted-foreground mb-6">
          {message || "Apakah Anda yakin ingin menghapus item ini?"}
        </p>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground bg-muted/60 hover:bg-muted hover:text-foreground rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-3.5 py-1.5 text-xs font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}