"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ConflictSettingsProps } from "./types";

// Dynamic imports with Next.js dynamic
const ConcurrencyControl = dynamic(
  () => import("./ConcurrencyControl").then((mod) => mod.ConcurrencyControl),
  { ssr: false }
);

const StrategySelector = dynamic(
  () => import("./StrategySelector").then((mod) => mod.StrategySelector),
  { ssr: false }
);

export const ConflictSettings: React.FC<ConflictSettingsProps> = ({
  strategy,
  onChange,
  concurrency,
  onConcurrencyChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-6">
      <ConcurrencyControl
        concurrency={concurrency}
        disabled={disabled}
        onConcurrencyChange={onConcurrencyChange}
      />

      <StrategySelector
        strategy={strategy}
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
};

export default ConflictSettings;
export type { ConflictSettingsProps };
