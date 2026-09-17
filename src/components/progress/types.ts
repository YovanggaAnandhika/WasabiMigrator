import { ProgressEvent } from "@/lib/types";

export interface ProgressBarProps {
  progress: ProgressEvent;
  isSameHost: boolean;
  onStart: () => void;
  onCancel: () => void;
  isMigrating: boolean;
  disabled?: boolean;
}

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
