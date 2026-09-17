"use client";

import React, { useRef, useEffect } from "react";
import { LogEvent } from "@/lib/types";

interface LogListProps {
  logs: LogEvent[];
  autoScroll: boolean;
}

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

const renderMessageWithWorker = (message: string) => {
  const workerMatch = message.match(/^(\[Worker #\d+\])\s*(.*)/);
  if (workerMatch) {
    const workerTag = workerMatch[1];
    const rest = workerMatch[2];
    return (
      <span className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
          {workerTag}
        </span>
        <span>{rest}</span>
      </span>
    );
  }
  return <span>{message}</span>;
};

export const LogList: React.FC<LogListProps> = ({ logs, autoScroll }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  return (
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
              {renderMessageWithWorker(log.message)}
            </span>
          </div>
        ))
      )}
    </div>
  );
};
