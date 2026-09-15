"use client";

import React, { useRef, useEffect, useState } from "react";
import { Terminal, Trash2, Copy, Check, ArrowDown } from "lucide-react";
import { LogEvent } from "@/lib/types";

interface LogConsoleProps {
  logs: LogEvent[];
  onClear: () => void;
}

export const LogConsole: React.FC<LogConsoleProps> = ({ logs, onClear }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getLevelBadge = (level: string, message: string) => {
    if (message.includes("[SKIP]")) {
      return <span className="text-purple-600 dark:text-purple-400 font-bold bg-purple-100 dark:bg-purple-500/10 px-1.5 py-0.5 rounded text-[11px]">[SKIP]</span>;
    }
    if (message.includes("[OK]")) {
      return <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded text-[11px]">[OK]</span>;
    }
    if (message.includes("[FAIL]")) {
      return <span className="text-rose-700 dark:text-rose-400 font-bold bg-rose-100 dark:bg-rose-500/10 px-1.5 py-0.5 rounded text-[11px]">[FAIL]</span>;
    }

    switch (level) {
      case "success":
        return <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded text-[11px]">[SUCCESS]</span>;
      case "warn":
        return <span className="text-amber-700 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-500/10 px-1.5 py-0.5 rounded text-[11px]">[WARN]</span>;
      case "error":
        return <span className="text-rose-700 dark:text-rose-400 font-bold bg-rose-100 dark:bg-rose-500/10 px-1.5 py-0.5 rounded text-[11px]">[ERROR]</span>;
      default:
        return <span className="text-blue-700 dark:text-blue-400 font-bold bg-blue-100 dark:bg-blue-500/10 px-1.5 py-0.5 rounded text-[11px]">[INFO]</span>;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/90 backdrop-blur-xl shadow-lg dark:shadow-2xl overflow-hidden flex flex-col flex-1 h-full min-h-0">
      {/* Console Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900/80 px-4 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-slate-600 dark:text-zinc-400" />
          <span className="text-xs font-semibold text-slate-900 dark:text-zinc-200">Activity & Transfer Logs</span>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono font-medium">({logs.length} events)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
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
            disabled={logs.length === 0}
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-slate-950 dark:hover:text-white transition disabled:opacity-40"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={logs.length === 0}
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-300 dark:hover:border-rose-500/30 transition disabled:opacity-40"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Log list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3.5 font-mono text-xs text-slate-900 dark:text-zinc-300 space-y-1.5 selection:bg-blue-500/30 min-h-0 bg-slate-50/50 dark:bg-transparent"
      >
        {logs.length === 0 ? (
          <div className="flex h-full min-h-[80px] items-center justify-center text-slate-500 dark:text-zinc-500 text-xs italic">
            Log aktivitas migrasi akan muncul di sini secara real-time.
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="flex items-start gap-2 leading-relaxed break-all hover:bg-slate-200/50 dark:hover:bg-zinc-900/40 px-1.5 py-0.5 rounded transition">
              <span className="text-slate-600 dark:text-zinc-400 select-none shrink-0 font-medium text-[11px]">[{log.timestamp}]</span>
              <span className="shrink-0">{getLevelBadge(log.level, log.message)}</span>
              <span
                className={
                  log.level === "error"
                    ? "text-rose-700 dark:text-rose-300 font-medium"
                    : log.level === "warn"
                    ? "text-amber-800 dark:text-amber-300 font-medium"
                    : log.level === "success"
                    ? "text-emerald-800 dark:text-emerald-300 font-medium"
                    : "text-slate-800 dark:text-zinc-200"
                }
              >
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
