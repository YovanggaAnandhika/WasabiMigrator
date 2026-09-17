"use client";

import React from "react";
import { SlidersHorizontal } from "lucide-react";

interface ConcurrencyControlProps {
  concurrency: number;
  disabled: boolean;
  onConcurrencyChange: (c: number) => void;
}

export const ConcurrencyControl: React.FC<ConcurrencyControlProps> = ({
  concurrency,
  disabled,
  onConcurrencyChange,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-5 shadow-lg dark:shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          <h3 className="text-xs font-semibold text-slate-700 dark:text-zinc-200 uppercase tracking-wider">
            Jumlah Parallel Workers
          </h3>
        </div>
        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          {concurrency} Workers
        </span>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed">
        Atur seberapa banyak proses transfer/copy berjalan bersamaan secara simultan (1 - 64 workers).
      </p>

      <div className="space-y-3">
        <input
          type="range"
          min={1}
          max={64}
          step={1}
          value={concurrency}
          disabled={disabled}
          onChange={(e) => onConcurrencyChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <div className="flex items-center justify-between gap-2 pt-1">
          {[4, 8, 16, 24, 32, 50].map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              onClick={() => onConcurrencyChange(preset)}
              className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded-lg border transition ${
                concurrency === preset
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-400/40"
                  : "border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {preset}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
