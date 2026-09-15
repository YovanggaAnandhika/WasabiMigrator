mod models;
mod s3_client;
mod migration;

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, State};

use models::{BucketConfig, ConflictStrategy, TestResult};

pub struct MigrationState {
    pub is_running: Arc<AtomicBool>,
    pub cancel_flag: Arc<AtomicBool>,
}

#[tauri::command]
async fn test_bucket_connection(config: BucketConfig) -> Result<TestResult, String> {
    migration::test_connection(config).await
}

#[tauri::command]
async fn start_migration(
    app: AppHandle,
    state: State<'_, MigrationState>,
    source: BucketConfig,
    target: BucketConfig,
    strategy: ConflictStrategy,
) -> Result<(), String> {
    if state.is_running.load(Ordering::Relaxed) {
        return Err("A migration task is already running".to_string());
    }

    state.is_running.store(true, Ordering::Relaxed);
    state.cancel_flag.store(false, Ordering::Relaxed);

    let is_running_clone = Arc::clone(&state.is_running);
    let cancel_flag_clone = Arc::clone(&state.cancel_flag);

    tokio::spawn(async move {
        let _ = migration::execute_migration(app, source, target, strategy, cancel_flag_clone).await;
        is_running_clone.store(false, Ordering::Relaxed);
    });

    Ok(())
}

#[tauri::command]
async fn cancel_migration(state: State<'_, MigrationState>) -> Result<(), String> {
    if state.is_running.load(Ordering::Relaxed) {
        state.cancel_flag.store(true, Ordering::Relaxed);
        Ok(())
    } else {
        Err("No migration is currently running".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migration_state = MigrationState {
        is_running: Arc::new(AtomicBool::new(false)),
        cancel_flag: Arc::new(AtomicBool::new(false)),
    };

    tauri::Builder::default()
        .manage(migration_state)
        .plugin(tauri_plugin_log::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            test_bucket_connection,
            start_migration,
            cancel_migration
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
