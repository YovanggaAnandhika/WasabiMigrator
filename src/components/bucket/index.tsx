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
  onOpenProfileManager,
  disabled = false,
  className = "",
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSource = side === "source";
  const badgeColor = isSource
    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setErrorMessage(null);

    try {
      const res = await testBucketConnection(config);
      setTestResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
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
        disabled={disabled}
        onSelectProfile={onChange}
        onOpenProfileManager={onOpenProfileManager}
      />

      <BucketFormFields
        config={config}
        isSource={isSource}
        disabled={disabled}
        onChangePrefix={(prefix) => onChange({ ...config, prefix })}
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
