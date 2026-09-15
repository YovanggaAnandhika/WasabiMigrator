use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BucketConfig {
    pub endpoint_url: String,
    pub region: String,
    pub access_key_id: String,
    pub secret_access_key: String,
    pub bucket_name: String,
    pub prefix: Option<String>,
    pub use_path_style: Option<bool>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ConflictStrategy {
    #[serde(rename = "ReplaceIfDifferent")]
    ReplaceIfDifferent,
    #[serde(rename = "IgnoreExisting")]
    IgnoreExisting,
    #[serde(rename = "AlwaysOverwrite")]
    AlwaysOverwrite,
}

impl Default for ConflictStrategy {
    fn default() -> Self {
        ConflictStrategy::ReplaceIfDifferent
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestResult {
    pub success: bool,
    pub message: String,
    pub endpoint: String,
    pub bucket: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressEvent {
    pub transfer_mode: String, // "server_side_copy" | "client_streaming"
    pub copied_files: u64,
    pub skipped_files: u64,
    pub failed_files: u64,
    pub total_files: u64,
    pub copied_bytes: u64,
    pub total_bytes: u64,
    pub current_file: String,
    pub status: String, // "scanning" | "transferring" | "completed" | "cancelled" | "error"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEvent {
    pub timestamp: String,
    pub level: String, // "info" | "warn" | "error" | "success"
    pub message: String,
}
