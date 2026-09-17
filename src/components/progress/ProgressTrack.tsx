"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { ProgressEvent } from "@/lib/types";

interface ProgressTrackProps {
  progress: ProgressEvent;
  isMigrating: boolean;
  percent: number;
}

export const ProgressTrack: React.FC<ProgressTrackProps> = ({
  progress,
  isMigrating,
  percent,
}) => {
  return (
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
  );
};
