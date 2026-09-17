"use client";

import React from "react";
import { Database, Plus, Upload } from "lucide-react";

interface ProfileEmptyStateProps {
  onStartAdd: () => void;
  onOpenImportCSV: () => void;
}

export const ProfileEmptyState: React.FC<ProfileEmptyStateProps> = ({
  onStartAdd,
  onOpenImportCSV,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 mb-4 text-slate-400 dark:text-zinc-500 shadow-sm">
        <Database className="h-8 w-8" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
        Pilih Profil atau Buat Profil Baru
      </h3>
      <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
        Pilih salah satu profil dari daftar di sebelah kiri untuk melihat atau mengedit kredensial, atau klik tombol di bawah untuk menambah profil baru.
      </p>
      <div className="flex items-center gap-2 mt-5">
        <button
          type="button"
          onClick={onStartAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition"
        >
          <Plus className="h-4 w-4" />
          <span>+ Buat Profil Baru</span>
        </button>
        <button
          type="button"
          onClick={onOpenImportCSV}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold transition"
        >
          <Upload className="h-4 w-4 text-emerald-500" />
          <span>Import dari CSV</span>
        </button>
      </div>
    </div>
  );
};
