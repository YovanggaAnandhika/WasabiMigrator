import { BucketConfig, ProfileRecord, TestResult } from "@/lib/types";

export interface BucketCardProps {
  title: string;
  side: "source" | "target";
  config: BucketConfig;
  onChange: (newConfig: BucketConfig) => void;
  profiles?: ProfileRecord[];
  disabled?: boolean;
  className?: string;
}
