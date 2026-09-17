use std::fs;
use std::path::PathBuf;
use rusqlite::{params, Connection};
use tauri::AppHandle;
#[cfg(not(debug_assertions))]
use tauri::Manager;
use uuid::Uuid;
use chrono::Utc;

use crate::models::{ProfileInput, ProfileRecord};

/// Resolve database path:
/// In dev/debug mode (`bun tauri dev`): stores in `src-tauri/database/dka.db`
/// In release/compile mode: stores in OS AppData directory (`dka.db`)
pub fn get_db_path(_app: &AppHandle) -> Result<PathBuf, String> {
    #[cfg(debug_assertions)]
    {
        // When running in dev mode via `bun tauri dev` or `cargo tauri dev`
        let current_dir = std::env::current_dir()
            .map_err(|e| format!("Failed to get current directory: {}", e))?;

        // Current dir could be project root or `src-tauri` directory
        let db_dir = if current_dir.ends_with("src-tauri") {
            current_dir.join("database")
        } else {
            current_dir.join("src-tauri").join("database")
        };

        if !db_dir.exists() {
            fs::create_dir_all(&db_dir)
                .map_err(|e| format!("Failed to create dev database directory {:?}: {}", db_dir, e))?;
        }

        Ok(db_dir.join("dka.db"))
    }

    #[cfg(not(debug_assertions))]
    {
        let app_dir = app
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data dir: {}", e))?;

        if !app_dir.exists() {
            fs::create_dir_all(&app_dir)
                .map_err(|e| format!("Failed to create app data directory: {}", e))?;
        }

        Ok(app_dir.join("dka.db"))
    }
}

/// Open connection and initialize profiles table if not exists
pub fn init_db(app: &AppHandle) -> Result<Connection, String> {
    let db_path = get_db_path(app)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open SQLite database at {:?}: {}", db_path, e))?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            endpoint_url TEXT NOT NULL,
            region TEXT NOT NULL,
            access_key_id TEXT NOT NULL,
            secret_access_key TEXT NOT NULL,
            bucket_name TEXT NOT NULL DEFAULT '',
            prefix TEXT NOT NULL DEFAULT '',
            use_path_style INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );"
    ).map_err(|e| format!("Failed to initialize database schema: {}", e))?;

    Ok(conn)
}

/// Get all stored profiles ordered by updated_at DESC
pub fn get_all_profiles(app: &AppHandle) -> Result<Vec<ProfileRecord>, String> {
    let conn = init_db(app)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, name, endpoint_url, region, access_key_id, secret_access_key,
                    bucket_name, prefix, use_path_style, created_at, updated_at
             FROM profiles
             ORDER BY updated_at DESC"
        )
        .map_err(|e| format!("Query prepare error: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            let use_path_style_int: i32 = row.get(8)?;
            Ok(ProfileRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                endpoint_url: row.get(2)?,
                region: row.get(3)?,
                access_key_id: row.get(4)?,
                secret_access_key: row.get(5)?,
                bucket_name: row.get(6)?,
                prefix: row.get(7)?,
                use_path_style: use_path_style_int == 1,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })
        .map_err(|e| format!("Query error: {}", e))?;

    let mut profiles = Vec::new();
    for r in rows {
        match r {
            Ok(p) => profiles.push(p),
            Err(e) => return Err(format!("Row reading error: {}", e)),
        }
    }

    Ok(profiles)
}

/// Create or update a profile record
pub fn save_profile(app: &AppHandle, input: ProfileInput) -> Result<ProfileRecord, String> {
    let conn = init_db(app)?;
    let now = Utc::now().to_rfc3339();

    let id = match input.id {
        Some(ref existing_id) if !existing_id.trim().is_empty() => existing_id.trim().to_string(),
        _ => Uuid::new_v4().to_string(),
    };

    let bucket_name = input.bucket_name.unwrap_or_default();
    let prefix = input.prefix.unwrap_or_default();
    let use_path_style_int = if input.use_path_style.unwrap_or(true) { 1 } else { 0 };

    conn.execute(
        "INSERT INTO profiles (
            id, name, endpoint_url, region, access_key_id, secret_access_key,
            bucket_name, prefix, use_path_style, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?10)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            endpoint_url = excluded.endpoint_url,
            region = excluded.region,
            access_key_id = excluded.access_key_id,
            secret_access_key = excluded.secret_access_key,
            bucket_name = excluded.bucket_name,
            prefix = excluded.prefix,
            use_path_style = excluded.use_path_style,
            updated_at = excluded.updated_at",
        params![
            id,
            input.name.trim(),
            input.endpoint_url.trim(),
            input.region.trim(),
            input.access_key_id.trim(),
            input.secret_access_key.trim(),
            bucket_name.trim(),
            prefix.trim(),
            use_path_style_int,
            now,
        ],
    ).map_err(|e| format!("Failed to save profile: {}", e))?;

    // Fetch saved record to return
    let record: ProfileRecord = conn.query_row(
        "SELECT id, name, endpoint_url, region, access_key_id, secret_access_key,
                bucket_name, prefix, use_path_style, created_at, updated_at
         FROM profiles WHERE id = ?1",
        params![id],
        |row| {
            let path_style_int: i32 = row.get(8)?;
            Ok(ProfileRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                endpoint_url: row.get(2)?,
                region: row.get(3)?,
                access_key_id: row.get(4)?,
                secret_access_key: row.get(5)?,
                bucket_name: row.get(6)?,
                prefix: row.get(7)?,
                use_path_style: path_style_int == 1,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        },
    ).map_err(|e| format!("Failed to fetch saved record: {}", e))?;

    Ok(record)
}

/// Delete a profile by ID
pub fn delete_profile(app: &AppHandle, id: String) -> Result<(), String> {
    let conn = init_db(app)?;
    conn.execute("DELETE FROM profiles WHERE id = ?1", params![id.trim()])
        .map_err(|e| format!("Failed to delete profile: {}", e))?;
    Ok(())
}
