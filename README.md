# Wasabi & S3 Bucket Migration Tool (WasabiMigrator)

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tauri](https://img.shields.io/badge/Tauri-v2.x-24C8D5?logo=tauri&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-1.77+-orange.svg?logo=rust&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)

**High-performance, cross-platform desktop application for fast, secure, and resilient migrations between Wasabi, AWS S3, Cloudflare R2, MinIO, and other S3-compatible object storages.**

</div>

---

## 🚀 Key Features

- **⚡ Dual-Mode Migration Engine**:
  - **Server-Side Copy (0% Local Bandwidth)**: Transfers files directly cloud-to-cloud when endpoints and IAM/bucket permissions support cross-bucket copying.
  - **Client Streaming Relay**: High-speed chunked in-memory streaming relay fallback that transfers data without exhausting local disk space.
- **🛡️ Conflict & Overwrite Strategies**:
  - `Overwrite Always`: Replaces destination objects unconditionally.
  - `Skip Existing`: Skips objects that already exist in the destination.
  - `Overwrite If Newer`: Compares object `LastModified` timestamps / ETags and only updates newer files.
  - `Rename on Conflict`: Appends timestamps/prefixes to preserve both versions.
- **🔄 Multi-Profile Management**:
  - Save, manage, and clone multiple S3 profiles (Access Key, Secret Key, Region, Custom Endpoint).
  - Fast switching between Wasabi regions, AWS S3, MinIO, and Cloudflare R2.
- **🔍 Pre-Flight Connection & Validation Gate**:
  - Mandatory pre-flight test connection for both Source and Destination before starting migration.
  - Bucket listing and policy access verification.
- **📊 Real-time Monitoring & Transfer Metrics**:
  - Live transfer speed (MB/s), estimated time remaining (ETA), transfer counter, and active file indicators.
  - Full control over concurrency limits (1–32 parallel workers).
  - Ability to **Pause**, **Resume**, and **Cancel** active migrations cleanly.
- **📝 Activity & Transfer Audit Logs**:
  - Live console stream of all operations (uploaded, copied, skipped, failed).
  - Filterable by log levels (Info, Success, Warning, Error).
  - Persistent SQLite storage for migration history and transfer reports.

---

## 🛠️ Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────┐
│               Frontend (Next.js 16 + React 19)         │
│  - Tailwind CSS v4 + Custom Dark/Light Theme System    │
│  - Lucide Icons & Responsive Glassmorphic UI           │
│  - State Management & Tauri IPC Bridge                 │
└───────────────────────────┬────────────────────────────┘
                            │ Tauri IPC (Commands & Events)
┌───────────────────────────▼────────────────────────────┐
│                  Backend (Rust + Tauri v2)             │
│  - Async Multi-threaded Tokio Engine                   │
│  - AWS SDK for S3 (Wasabi & S3 compatible endpoints)   │
│  - Embedded SQLite (Rusqlite) for Profiles & Logs      │
│  - Streaming Relay & Server-Side Copy Dispatcher       │
└────────────────────────────────────────────────────────┘
```

---

## 📦 Prerequisites

Ensure you have the following installed on your development machine:

1. **[Bun](https://bun.sh/)** (or Node.js 20+)
2. **[Rust](https://www.rust-lang.org/)** (v1.77.2 or later)
3. **OS-specific build tools**:
   - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
   - **Windows**: Microsoft Visual Studio 2022 C++ Build Tools with MSVC v143 and Windows 10/11 SDK.
   - **Linux**: `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`, `file`, `libxdo-dev`, `libssl-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`

---

## 💻 Getting Started

### 1. Clone the Repository
```bash
git clone git@github.com:YovanggaAnandhika/WasabiMigrator.git
cd WasabiMigrator
```

### 2. Install Dependencies
```bash
bun install
```

### 3. Run in Development Mode
```bash
bun tauri dev
```

### 4. Build Production Application
```bash
bun tauri build
```
The compiled binaries/installers (`.dmg`, `.app`, `.msi`, `.exe`, or `.deb`/`.AppImage`) will be available in `src-tauri/target/release/bundle/`.

---

## ⚙️ Configuration & Policy Guide

For full permissions and configuration requirements when setting up Wasabi or AWS S3 buckets (including CORS, Bucket Policies, and IAM permissions required for Server-Side Copy vs Streaming), see:
- [PANDUAN_POLICY_MIGRASI.md](./PANDUAN_POLICY_MIGRASI.md)

---

## 📄 License

This project is licensed under the MIT License.
