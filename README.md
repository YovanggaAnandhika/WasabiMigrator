# Wasabi & S3 Bucket Migration Tool (WasabiMigrator)

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tauri](https://img.shields.io/badge/Tauri-v2.x-24C8D5?logo=tauri&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-1.77+-orange.svg?logo=rust&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)

**High-performance, secure, and resilient cross-platform desktop application designed for large-scale object migration between Wasabi, Amazon AWS S3, Cloudflare R2, MinIO, Google Cloud Storage (S3 API), DigitalOcean Spaces, and other S3-compatible cloud object storages.**

[Fitur Utama](#-fitur-utama--key-features) • [Arsitektur](#-arsitektur--teknologi) • [Instalasi & Menjalankan](#-instalasi--menjalankan-aplikasi) • [Panduan Penggunaan](#-panduan-penggunaan-lengkap) • [Strategi Konflik](#-strategi-resolusi-konflik--overwrite) • [Troubleshooting & Build Guide](#-troubleshooting--build-guide)

</div>

---

## 🚀 Fitur Utama / Key Features

### 1. ⚡ Dual-Mode Migration Engine
Aplikasi secara cerdas mendeteksi dan memilih mode transfer terbaik secara otomatis:
- **Server-Side Copy (0% Local Bandwidth)**:
  - Jika bucket sumber dan tujuan berada di endpoint/region yang kompatibel dan memiliki izin IAM/Bucket Policy yang memadai, file disalin langsung *cloud-to-cloud* antar server tanpa membebani kuota bandwidth internet lokal Anda.
- **Client Streaming Relay (Memory-Safe Chunking)**:
  - Jika Server-Side Copy tidak didukung (misal antar cloud provider berbeda seperti Wasabi ➔ AWS S3 / Cloudflare R2), transfer dialihkan ke mode *Streaming Relay*.
  - Data di-stream secara in-memory (chunk by chunk) tanpa menulis file sementara ke harddisk lokal, menjaga storage komputer tetap aman dari kepenuhan.

### 2. 🛡️ Pre-Flight Verification Gatekeeper
- Fitur keamanan aktif yang **mewajibkan pengujian koneksi (Test Connection)** untuk **Source Bucket** dan **Destination Bucket**.
- Tombol *Mulai Migrasi* hanya akan aktif jika kedua koneksi teruji sukses dan izin bucket terverifikasi valid, mencegah migrasi gagal di tengah jalan akibat salah kredensial.

### 3. 🔀 Resolusi Konflik Fleksibel
Empat strategi cerdas untuk menangani file yang sudah ada di bucket tujuan:
- **Overwrite Always**: Mengganti objek tujuan tanpa syarat.
- **Skip Existing**: Melewati file yang sudah ada di bucket tujuan untuk menghemat waktu dan bandwidth.
- **Overwrite If Newer**: Membandingkan tanggal `LastModified` dan `ETag` / ukuran file, hanya memperbarui jika file sumber lebih baru.
- **Rename on Conflict**: Menambahkan timestamp/prefix unik pada file baru agar file lama tidak terhapus.

### 4. 🎛️ Profiling & Multi-Account Management
- Simpan kredensial (*Access Key*, *Secret Key*, *Region*, *Endpoint*, *Bucket Name*) dalam profil tersimpan.
- Fitur **Clone / Duplicate Profile** untuk mempercepat pembuatan variasi profil bucket.
- Manajemen profil aman dengan tombol show/hide secret key dan modal konfirmasi penghapusan kustom.
- Fitur **Swap Source & Destination** dengan animasi halus untuk membalik arah migrasi dalam 1 klik.

### 5. 📊 Real-Time Metrics & Interactive Controls
- **Transfer Speed Indicator**: Kecepatan transfer langsung dalam format `MB/s` atau `GB/s`.
- **ETA & Progress Tracking**: Estimasi sisa waktu selesai, persentase progress bar, jumlah file terproses, dan ukuran data yang telah ditransfer.
- **Active File Monitor**: Menampilkan nama file dan ukuran yang sedang aktif ditransfer secara real-time.
- **Concurrency Control**: Slider multi-threading (1 hingga 32 worker paralel) yang dapat disesuaikan dengan kapasitas bandwidth Anda.
- **Pause, Resume, & Cancel**: Kendali penuh untuk menjeda, melanjutkan, atau membatalkan proses migrasi secara graceful tanpa merusak data.

### 6. 📝 Live Activity Log & SQLite Audit History
- Streaming log aktivitas real-time dengan filter status (*Info*, *Success*, *Warning*, *Error*).
- Pencarian log interaktif dan fitur *Freeze / Auto-Scroll*.
- Riwayat migrasi otomatis tersimpan di database lokal SQLite (*Rusqlite*) untuk kebutuhan audit dan pelaporan.

---

## 🏗️ Arsitektur & Teknologi

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (User Interface)                       │
│  - Framework: Next.js 16 (App Router, Static Export)                   │
│  - Library: React 19 + TypeScript + Tailwind CSS v4                    │
│  - Styling: Custom Design System (Glassmorphic, Modern Dark/Light)     │
│  - Icons: Lucide React                                                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Tauri IPC (Commands, Events, Channels)
┌───────────────────────────────────▼────────────────────────────────────┐
│                        BACKEND (Native Rust Engine)                    │
│  - Runtime: Tauri v2 Framework                                         │
│  - Async Runtime: Tokio Multi-Threaded Executor                        │
│  - Storage SDK: AWS SDK for Rust (S3 Client with custom endpoints)     │
│  - Local Database: SQLite (Rusqlite embedded database)                 │
│  - Engine Modules:                                                     │
│    ├── s3_client.rs     -> Connection pooling & client factory         │
│    ├── migration.rs     -> Dual-mode dispatch, streaming & copy worker │
│    ├── db.rs            -> Profile & log persistent storage            │
│    └── models.rs        -> Data structures & JSON serialization        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Prasyarat Sistem / Prerequisites

Pastikan perangkat Anda telah terpasang:

1. **[Bun](https://bun.sh/)** (v1.1+ direkomendasikan) atau **Node.js** (v20+).
2. **[Rust](https://www.rust-lang.org/)** (v1.77.2 atau versi lebih baru).
3. **Build Tools sesuai Sistem Operasi**:
   - **macOS**: Xcode Command Line Tools:
     ```bash
     xcode-select --install
     ```
   - **Windows**: Microsoft Visual Studio 2022 Build Tools dengan komponen:
     - `Desktop development with C++`
     - `MSVC v143 - VS 2022 C++ x64/x86 build tools` (atau `ARM64/ARM64EC` jika di Apple Silicon / Parallels Windows ARM)
     - `Windows 10/11 SDK`
   - **Linux (Ubuntu/Debian)**:
     ```bash
     sudo apt update && sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
     ```

---

## 💻 Instalasi & Menjalankan Aplikasi

### 1. Clone Repository
```bash
git clone git@github.com:YovanggaAnandhika/WasabiMigrator.git
cd WasabiMigrator
```

### 2. Install Dependensi Frontend
```bash
bun install
```

### 3. Jalankan Mode Development (Live Reload)
```bash
bun tauri dev
```
Aplikasi desktop akan terbuka secara otomatis dengan fitur hot-reload untuk antarmuka Next.js dan compiler Rust.

### 4. Build Installer / Executable Production
```bash
bun tauri build
```
File installer siap rilis akan dihasilkan di folder:
- **macOS**: `src-tauri/target/release/bundle/dmg/` (`.dmg`) atau `.app`
- **Windows**: `src-tauri/target/release/bundle/msi/` (`.msi`) atau `nsis/` (`.exe`)
- **Linux**: `src-tauri/target/release/bundle/deb/` (`.deb`) atau `appimage/` (`.AppImage`)

---

## 📖 Panduan Penggunaan Lengkap

```
                                  ALUR KERJA MIGRASI
                                  
  ┌─────────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
  │  1. Pilih/Buat  │       │ 2. Uji Koneksi       │       │ 3. Konfigurasi Mode  │
  │     Profil      │ ───>  │    Source & Target   │ ───>  │    & Concurrency     │
  └─────────────────┘       └──────────────────────┘       └──────────────────────┘
                                                                      │
  ┌─────────────────┐       ┌──────────────────────┐                  │
  │ 5. Pantau Speed │       │ 4. Klik 'Mulai       │                  ▼
  │    & Audit Log  │ <───  │    Migrasi Bucket'   │ <────────────────┘
  └─────────────────┘       └──────────────────────┘
```

### Langkah 1: Input Kredensial & Profil
1. Pada kartu **Source Bucket (Sumber)**:
   - Pilih profil tersimpan atau masukkan **Endpoint URL**, **Region**, **Access Key**, **Secret Key**, dan **Target Bucket Name**.
   - *(Opsional)* Isi **Prefix Path** jika hanya ingin memigrasikan subfolder tertentu (contoh: `documents/2026/`).
2. Pada kartu **Destination Bucket (Tujuan)**:
   - Masukkan informasi bucket target tempat data akan disimpan.
3. Gunakan tombol **Simpan Profil** untuk menyimpan kredensial agar dapat digunakan kembali kapan saja.

### Langkah 2: Uji Koneksi (Mandatory Test)
1. Klik tombol **Test Source Connection** pada sisi kiri.
2. Klik tombol **Test Target Connection** pada sisi kanan.
3. Setelah kedua indikator berubah menjadi warna hijau (*Verified*), tombol **Mulai Migrasi Bucket** di bagian bawah akan otomatis aktif.

### Langkah 3: Tentukan Strategi & Kecepatan
1. Pilih **Conflict Strategy**:
   - `Overwrite Always`, `Skip Existing`, `Overwrite If Newer`, atau `Rename Target`.
2. Sesuaikan **Concurrency**:
   - Gunakan nilai `4`–`8` worker untuk koneksi internet standar, atau `16`–`32` worker untuk jaringan cloud/server berkecepatan tinggi.

### Langkah 4: Eksekusi & Monitoring
1. Klik **Mulai Migrasi Bucket**.
2. Pantau throughput transfer secara real-time pada kartu metrics (kecepatan MB/s, sisa waktu ETA, dan nama file yang sedang aktif).
3. Anda dapat menekan tombol **Pause** untuk menjeda sementara atau **Stop** untuk membatalkan proses dengan aman.
4. Periksa tab **Activity Log** untuk melihat detail status setiap file yang berhasil disalin, dilewati, atau gagal.

---

## 🛡️ Strategi Resolusi Konflik & Overwrite

| Strategi | Perilaku Saat File Ditemukan di Tujuan | Rekomendasi Penggunaan |
| :--- | :--- | :--- |
| **`overwrite`** (Overwrite Always) | Mengganti file di bucket tujuan secara langsung dengan versi sumber. | Migrasi penuh / sinkronisasi total data master. |
| **`skip_existing`** (Skip Existing) | Melewati file jika nama key yang sama sudah ada di tujuan tanpa membaca ulang isi file. | Melanjutkan migrasi yang sempat terhenti (*Resume*) untuk menghemat bandwidth. |
| **`overwrite_newer`** (Overwrite If Newer) | Memeriksa metadata `LastModified` & ukuran. Hanya menimpa jika file sumber lebih baru. | Sinkronisasi berkala / pencadangan rutin (*Incremental Backup*). |
| **`rename_target`** (Rename on Conflict) | Mengunggah file baru dengan penambahan format timestamp unik. | Menjaga seluruh versi file agar tidak ada data historis yang tertimpa. |

---

## 🌐 Daftar Endpoint S3 Kompatibel Populer

| Cloud Provider | Region Contoh | Format Endpoint URL |
| :--- | :--- | :--- |
| **Wasabi Technologies** | AP Southeast 1 (Singapore)<br>US East 1 (N. Virginia)<br>EU Central 1 (Amsterdam) | `https://s3.ap-southeast-1.wasabisys.com`<br>`https://s3.us-east-1.wasabisys.com`<br>`https://s3.eu-central-1.wasabisys.com` |
| **Amazon Web Services (AWS)** | Global / Standard | `https://s3.amazonaws.com`<br>atau `https://s3.<region>.amazonaws.com` |
| **Cloudflare R2** | Global | `https://<account_id>.r2.cloudflarestorage.com` |
| **DigitalOcean Spaces** | Singapore (SGP1)<br>New York (NYC3) | `https://sgp1.digitaloceanspaces.com`<br>`https://nyc3.digitaloceanspaces.com` |
| **MinIO / Ceph (Self-hosted)** | Custom | `http(s)://<your-server-ip-or-domain>:<port>` |

---

## 🔧 Troubleshooting & Build Guide

### 1. Build di Windows / Parallels Desktop VM
Jika Anda melakukan build pada Windows yang berjalan di atas virtualisasi (seperti Parallels Desktop / VMware / VirtualBox) dengan folder sumber yang berada di shared mount drive (`Y:\`):

- **Error `linker 'link.exe' not found`**:
  - Pasang **Visual Studio Build Tools 2022**. Pada tab *Individual Components*, pastikan komponen C++ sesuai arsitektur terpasang:
    - Untuk Windows x64: `MSVC v143 - VS 2022 C++ x64/x86 build tools`
    - Untuk Windows ARM (Apple Silicon): `MSVC v143 - VS 2022 C++ ARM64/ARM64EC build tools`
- **Error `failed to remove temporary directory: (os error 87)` di shared drive `Y:\`**:
  - Driver shared mount virtual disk (`prl_fs.sys`) tidak mendukung operasi *atomic POSIX delete* pada folder temporary arsip `.rlib`.
  - **Solusi Praktis**: Alihkan target build Rust ke drive lokal `C:\` dengan menjalankan perintah ini **1 kali saja** di Command Prompt Windows:
    ```cmd
    setx CARGO_TARGET_DIR "C:\cargo-target"
    ```
  - Tutup dan buka kembali Command Prompt, lalu jalankan `bun tauri build`.

### 2. Next.js 16 Webpack Build
Proyek ini dikonfigurasi untuk mengekspor aplikasi secara statis (`output: "export"`) yang dioptimalkan untuk Tauri v2 runtime:
- Script `build` menggunakan flag `--webpack` (`next build --webpack`) untuk menjamin kompatibilitas penuh terhadap proses PostCSS / Tailwind CSS v4 di semua sistem operasi.

---

## 📄 Kebijakan IAM & Panduan Policy

Untuk contoh lengkap konfigurasi JSON Policy Wasabi/AWS IAM Cross-Account (Read-Only Source, Full-Access Target, dan Auto-Create Bucket), silakan baca:
👉 **[PANDUAN_POLICY_MIGRASI.md](./PANDUAN_POLICY_MIGRASI.md)**

---

## 🤝 Kontribusi & Lisensi

Kontribusi, perbaikan bug, dan penambahan fitur baru selalu disambut dengan baik:
1. Fork repository ini.
2. Buat branch fitur baru (`git checkout -b feature/NamaFitur`).
3. Commit perubahan Anda (`git commit -m 'feat: Tambahkan fitur X'`).
4. Push ke branch (`git push origin feature/NamaFitur`).
5. Buat Pull Request.

Didistribusikan di bawah **MIT License**. Lihat [LICENSE](./LICENSE) untuk informasi lebih lanjut.
