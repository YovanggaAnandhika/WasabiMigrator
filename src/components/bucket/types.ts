import { BucketConfig, ProfileRecord, TestResult } from "@/lib/types";

export interface BucketCardProps {
  title: string;
  side: "source" | "target";
  config: BucketConfig;
  onChange: (newConfig: BucketConfig) => void;
  profiles?: ProfileRecord[];
  testResult?: TestResult | null;
  errorMessage?: string | null;
  onTestResultChanged?: (result: TestResult | null, error: string | null) => void;
  onLog?: (level: "info" | "warn" | "error", message: string) => void;
  disabled?: boolean;
  className?: string;
}
