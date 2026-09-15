use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use aws_sdk_s3::primitives::ByteStream;
use chrono::Local;

use crate::models::{BucketConfig, ConflictStrategy, LogEvent, ProgressEvent, TestResult};
use crate::s3_client::build_client;

fn now_str() -> String {
    Local::now().format("%H:%M:%S").to_string()
}

fn emit_log(app: &AppHandle, level: &str, message: &str) {
    let _ = app.emit(
        "migration-log",
        LogEvent {
            timestamp: now_str(),
            level: level.to_string(),
            message: message.to_string(),
        },
    );
}

fn emit_progress(app: &AppHandle, progress: &ProgressEvent) {
    let _ = app.emit("migration-progress", progress.clone());
}

pub async fn test_connection(config: BucketConfig) -> Result<TestResult, String> {
    let client = build_client(&config)?;
    let bucket_name = config.bucket_name.trim().to_string();

    if bucket_name.is_empty() {
        return Err("Bucket name cannot be empty".to_string());
    }

    match client.list_objects_v2().bucket(&bucket_name).max_keys(1).send().await {
        Ok(_) => Ok(TestResult {
            success: true,
            message: format!("Successfully verified bucket '{}' on {}", bucket_name, config.endpoint_url),
            endpoint: config.endpoint_url,
            bucket: bucket_name,
        }),
        Err(e) => {
            let err_msg = e.into_service_error();
            Err(format!("{}: {}", err_msg.meta().code().unwrap_or("Error"), err_msg.meta().message().unwrap_or("Connection failed")))
        }
    }
}

