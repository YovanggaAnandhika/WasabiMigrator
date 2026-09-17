"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { TestResult } from "@/lib/types";

interface BucketFooterProps {
  isSource: boolean;
  disabled: boolean;
  testing: boolean;
  testResult: TestResult | null;
  errorMessage: string | null;
  onTest: () => void;
}

export const BucketFooter: React.FC<BucketFooterProps> = ({
  isSource,
  disabled,
  testing,
  testResult,
  errorMessage,
  onTest,
}) => {
  return (
    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800/80 flex items-center justify-between gap-3">
      <button
        type="button"
        disabled={disabled || testing}
        onClick={onTest}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition shadow-lg ${
          isSource
            ? "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 shadow-blue-600/20"
            : "bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-600/20"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {testing ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Menguji Koneksi...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Test {isSource ? "Source" : "Target"} Connection
          </>
        )}
      </button>

      {/* Status Indicators */}
      <div className="flex-1 text-right text-xs">
        {testResult && (
          <div className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-2.5 py-1 rounded-md shadow-xs">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate max-w-[260px]">{testResult.message}</span>
          </div>
        )}
        {errorMessage && (
          <div
            title={`${errorMessage}\n(Klik untuk melihat/salin pesan error lengkap)`}
            onClick={() => alert(`Detail Error:\n\n${errorMessage}`)}
            className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/20 px-2.5 py-1 rounded-md shadow-xs cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-500/20 transition"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="truncate max-w-[260px]">{errorMessage}</span>
          </div>
        )}
        {!testResult && !errorMessage && !testing && (
          <span className="text-slate-500 dark:text-zinc-400 text-[11px] font-medium">Belum diuji</span>
        )}
      </div>
    </div>
  );
};
