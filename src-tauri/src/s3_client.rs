use crate::models::BucketConfig;
use aws_credential_types::Credentials;
use aws_sdk_s3::config::Region;
use aws_sdk_s3::Client;

pub fn build_client(config: &BucketConfig) -> Result<Client, String> {
    let mut endpoint = config.endpoint_url.trim().to_string();
    if endpoint.is_empty() {
        return Err("Endpoint URL cannot be empty".to_string());
    }

    if !endpoint.starts_with("http://") && !endpoint.starts_with("https://") {
        endpoint = format!("https://{}", endpoint);
    }

    let access_key = config.access_key_id.trim();
    let secret_key = config.secret_access_key.trim();
    if access_key.is_empty() || secret_key.is_empty() {
        return Err("Access Key and Secret Key are required".to_string());
    }

    let credentials = Credentials::new(
        access_key,
        secret_key,
        None,
        None,
        "s3-migration",
    );

    let region = if config.region.trim().is_empty() {
        "us-east-1".to_string()
    } else {
        config.region.trim().to_string()
    };

    let force_path_style = config.use_path_style.unwrap_or(true);

    let conf = aws_sdk_s3::config::Builder::new()
        .endpoint_url(endpoint)
        .region(Region::new(region))
        .credentials_provider(credentials)
        .force_path_style(force_path_style)
        .behavior_version_latest()
        .build();

    Ok(Client::from_conf(conf))
}
