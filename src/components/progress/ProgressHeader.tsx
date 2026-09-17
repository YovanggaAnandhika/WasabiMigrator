"use client";

import React from "react";
import { Zap, Radio, Play, Square } from "lucide-react";
import { ProgressEvent } from "@/lib/types";

interface ProgressHeaderProps {
  progress: ProgressEvent;
  isSameHost: boolean;
  isSameBucket: boolean;
  isSourceVerified: boolean;
  isTargetVerified: boolean;
  isMigrating: boolean;
  disabled: boolean;
  onStart: () => void;
  onCancel: () => void;
}

export const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  progress,
  isSameHost,
  isSameBucket,
  isSourceVerified,
  isTargetVerified,
  isMigrating,
  disabled,
  onStart,
  onCancel,
}) => {
  const isBothVerified = isSourceVerified && isTargetVerified;

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800/80 pb-4">
      {/* Dynamic Mode Badge / Warning Badge */}
      <div className="flex items-center gap-2.5">
        {isSameBucket ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Radio className="h-4 w-4 text-rose-500 animate-pulse" />
            <div>
              <span className="text-xs font-bold tracking-wide">
                PERINGATAN: SOURCE & DESTINATION SAMA
              </span>
              <span className="hidden sm:inline text-[11px] text-rose-600/80 dark:text-rose-400/80 ml-2">
                • Pilih profil atau bucket yang berbeda untuk migrasi
              </span>
            </div>
          </div>
        ) : isMigrating ? (
          progress.transfer_mode === "server_side_copy" ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <Zap className="h-4 w-4 text-emerald-500 dark:text-emerald-400 fill-emerald-500 dark:fill-emerald-400 animate-pulse" />
              <div>
                <span className="text-xs font-bold tracking-wide">
                  SERVER-SIDE COPY (0% Local Bandwidth)
                </span>
                <span className="hidden sm:inline text-[11px] text-emerald-600/80 dark:text-emerald-400/80 ml-2">
                  • Transfer internal cloud aktif
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <Radio className="h-4 w-4 text-amber-500 dark:text-amber-400 animate-pulse" />
              <div>
                <span className="text-xs font-bold tracking-wide">
                  CLIENT STREAMING RELAY
                </span>
                <span className="hidden sm:inline text-[11px] text-amber-600/80 dark:text-amber-400/80 ml-2">
                  • Streaming transfer via RAM buffer
                </span>
              </div>
            </div>
          )
        ) : !isBothVerified ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
            <Radio className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            <div>
              <span className="text-xs font-medium tracking-wide">
                {!isSourceVerified && !isTargetVerified
                  ? "Wajib uji koneksi Source & Destination bucket sebelum migrasi"
                  : !isSourceVerified
                  ? "Wajib uji koneksi Source bucket berhasil terlebih dahulu"
                  : "Wajib uji koneksi Destination bucket berhasil terlebih dahulu"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
            <Zap className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            <div>
              <span className="text-xs font-semibold tracking-wide">
                Koneksi Terverifikasi: {isSameHost ? "Auto-Detect Server-Side Copy" : "Client Streaming Relay"} (Siap Mulai)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 w-full md:w-auto">
        {!isMigrating ? (
          <button
            type="button"
            disabled={disabled || isSameBucket || !isBothVerified}
            onClick={onStart}
            title={
              isSameBucket
                ? "Tidak bisa migrasi: Profil Source dan Destination sama"
                : !isBothVerified
                ? "Wajib lakukan 'Test Connection' dan pastikan berhasil pada kedua bucket"
                : undefined
            }
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed disabled:saturate-50"
          >
            <Play className="h-4 w-4 fill-white" />
            Mulai Migrasi Bucket
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/15 px-6 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-300 hover:bg-rose-500/25 active:scale-[0.98] transition shadow-md shadow-rose-500/10"
          >
            <Square className="h-4 w-4 fill-rose-500 dark:fill-rose-400" />
            Hentikan Migrasi (Cancel)
          </button>
        )}
      </div>
    </div>
  );
};
