"use client";

import React from "react";
import {
  Zap,
  Radio,
  Play,
  Square,
  CheckCircle2,
  FileCheck2,
  FileX2,
  Layers,
  HardDrive,
  Loader2,
} from "lucide-react";
import { ProgressEvent } from "@/lib/types";

interface ProgressBarProps {
  progress: ProgressEvent;
  isSameHost: boolean;
  onStart: () => void;
  onCancel: () => void;
  isMigrating: boolean;
  disabled?: boolean;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  isSameHost,
  onStart,
  onCancel,
  isMigrating,
  disabled = false,
}) => {
  const percent =
    progress.total_files > 0
      ? Math.min(
          100,
          Math.round(
            ((progress.copied_files + progress.skipped_files) /
              progress.total_files) *
              100
          )
        )
      : progress.status === "completed"
      ? 100
      : 0;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 backdrop-blur-xl p-5 shadow-lg dark:shadow-2xl space-y-4">
      {/* Top Banner: Mode & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800/80 pb-4">
        {/* Dynamic Mode Badge */}
        <div className="flex items-center gap-2.5">
          {isSameHost ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <Zap className="h-4 w-4 text-emerald-500 dark:text-emerald-400 fill-emerald-500 dark:fill-emerald-400 animate-pulse" />
              <div>
                <span className="text-xs font-bold tracking-wide">
                  SERVER-SIDE COPY (0% Local Bandwidth)
                </span>
                <span className="hidden sm:inline text-[11px] text-emerald-600/80 dark:text-emerald-400/80 ml-2">
                  • Transfer langsung di datacenter cloud
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <Radio className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              <div>
                <span className="text-xs font-bold tracking-wide">
                  CLIENT STREAMING RELAY
                </span>
                <span className="hidden sm:inline text-[11px] text-amber-600/80 dark:text-amber-400/80 ml-2">
                  • Host berbeda, streaming via RAM buffer
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
              disabled={disabled}
              onClick={onStart}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Progress Bar & Percentage */}
      <div>
        <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-zinc-300 mb-2">
          <div className="flex items-center gap-2">
            {isMigrating && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500 dark:text-blue-400" />}
            <span className="font-semibold text-slate-800 dark:text-zinc-200">
              Status: <span className="uppercase text-blue-600 dark:text-blue-400 font-bold">{progress.status}</span>
            </span>
            {progress.current_file && (
              <span className="text-slate-500 dark:text-zinc-400 text-xs truncate max-w-[320px] md:max-w-[480px]">
                • {progress.current_file}
              </span>
            )}
          </div>
          <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">{percent}%</span>
        </div>

        {/* Bar */}
        <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800">
          <div
            className={`h-full transition-all duration-300 ease-out ${
              progress.status === "completed"
                ? "bg-emerald-500"
                : "bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-950/50 p-3">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400 text-[11px] font-medium mb-1">
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            Total Objek
          </div>
          <div className="text-base font-bold font-mono text-slate-900 dark:text-zinc-100">
            {progress.total_files.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-950/50 p-3">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Berhasil Di-copy
          </div>
          <div className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400">
            {progress.copied_files.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-950/50 p-3">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400 text-[11px] font-medium mb-1">
            <FileCheck2 className="h-3.5 w-3.5 text-slate-500" />
            Dilewati (Skipped)
          </div>
          <div className="text-base font-bold font-mono text-slate-800 dark:text-zinc-300">
            {progress.skipped_files.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-950/50 p-3">
          <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 text-[11px] font-medium mb-1">
            <FileX2 className="h-3.5 w-3.5 text-rose-600" />
            Gagal (Failed)
          </div>
          <div className="text-base font-bold font-mono text-rose-700 dark:text-rose-400">
            {progress.failed_files.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-950/50 p-3 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 text-[11px] font-medium mb-1">
            <HardDrive className="h-3.5 w-3.5 text-blue-600" />
            Data Ditransfer
          </div>
          <div className="text-xs font-bold font-mono text-blue-700 dark:text-blue-300 truncate">
            {formatBytes(progress.copied_bytes)} / {formatBytes(progress.total_bytes)}
          </div>
        </div>
      </div>
    </div>
  );
};
