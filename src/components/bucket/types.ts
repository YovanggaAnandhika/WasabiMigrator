import { BucketConfig, ProfileRecord, TestResult } from "@/lib/types";

export interface BucketCardProps {
  title: string;
  side: "source" | "target";
  config: BucketConfig;
  onChange: (newConfig: BucketConfig) => void;
  profiles?: ProfileRecord[];
  onLog?: (level: "info" | "warn" | "error", message: string) => void;
  disabled?: boolean;
  className?: string;
}
