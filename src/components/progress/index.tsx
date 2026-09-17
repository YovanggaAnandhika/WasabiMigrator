"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ProgressBarProps } from "./types";

// Dynamic imports with Next.js dynamic
const ProgressHeader = dynamic(
  () => import("./ProgressHeader").then((mod) => mod.ProgressHeader),
  { ssr: false }
);

const ProgressTrack = dynamic(
  () => import("./ProgressTrack").then((mod) => mod.ProgressTrack),
  { ssr: false }
);

const ProgressMetrics = dynamic(
  () => import("./ProgressMetrics").then((mod) => mod.ProgressMetrics),
  { ssr: false }
);

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  isSameHost,
  isSameBucket = false,
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
      <ProgressHeader
        progress={progress}
        isSameHost={isSameHost}
        isSameBucket={isSameBucket}
        isMigrating={isMigrating}
        disabled={disabled}
        onStart={onStart}
        onCancel={onCancel}
      />

      <ProgressTrack
        progress={progress}
        isMigrating={isMigrating}
        percent={percent}
      />

      <ProgressMetrics progress={progress} />
    </div>
  );
};

export default ProgressBar;
export type { ProgressBarProps };