pub async fn execute_migration(
    app: AppHandle,
    source: BucketConfig,
    target: BucketConfig,
    strategy: ConflictStrategy,
    cancel_flag: Arc<AtomicBool>,
) -> Result<(), String> {
    let source_client = match build_client(&source) {
        Ok(c) => c,
        Err(e) => {
            emit_log(&app, "error", &format!("Failed to configure Source S3 client: {}", e));
            return Err(e);
        }
    };

    let target_client = match build_client(&target) {
        Ok(c) => c,
        Err(e) => {
            emit_log(&app, "error", &format!("Failed to configure Target S3 client: {}", e));
            return Err(e);
        }
    };

    let source_ep = source.endpoint_url.trim().trim_end_matches('/').to_lowercase();
    let target_ep = target.endpoint_url.trim().trim_end_matches('/').to_lowercase();
    let is_same_host = source_ep == target_ep;
    let transfer_mode = if is_same_host {
        "server_side_copy"
    } else {
        "client_streaming"
    };

    let mode_desc = if is_same_host {
        "⚡ Server-Side Copy Mode active (0% Local Bandwidth, datacenter internal transfer)"
    } else {
        "🌐 Client Streaming Relay active (cross-host streaming via RAM buffer)"
    };
    emit_log(&app, "info", mode_desc);

    let mut progress = ProgressEvent {
        transfer_mode: transfer_mode.to_string(),
        copied_files: 0,
        skipped_files: 0,
        failed_files: 0,
        total_files: 0,
        copied_bytes: 0,
        total_bytes: 0,
        current_file: "Scanning source bucket...".to_string(),
        status: "scanning".to_string(),
    };
    emit_progress(&app, &progress);
    emit_log(&app, "info", &format!("Listing objects from source bucket '{}'...", source.bucket_name));

    // Step 1: Discover all objects
    struct ObjectItem {
        key: String,
        size: i64,
        etag: Option<String>,
    }
    let mut objects: Vec<ObjectItem> = Vec::new();
    let mut continuation_token: Option<String> = None;

    loop {
        if cancel_flag.load(Ordering::Relaxed) {
            emit_log(&app, "warn", "Migration cancelled by user during scanning.");
            progress.status = "cancelled".to_string();
            emit_progress(&app, &progress);
            return Ok(());
        }

        let mut req = source_client.list_objects_v2().bucket(&source.bucket_name);
        if let Some(prefix) = &source.prefix {
            let p = prefix.trim();
            if !p.is_empty() {
                req = req.prefix(p);
            }
        }
        if let Some(token) = continuation_token {
            req = req.continuation_token(token);
        }

        let resp = match req.send().await {
            Ok(r) => r,
            Err(e) => {
                let msg = format!("Failed to list objects: {:?}", e);
                emit_log(&app, "error", &msg);
                progress.status = "error".to_string();
                emit_progress(&app, &progress);
                return Err(msg);
            }
        };

        if let Some(contents) = resp.contents {
            for obj in contents {
                if let Some(key) = obj.key {
                    let size = obj.size.unwrap_or(0);
                    let etag = obj.e_tag.map(|t| t.trim_matches('"').to_string());
                    objects.push(ObjectItem { key, size, etag });
                }
            }
        }

        if resp.is_truncated.unwrap_or(false) {
            continuation_token = resp.next_continuation_token;
        } else {
            break;
        }
    }

    progress.total_files = objects.len() as u64;
    progress.total_bytes = objects.iter().map(|o| o.size.max(0) as u64).sum();
    progress.status = "transferring".to_string();
    emit_progress(&app, &progress);

    emit_log(
        &app,
        "info",
        &format!(
            "Scan complete: Found {} objects totaling {:.2} MB.",
            progress.total_files,
            progress.total_bytes as f64 / (1024.0 * 1024.0)
        ),
    );

    if objects.is_empty() {
        emit_log(&app, "warn", "No objects found matching criteria.");
        progress.status = "completed".to_string();
        emit_progress(&app, &progress);
        return Ok(());
    }

    // Step 2: Concurrent Multi-Worker Pool (16 concurrent tasks)
    use std::sync::atomic::{AtomicU64, AtomicUsize};
    use tokio::sync::Semaphore;

    let target_prefix = target.prefix.as_deref().unwrap_or("").trim().to_string();
    let source_prefix = source.prefix.as_deref().unwrap_or("").trim().to_string();

    let concurrency_limit = 20; // 20 concurrent cloud copy workers
    emit_log(
        &app,
        "info",
        &format!("⚡ Launching high-speed concurrent pool with {} parallel workers...", concurrency_limit),
    );

    let semaphore = Arc::new(Semaphore::new(concurrency_limit));
    let worker_seq = Arc::new(AtomicUsize::new(0));

    let copied_files = Arc::new(AtomicU64::new(0));
    let skipped_files = Arc::new(AtomicU64::new(0));
    let failed_files = Arc::new(AtomicU64::new(0));
    let copied_bytes = Arc::new(AtomicU64::new(0));

    let source_client = Arc::new(source_client);
    let target_client = Arc::new(target_client);
    let source_bucket = Arc::new(source.bucket_name.clone());
    let target_bucket = Arc::new(target.bucket_name.clone());

    let mut handles = Vec::with_capacity(objects.len());

    for obj in objects {
        if cancel_flag.load(Ordering::Relaxed) {
            emit_log(&app, "warn", "Migration cancelled by user.");
            break;
        }

        let permit = match semaphore.clone().acquire_owned().await {
            Ok(p) => p,
            Err(_) => break,
        };

        let app_clone = app.clone();
        let cancel_clone = cancel_flag.clone();
        let s_client = source_client.clone();
        let t_client = target_client.clone();
        let s_bucket = source_bucket.clone();
        let t_bucket = target_bucket.clone();
        let t_prefix = target_prefix.clone();
        let s_prefix = source_prefix.clone();

        let c_files = copied_files.clone();
        let s_files = skipped_files.clone();
        let f_files = failed_files.clone();
        let c_bytes = copied_bytes.clone();

        let total_f = progress.total_files;
        let total_b = progress.total_bytes;
        let w_seq = worker_seq.clone();

        let handle = tokio::spawn(async move {
            let _permit = permit;
            if cancel_clone.load(Ordering::Relaxed) {
                return;
            }

            let worker_id = (w_seq.fetch_add(1, Ordering::Relaxed) % concurrency_limit) + 1;
            let worker_tag = format!("[Worker #{:02}]", worker_id);

            // Calculate target key
            let target_key = if !t_prefix.is_empty() {
                if !s_prefix.is_empty() && obj.key.starts_with(&s_prefix) {
                    let relative = obj.key.strip_prefix(&s_prefix).unwrap_or(&obj.key);
                    let rel_clean = relative.trim_start_matches('/');
                    let tgt_clean = t_prefix.trim_end_matches('/');
                    format!("{}/{}", tgt_clean, rel_clean)
                } else {
                    let tgt_clean = t_prefix.trim_end_matches('/');
                    let key_clean = obj.key.trim_start_matches('/');
                    format!("{}/{}", tgt_clean, key_clean)
                }
            } else {
                obj.key.clone()
            };

            // Check conflict strategy
            let mut skip_file = false;
            if strategy != ConflictStrategy::AlwaysOverwrite {
                if let Ok(head_resp) = t_client
                    .head_object()
                    .bucket(&*t_bucket)
                    .key(&target_key)
                    .send()
                    .await
                {
                    if strategy == ConflictStrategy::IgnoreExisting {
                        skip_file = true;
                    } else if strategy == ConflictStrategy::ReplaceIfDifferent {
                        let target_size = head_resp.content_length.unwrap_or(0);
                        let target_etag = head_resp.e_tag.map(|t| t.trim_matches('"').to_string());

                        let size_matches = target_size == obj.size;
                        let etag_matches = match (&target_etag, &obj.etag) {
                            (Some(te), Some(se)) => te == se,
                            _ => true,
                        };

                        if size_matches && etag_matches {
                            skip_file = true;
                        }
                    }
                }
            }

            if skip_file {
                let s_count = s_files.fetch_add(1, Ordering::Relaxed) + 1;
                emit_log(
                    &app_clone,
                    "info",
                    &format!("{} [SKIP] '{}' checksum/size match", worker_tag, target_key),
                );
                let c_count = c_files.load(Ordering::Relaxed);
                let f_count = f_files.load(Ordering::Relaxed);
                let b_count = c_bytes.load(Ordering::Relaxed);

                emit_progress(
                    &app_clone,
                    &ProgressEvent {
                        transfer_mode: if is_same_host { "server_side_copy" } else { "client_streaming" }.to_string(),
                        copied_files: c_count,
                        skipped_files: s_count,
                        failed_files: f_count,
                        total_files: total_f,
                        copied_bytes: b_count,
                        total_bytes: total_b,
                        current_file: format!("{} Skipped {}", worker_tag, obj.key),
                        status: "transferring".to_string(),
                    },
                );
                return;
            }

            // Perform transfer
            let transfer_result: Result<(), String> = if is_same_host {
                let encoded_key = urlencoding::encode(&obj.key);
                let copy_source = format!("{}/{}", s_bucket, encoded_key);

                match t_client
                    .copy_object()
                    .bucket(&*t_bucket)
                    .key(&target_key)
                    .copy_source(&copy_source)
                    .send()
                    .await
                {
                    Ok(_) => Ok(()),
                    Err(_) => {
                        // Fallback to streaming if server copy fails
                        stream_copy(&s_client, &t_client, &s_bucket, &obj.key, &t_bucket, &target_key, obj.size).await
                    }
                }
            } else {
                stream_copy(&s_client, &t_client, &s_bucket, &obj.key, &t_bucket, &target_key, obj.size).await
            };

            match transfer_result {
                Ok(_) => {
                    let c_count = c_files.fetch_add(1, Ordering::Relaxed) + 1;
                    let b_count = c_bytes.fetch_add(obj.size.max(0) as u64, Ordering::Relaxed) + obj.size.max(0) as u64;
                    let s_count = s_files.load(Ordering::Relaxed);
                    let f_count = f_files.load(Ordering::Relaxed);

                    emit_log(
                        &app_clone,
                        "success",
                        &format!(
                            "{} [OK] {} ({:.1} KB) -> {}",
                            worker_tag,
                            obj.key,
                            obj.size as f64 / 1024.0,
                            target_key
                        ),
                    );

                    emit_progress(
                        &app_clone,
                        &ProgressEvent {
                            transfer_mode: if is_same_host { "server_side_copy" } else { "client_streaming" }.to_string(),
                            copied_files: c_count,
                            skipped_files: s_count,
                            failed_files: f_count,
                            total_files: total_f,
                            copied_bytes: b_count,
                            total_bytes: total_b,
                            current_file: format!("{} Copied {}", worker_tag, obj.key),
                            status: "transferring".to_string(),
                        },
                    );
                }
                Err(err) => {
                    let f_count = f_files.fetch_add(1, Ordering::Relaxed) + 1;
                    let c_count = c_files.load(Ordering::Relaxed);
                    let s_count = s_files.load(Ordering::Relaxed);
                    let b_count = c_bytes.load(Ordering::Relaxed);

                    emit_log(
                        &app_clone,
                        "error",
                        &format!("{} [FAIL] {} -> {}: {}", worker_tag, obj.key, target_key, err),
                    );

                    emit_progress(
                        &app_clone,
                        &ProgressEvent {
                            transfer_mode: if is_same_host { "server_side_copy" } else { "client_streaming" }.to_string(),
                            copied_files: c_count,
                            skipped_files: s_count,
                            failed_files: f_count,
                            total_files: total_f,
                            copied_bytes: b_count,
                            total_bytes: total_b,
                            current_file: format!("{} Failed {}", worker_tag, obj.key),
                            status: "transferring".to_string(),
                        },
                    );
                }
            }
        });

        handles.push(handle);
    }

    // Wait for all concurrent worker tasks to finish
    for handle in handles {
        let _ = handle.await;
    }

    let final_copied = copied_files.load(Ordering::Relaxed);
    let final_skipped = skipped_files.load(Ordering::Relaxed);
    let final_failed = failed_files.load(Ordering::Relaxed);
    let final_bytes = copied_bytes.load(Ordering::Relaxed);

    let is_cancelled = cancel_flag.load(Ordering::Relaxed);
    let final_status = if is_cancelled { "cancelled" } else { "completed" };

    emit_progress(
        &app,
        &ProgressEvent {
            transfer_mode: if is_same_host { "server_side_copy" } else { "client_streaming" }.to_string(),
            copied_files: final_copied,
            skipped_files: final_skipped,
            failed_files: final_failed,
            total_files: progress.total_files,
            copied_bytes: final_bytes,
            total_bytes: progress.total_bytes,
            current_file: if is_cancelled { "Migration cancelled".to_string() } else { "Migration completed".to_string() },
            status: final_status.to_string(),
        },
    );

    emit_log(
        &app,
        if is_cancelled { "warn" } else { "success" },
        &format!(
            "🎉 Migration Finished! Copied: {}, Skipped: {}, Failed: {}. Total size: {:.2} MB.",
            final_copied,
            final_skipped,
            final_failed,
            final_bytes as f64 / (1024.0 * 1024.0)
        ),
    );

    Ok(())
}

async fn stream_copy(
    source_client: &aws_sdk_s3::Client,
    target_client: &aws_sdk_s3::Client,
    source_bucket: &str,
    source_key: &str,
    target_bucket: &str,
    target_key: &str,
    content_length: i64,
) -> Result<(), String> {
    let get_resp = source_client
        .get_object()
        .bucket(source_bucket)
        .key(source_key)
        .send()
        .await
        .map_err(|e| format!("Get object failed: {:?}", e))?;

    let bytes = get_resp
        .body
        .collect()
        .await
        .map_err(|e| format!("Streaming read failed: {:?}", e))?
        .into_bytes();

    let mut put_req = target_client
        .put_object()
        .bucket(target_bucket)
        .key(target_key)
        .body(ByteStream::from(bytes));

    if content_length >= 0 {
        put_req = put_req.content_length(content_length);
    }

    put_req
        .send()
        .await
        .map_err(|e| format!("Put object failed: {:?}", e))?;

    Ok(())
}
