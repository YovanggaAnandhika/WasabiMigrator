"use client";

import React from "react";
import { Database } from "lucide-react";

interface BucketHeaderProps {
  title: string;
  isSource: boolean;
  badgeColor: string;
}

export const BucketHeader: React.FC<BucketHeaderProps> = ({
  title,
  isSource,
  badgeColor,
}) => {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 pb-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
            isSource
              ? "border-blue-500/30 bg-blue-500/10 text-blue-500 dark:text-blue-400"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
          }`}
        >
          <Database className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            {title}
            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${badgeColor}`}>
              {isSource ? "SOURCE" : "DESTINATION"}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {isSource ? "Bucket asal objek yang akan dipindahkan" : "Bucket tujuan tempat objek disimpan"}
          </p>
        </div>
      </div>
    </div>
  );
};
