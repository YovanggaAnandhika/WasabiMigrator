"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { LogConsoleProps } from "./types";

// Dynamic imports with Next.js dynamic
const LogHeader = dynamic(
  () => import("./LogHeader").then((mod) => mod.LogHeader),
  { ssr: false }
);

const LogList = dynamic(
  () => import("./LogList").then((mod) => mod.LogList),
  { ssr: false }
);

export const LogConsole: React.FC<LogConsoleProps> = ({ logs, onClear }) => {
  const [autoScroll, setAutoScroll] = useState(true);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/90 backdrop-blur-xl shadow-lg dark:shadow-2xl overflow-hidden flex flex-col flex-1 h-full min-h-0">
      <LogHeader
        logsCount={logs.length}
        autoScroll={autoScroll}
        logs={logs}
        onToggleAutoScroll={() => setAutoScroll(!autoScroll)}
        onClear={onClear}
      />

      <LogList logs={logs} autoScroll={autoScroll} />
    </div>
  );
};

export default LogConsole;
export type { LogConsoleProps };
