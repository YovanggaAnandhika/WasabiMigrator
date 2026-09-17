"use client";

import React, { useState } from "react";
import { Database } from "lucide-react";
import dynamic from "next/dynamic";
import { BucketConfig, TestResult } from "@/lib/types";
import { testBucketConnection } from "@/lib/tauri";
import { BucketCardProps } from "./types";

// Dynamic imports with Next.js dynamic
const BucketHeader = dynamic(
  () => import("./BucketHeader").then((mod) => mod.BucketHeader),
  { ssr: false }
);

const ProfileSelectorBar = dynamic(
  () => import("./ProfileSelectorBar").then((mod) => mod.ProfileSelectorBar),
  { ssr: false }
);

const BucketFormFields = dynamic(
  () => import("./BucketFormFields").then((mod) => mod.BucketFormFields),
  { ssr: false }
);

const BucketFooter = dynamic(
  () => import("./BucketFooter").then((mod) => mod.BucketFooter),
  { ssr: false }
);

export const BucketCard: React.FC<BucketCardProps> = ({
  title,
  side,
  config,
  onChange,
  profiles = [],
  testResult: externalTestResult,
  errorMessage: externalErrorMessage,
  onTestResultChanged,
  onLog,
  disabled = false,
  className = "",
}) => {
  const [testing, setTesting] = useState(false);
  const [internalTestResult, setInternalTestResult] = useState<TestResult | null>(null);
  const [internalErrorMessage, setInternalErrorMessage] = useState<string | null>(null);

  const testResult = externalTestResult !== undefined ? externalTestResult : internalTestResult;
  const errorMessage = externalErrorMessage !== undefined ? externalErrorMessage : internalErrorMessage;

  const isSource = side === "source";
  const badgeColor = isSource
    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

  const handleTest = async () => {
    setTesting(true);
    setInternalTestResult(null);
    setInternalErrorMessage(null);
    if (onTestResultChanged) {
      onTestResultChanged(null, null);
    }

    const bucketLabel = isSource ? "Source" : "Destination";
    const bucketName = config.bucket_name || "(kosong)";

    if (onLog) {
      onLog("info", `[Tes Koneksi ${bucketLabel}] Menguji akses ke bucket '${bucketName}' (${config.endpoint_url})...`);
    }

    try {
      const res = await testBucketConnection(config);
      setInternalTestResult(res);
      if (onTestResultChanged) {
        onTestResultChanged(res, null);
      }
      if (res.success) {
        if (onLog) {
          onLog("info", `✓ [Tes Koneksi ${bucketLabel}] Berhasil terhubung ke '${bucketName}'. Pesan: ${res.message}`);
        }
      } else {
        if (onLog) {
          onLog("error", `✗ [Tes Koneksi ${bucketLabel}] Gagal verifikasi bucket '${bucketName}': ${res.message}`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setInternalErrorMessage(msg);
      if (onTestResultChanged) {
        onTestResultChanged(null, msg);
      }
      if (onLog) {
        onLog("error", `✗ [Tes Koneksi ${bucketLabel}] Error koneksi bucket '${bucketName}': ${msg}`);
      }
    } finally {
      setTesting(false);
    }
  };

  const isProfileLoaded = Boolean(
    config.access_key_id.trim() && config.bucket_name.trim()
  );

  return (
    <div className={`relative flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 backdrop-blur-xl p-5 shadow-lg dark:shadow-2xl transition-all duration-300 hover:border-slate-300 dark:hover:border-zinc-700/80 ${className}`}>
      <div className="flex-1 flex flex-col min-h-0">
        <BucketHeader
          title={title}
          isSource={isSource}
          badgeColor={badgeColor}
        />

        <ProfileSelectorBar
          profiles={profiles}
          currentConfig={config}
          disabled={disabled}
          onSelectProfile={onChange}
        />

        {isProfileLoaded ? (
          <BucketFormFields
            config={config}
            isSource={isSource}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center my-6 py-8 px-4 text-center border border-dashed border-slate-200 dark:border-zinc-800/80 rounded-xl bg-slate-50/40 dark:bg-zinc-950/30">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2.5 ${
              isSource ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
            }`}>
              <Database className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              {profiles.length > 0 ? "Pilih Profil Kredensial Terlebih Dahulu" : "Belum Ada Profil Tersimpan"}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1 max-w-xs leading-relaxed">
              {profiles.length > 0
                ? "Silakan pilih salah satu profil di dropdown atas untuk memuat kredensial dan form bucket."
                : "Harap buat atau import profil kredensial melalui tombol 'Profil Kredensial' di header atas."}
            </p>
          </div>
        )}
      </div>

      {isProfileLoaded && (
        <BucketFooter
          isSource={isSource}
          disabled={disabled}
          testing={testing}
          testResult={testResult}
          errorMessage={errorMessage}
          onTest={handleTest}
        />
      )}
    </div>
  );
};

export default BucketCard;
export type { BucketCardProps };
