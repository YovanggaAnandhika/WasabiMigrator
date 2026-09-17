import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { BucketConfig, ConflictStrategy, LogEvent, ProgressEvent, TestResult } from "./types";

export const isTauri = () => {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
};

export async function testBucketConnection(config: BucketConfig): Promise<TestResult> {
  if (!isTauri()) {
    // Browser mock for quick UI testing
    await new Promise((r) => setTimeout(r, 800));
    if (!config.endpoint_url || !config.bucket_name) {
      throw new Error("Endpoint URL and Bucket Name are required");
    }
    return {
      success: true,
      message: `[Simulated] Connection to ${config.endpoint_url} (bucket: ${config.bucket_name}) verified successfully!`,
      endpoint: config.endpoint_url,
      bucket: config.bucket_name,
    };
  }

  return await invoke<TestResult>("test_bucket_connection", {
    config: {
      ...config,
      prefix: config.prefix ? config.prefix : null,
      use_path_style: config.use_path_style ?? true,
    },
  });
}

export async function startMigration(
  source: BucketConfig,
  target: BucketConfig,
  strategy: ConflictStrategy,
  concurrency?: number
): Promise<void> {
  if (!isTauri()) {
    throw new Error("Migration execution requires running inside the Tauri desktop app.");
  }

  await invoke("start_migration", {
    source: {
      ...source,
      prefix: source.prefix ? source.prefix : null,
      use_path_style: source.use_path_style ?? true,
    },
    target: {
      ...target,
      prefix: target.prefix ? target.prefix : null,
      use_path_style: target.use_path_style ?? true,
    },
    strategy,
    concurrency: concurrency ? Math.max(1, Math.min(100, concurrency)) : 16,
  });
}

export async function cancelMigration(): Promise<void> {
  if (!isTauri()) return;
  await invoke("cancel_migration");
}

export async function onMigrationProgress(
  callback: (event: ProgressEvent) => void
): Promise<UnlistenFn> {
  if (!isTauri()) return () => {};
  return await listen<ProgressEvent>("migration-progress", (e) => callback(e.payload));
}

export async function onMigrationLog(
  callback: (event: LogEvent) => void
): Promise<UnlistenFn> {
  if (!isTauri()) return () => {};
  return await listen<LogEvent>("migration-log", (e) => callback(e.payload));
}
