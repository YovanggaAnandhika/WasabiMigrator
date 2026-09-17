# Panduan Konfigurasi Policy Migrasi Wasabi (All Buckets)

Dokumen ini berisi panduan lengkap konfigurasi Policy IAM untuk skenario migrasi / sinkronisasi data antar akun Wasabi (**Cross-Account Migration**).

Konfigurasi ini memberikan izin **seluruh bucket (`*`)** baik di Akun Sumber maupun di Akun Tujuan, sehingga Anda tidak perlu repot mengubah policy setiap kali menambah atau mengganti nama bucket.

---

## 1. Akun Sumber (Source Account)

Akun Sumber adalah akun pemilik data yang akan di-copy atau dimigrasikan.

### Langkah-langkah:
1. Login ke Wasabi Console **Akun Sumber**.
2. Masuk ke menu **Policies** di sidebar kiri ➔ Klik **Create Policy**.
3. Beri nama Policy, contoh: `WasabiSourceReadAllBuckets`.
4. Salin dan tempelkan JSON Policy berikut:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAllBucketsReadOnly",
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "s3:ListBucket",
        "s3:GetObject",
        "s3:GetObjectVersion"
      ],
      "Resource": "*"
    }
  ]
}
```

5. Klik **Create Policy**.
6. Masuk ke menu **Users** di sidebar kiri:
   - Buat user baru (contoh: `migration-source-user`) atau pilih user yang sudah ada.
   - Buka tab **Policies** pada user tersebut, lalu **Attach** policy `WasabiSourceReadAllBuckets`.
   - Buka tab **API Keys** pada user tersebut, lalu klik **Create API Key**.
   - Download CSV atau simpan **Access Key** & **Secret Key** untuk dimasukkan ke bagian **Source Bucket** di aplikasi.

> **Catatan:** User ini hanya memiliki izin baca (Read-Only) ke seluruh bucket dan objek. User ini **tidak dapat menghapus** maupun memodifikasi file di akun sumber, sehingga sangat aman.

---

## 2. Akun Tujuan (Destination / Target Account)

Akun Tujuan adalah akun tempat data akan disalin dan disimpan.

### Langkah-langkah:
1. Login ke Wasabi Console **Akun Tujuan**.
2. Masuk ke menu **Policies** di sidebar kiri ➔ Klik **Create Policy** (atau edit policy `migrasi` yang sudah ada).
3. Beri nama Policy, contoh: `WasabiTargetWriteAllBuckets`.
4. Salin dan tempelkan JSON Policy berikut:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAllBucketsFullAccess",
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:DeleteObject",
        "s3:CreateBucket"
      ],
      "Resource": "*"
    }
  ]
}
```

5. Klik **Create Policy** (atau **Create New Version** jika mengedit).
6. Masuk ke menu **Users** di sidebar kiri:
   - Buat user baru (contoh: `migration-target-user`) atau pilih user yang dipakai (`9TS748...`).
   - Buka tab **Policies** pada user tersebut, lalu **Attach** policy `WasabiTargetWriteAllBuckets`.
   - Buka tab **API Keys**, buat API Key (jika belum ada).
   - Simpan **Access Key** & **Secret Key** untuk dimasukkan ke bagian **Destination Bucket** di aplikasi.

> **Fitur Auto-Create:** Dengan menyertakan `"s3:CreateBucket"`, aplikasi secara otomatis akan membuatkan bucket tujuan jika nama bucket yang dimasukkan belum ada di akun tujuan.

---

## 3. Cara Penggunaan di Aplikasi Migration Tool

Buka aplikasi **Wasabi & S3 Bucket Migration Tool**:

1. **Sisi Kiri (Source Bucket):**
   - **Endpoint URL**: `https://s3.ap-southeast-1.wasabisys.com` (sesuaikan region).
   - **Access Key & Secret Key**: Masukkan key dari **Akun Sumber** (Langkah 1).
   - **Target Bucket Name**: Masukkan nama bucket sumber yang ingin di-copy.
   - Klik **Test Source Connection** ➔ Hasil: Hijau (Sukses).

2. **Sisi Kanan (Destination Bucket):**
   - **Endpoint URL**: `https://s3.ap-southeast-1.wasabisys.com` (sesuaikan region).
   - **Access Key & Secret Key**: Masukkan key dari **Akun Tujuan** (Langkah 2).
   - **Target Bucket Name**: Masukkan nama bucket tujuan.
   - Klik **Test Target Connection** ➔ Hasil: Hijau (Sukses).

3. Klik tombol biru **Mulai Migrasi Bucket**.
   - Aplikasi akan membaca file dari akun sumber via API Key Sumber, lalu langsung menuliskannya ke akun tujuan via API Key Tujuan.
   - Proses ini tidak memerlukan konfigurasi rumit Bucket Policy per bucket satu per satu.
