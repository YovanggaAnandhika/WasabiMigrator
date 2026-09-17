"use client";

import React, { useState } from "react";
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

  return (
    <div className={`relative flex flex-col rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 backdrop-blur-xl p-5 shadow-lg dark:shadow-2xl transition-all duration-300 hover:border-slate-300 dark:hover:border-zinc-700/80 ${className}`}>
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

      <BucketFormFields
        config={config}
        isSource={isSource}
      />

      <BucketFooter
        isSource={isSource}
        disabled={disabled}
        testing={testing}
        testResult={testResult}
        errorMessage={errorMessage}
        onTest={handleTest}
      />
    </div>
  );
};

export default BucketCard;
export type { BucketCardProps };
