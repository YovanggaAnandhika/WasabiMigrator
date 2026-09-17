"use client";

import React from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import { ConflictStrategy } from "@/lib/types";
import { STRATEGIES } from "./types";

interface StrategySelectorProps {
  strategy: ConflictStrategy;
  disabled: boolean;
  onChange: (s: ConflictStrategy) => void;
}

export const StrategySelector: React.FC<StrategySelectorProps> = ({
  strategy,
  disabled,
  onChange,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-5 shadow-lg dark:shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal className="h-4 w-4 text-blue-500 dark:text-blue-400" />
        <h3 className="text-xs font-semibold text-slate-700 dark:text-zinc-200 uppercase tracking-wider">
          Pengaturan Konflik & Overwrite File
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {STRATEGIES.map((item) => {
          const isSelected = strategy === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(item.id)}
              className={`relative flex flex-col text-left rounded-xl border p-3.5 transition-all duration-200 ${
                isSelected
                  ? "border-blue-500/60 bg-blue-500/10 text-slate-900 dark:text-white ring-1 ring-blue-500/30 shadow-md shadow-blue-500/5"
                  : "border-slate-200 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-950/40 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700/80 hover:bg-slate-100 dark:hover:bg-zinc-900/40"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${isSelected ? "text-blue-500 dark:text-blue-400" : "text-slate-400 dark:text-zinc-400"}`} />
                  <span className="text-xs font-semibold">{item.label}</span>
                </div>
                {isSelected && (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500 text-white dark:text-black">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                )}
              </div>

              <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded border w-fit mb-2 ${
                isSelected
                  ? "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-400/30"
                  : "bg-slate-200/60 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 border-slate-300 dark:border-zinc-700/50"
              }`}>
                {item.badge}
              </span>

              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
