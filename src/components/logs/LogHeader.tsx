"use client";

import React, { useState } from "react";
import { Terminal, ArrowDown, Copy, Check, Trash2 } from "lucide-react";
import { LogEvent } from "@/lib/types";

interface LogHeaderProps {
  logsCount: number;
  autoScroll: boolean;
  logs: LogEvent[];
  onToggleAutoScroll: () => void;
  onClear: () => void;
}

export const LogHeader: React.FC<LogHeaderProps> = ({
  logsCount,
  autoScroll,
  logs,
  onToggleAutoScroll,
  onClear,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900/80 px-4 py-2 shrink-0">
      <div className="flex items-center gap-2">
        <Terminal className="h-4 w-4 text-slate-600 dark:text-zinc-400" />
        <span className="text-xs font-semibold text-slate-900 dark:text-zinc-200">Activity & Transfer Logs</span>
        <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono font-medium">({logsCount} events)</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleAutoScroll}
          className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border transition ${
            autoScroll
              ? "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40 font-semibold"
              : "bg-slate-100 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400 border-slate-300 dark:border-zinc-700/50 hover:text-slate-900 dark:hover:text-zinc-200"
          }`}
        >
          <ArrowDown className="h-3 w-3" />
          Auto-scroll
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={logsCount === 0}
          className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-slate-950 dark:hover:text-white transition disabled:opacity-40"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={logsCount === 0}
          className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-300 dark:border-rose-500/30 transition disabled:opacity-40"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
      </div>
    </div>
  );
};
