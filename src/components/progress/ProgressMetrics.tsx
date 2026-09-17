"use client";

import React from "react";
import { Layers, CheckCircle2, FileCheck2, FileX2, HardDrive } from "lucide-react";
import { ProgressEvent } from "@/lib/types";
import { formatBytes } from "./types";

interface ProgressMetricsProps {
  progress: ProgressEvent;
}

export const ProgressMetrics: React.FC<ProgressMetricsProps> = ({ progress }) => {
  return (
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
  );
};
