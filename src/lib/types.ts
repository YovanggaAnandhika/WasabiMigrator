export interface BucketConfig {
  endpoint_url: string;
  region: string;
  access_key_id: string;
  secret_access_key: string;
  bucket_name: string;
  prefix: string;
  use_path_style: boolean;
}

export type ConflictStrategy = "ReplaceIfDifferent" | "IgnoreExisting" | "AlwaysOverwrite";

export interface TestResult {
  success: boolean;
  message: string;
  endpoint: string;
  bucket: string;
}

export interface ProgressEvent {
  transfer_mode: "server_side_copy" | "client_streaming";
  copied_files: number;
  skipped_files: number;
  failed_files: number;
  total_files: number;
  copied_bytes: number;
  total_bytes: number;
  current_file: string;
  status: "idle" | "scanning" | "transferring" | "completed" | "cancelled" | "error";
}

export interface LogEvent {
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
}
