"use client";

import React from "react";
import { Database, Plus, Upload, Loader2, FileDown, Trash2, Copy } from "lucide-react";
import { ProfileRecord, ProfileInput } from "@/lib/types";

interface ProfileListProps {
  profiles: ProfileRecord[];
  selectedProfileId: string | null;
  loading: boolean;
  onSelectProfile: (profile: ProfileRecord) => void;
  onCloneProfile: (profile: ProfileRecord) => void;
  onStartAdd: () => void;
  onOpenImportCSV: () => void;
  onExportCSV: (profile: ProfileRecord | ProfileInput) => void;
  onDeleteProfile: (id: string, name: string) => void;
}

export const ProfileList: React.FC<ProfileListProps> = ({
  profiles,
  selectedProfileId,
  loading,
  onSelectProfile,
  onCloneProfile,
  onStartAdd,
  onOpenImportCSV,
  onExportCSV,
  onDeleteProfile,
}) => {
  return (
    <div className="w-full md:w-[38%] border-r border-slate-200 dark:border-zinc-800 flex flex-col min-h-0 bg-slate-50/30 dark:bg-zinc-950/40">
      {/* Action Bar: Profile count, Import CSV & Add */}
      <div className="p-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-1.5 flex-wrap">
        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
          Profil ({profiles.length})
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenImportCSV}
            title="Import kredensial dari file CSV (Wasabi / AWS standard)"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 shadow-xs transition"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import CSV</span>
          </button>
          <button
            type="button"
            onClick={onStartAdd}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Profiles Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-xs">Memuat profil dari SQLite...</span>
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4 border border-dashed border-slate-300 dark:border-zinc-800 rounded-xl">
            <Database className="h-8 w-8 text-slate-400/50 mb-2" />
            <p className="text-xs font-medium text-slate-600 dark:text-zinc-400">
              Belum ada profil tersimpan.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
              Klik tombol &apos;+ Tambah&apos; atau &apos;Import CSV&apos; untuk menambahkan profil kredensial Wasabi / S3.
            </p>
          </div>
        ) : (
          profiles.map((p) => {
            const isSelected = selectedProfileId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => onSelectProfile(p)}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
                    : "border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 hover:border-slate-300 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isSelected ? "bg-blue-500" : "bg-slate-400 dark:bg-zinc-600"
                        }`}
                      />
                      {p.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5 font-mono">
                      {p.bucket_name ? `Bucket: ${p.bucket_name}` : "(Belum ada bucket default)"}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                      {p.endpoint_url} ({p.region})
                    </p>
                  </div>

                  {/* Card Action Icons (Clone, Export CSV & Delete) */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloneProfile(p);
                      }}
                      title="Clone / Duplikasi profil ini"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExportCSV(p);
                      }}
                      title="Export profil ini ke file CSV"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProfile(p.id, p.name);
                      }}
                      title="Hapus profil dari database"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
