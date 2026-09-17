"use client";

import React from "react";
import { Database, HardDrive, X } from "lucide-react";

interface ProfileModalHeaderProps {
  dbPath: string;
  onClose: () => void;
}

export const ProfileModalHeader: React.FC<ProfileModalHeaderProps> = ({ dbPath, onClose }) => {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 px-6 py-4 shrink-0 bg-slate-50/50 dark:bg-zinc-900/40">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-500">
          <Database className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Manajemen Profil Kredensial (SQLite Database)
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate max-w-lg" title={dbPath}>
              Lokasi DB: {dbPath || "Memuat..."}
            </span>
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
