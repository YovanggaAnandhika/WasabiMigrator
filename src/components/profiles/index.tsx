"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { ProfileInput, ProfileRecord, TestResult } from "@/lib/types";
import {
  getProfiles,
  saveProfile,
  deleteProfile,
  getDbPath,
  testBucketConnection,
} from "@/lib/tauri";
import {
  ProfileManagerModalProps,
  INITIAL_FORM,
  exportProfileToCSV,
} from "./types";

// Dynamic imports with Next.js dynamic for code-splitting
const ProfileModalHeader = dynamic(
  () => import("./ProfileModalHeader").then((mod) => mod.ProfileModalHeader),
  { ssr: false }
);

const ProfileList = dynamic(
  () => import("./ProfileList").then((mod) => mod.ProfileList),
  { ssr: false }
);

const ProfileEmptyState = dynamic(
  () => import("./ProfileEmptyState").then((mod) => mod.ProfileEmptyState),
  { ssr: false }
);

const ProfileForm = dynamic(
  () => import("./ProfileForm").then((mod) => mod.ProfileForm),
  { ssr: false }
);

const ProfileManagerModal: React.FC<ProfileManagerModalProps> = ({
  isOpen,
  onClose,
  onProfilesUpdated,
}) => {
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileInput>(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [dbPath, setDbPath] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, setDeleting] = useState(false);
  const [testing, setTesting] = useState(false);

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profiles and db path
  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const list = await getProfiles();
      setProfiles(list);
      if (onProfilesUpdated) {
        onProfilesUpdated(list);
      }
      const path = await getDbPath();
      setDbPath(path);
    } catch (err: unknown) {
      console.error("Gagal memuat profil:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
      resetForm();
    }
  }, [isOpen]);

  const handleStartAdd = () => {
    setSelectedProfileId(null);
    setFormData(INITIAL_FORM);
    setIsEditing(false);
    setIsFormOpen(true);
    setTestResult(null);
    setErrorMessage(null);
    setStatusMessage(null);
  };

  const resetForm = () => {
    setSelectedProfileId(null);
    setFormData(INITIAL_FORM);
    setIsEditing(false);
    setIsFormOpen(false);
    setTestResult(null);
    setErrorMessage(null);
    setStatusMessage(null);
  };

  const handleSelectProfile = (p: ProfileRecord) => {
    setSelectedProfileId(p.id);
    setFormData({
      id: p.id,
      name: p.name,
      endpoint_url: p.endpoint_url,
      region: p.region,
      access_key_id: p.access_key_id,
      secret_access_key: p.secret_access_key,
      bucket_name: p.bucket_name,
      prefix: p.prefix,
      use_path_style: p.use_path_style,
    });
    setIsEditing(true);
    setIsFormOpen(true);
    setTestResult(null);
    setErrorMessage(null);
    setStatusMessage(null);
  };

  const handleCloneProfile = (p: ProfileRecord) => {
    setSelectedProfileId(null);
    setFormData({
      id: undefined, // Cleared ID creates a new record in SQLite on save
      name: `${p.name} (Copy)`,
      endpoint_url: p.endpoint_url,
      region: p.region,
      access_key_id: p.access_key_id,
      secret_access_key: p.secret_access_key,
      bucket_name: p.bucket_name,
      prefix: p.prefix,
      use_path_style: p.use_path_style,
    });
    setIsEditing(false); // Treated as new entry
    setIsFormOpen(true);
    setTestResult(null);
    setErrorMessage(null);
    setStatusMessage({
      text: `Profil '${p.name}' berhasil di-clone! Silakan sesuaikan nama/bucket lalu klik 'Simpan Profil ke DB'.`,
      type: "success",
    });
  };

  const handleTestConnection = async () => {
    if (!formData.endpoint_url || !formData.bucket_name) {
      alert("Harap isi Endpoint URL dan Bucket Name sebelum melakukan tes!");
      return;
    }
    setTesting(true);
    setTestResult(null);
    setErrorMessage(null);
    try {
      const res = await testBucketConnection({
        endpoint_url: formData.endpoint_url,
        region: formData.region,
        access_key_id: formData.access_key_id,
        secret_access_key: formData.secret_access_key,
        bucket_name: formData.bucket_name,
        prefix: formData.prefix || "",
        use_path_style: formData.use_path_style ?? true,
      });
      setTestResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Nama Profile wajib diisi!");
      return;
    }
    if (!formData.endpoint_url.trim() || !formData.access_key_id.trim() || !formData.secret_access_key.trim()) {
      alert("Endpoint URL, Access Key, dan Secret Key wajib diisi!");
      return;
    }
    if (!formData.bucket_name?.trim()) {
      alert("Nama Bucket wajib diisi di profil!");
      return;
    }

    setSaving(true);
    setStatusMessage(null);
    try {
      const saved = await saveProfile(formData);
      setStatusMessage({ text: `Profil '${saved.name}' berhasil disimpan ke SQLite!`, type: "success" });
      await fetchProfiles();
      handleSelectProfile(saved);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ text: `Gagal menyimpan profil: ${msg}`, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length === 0) {
        alert("File CSV kosong.");
        return;
      }

      const parseCSVLine = (line: string): string[] => {
        let delimiter = ",";
        if (line.includes(";") && !line.includes(",")) delimiter = ";";
        else if (line.includes("\t")) delimiter = "\t";

        const result: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            result.push(current.trim().replace(/^["']|["']$/g, ""));
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim().replace(/^["']|["']$/g, ""));
        return result;
      };

      let accessKey = "";
      let secretKey = "";
      let endpoint = formData.endpoint_url || "https://s3.ap-southeast-1.wasabisys.com";
      let region = formData.region || "ap-southeast-1";
      let bucketName = formData.bucket_name || "";
      let profileName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

      if (lines.length === 1 && (lines[0].includes("=") || lines[0].includes(":"))) {
        const parts = lines[0].split(/[;,]/);
        for (const part of parts) {
          const [k, v] = part.split(/[=:]/);
          if (k && v) {
            const keyLower = k.toLowerCase().trim();
            const valClean = v.trim().replace(/^["']|["']$/g, "");
            if (keyLower.includes("access") && !keyLower.includes("secret")) accessKey = valClean;
            if (keyLower.includes("secret")) secretKey = valClean;
          }
        }
      } else {
        const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
        const dataRows = lines.slice(1).map(parseCSVLine);
        const firstData = dataRows[0] || [];

        headers.forEach((h, idx) => {
          const val = firstData[idx] || "";
          if ((h.includes("access key") || h.includes("access_key") || h === "accesskeyid" || h === "accesskey") && !h.includes("secret")) {
            accessKey = val;
          } else if (h.includes("secret access key") || h.includes("secret_key") || h.includes("secret key") || h === "secretaccesskey" || h === "secretkey") {
            secretKey = val;
          } else if (h.includes("endpoint") || h.includes("host")) {
            endpoint = val;
          } else if (h.includes("region")) {
            region = val;
          } else if (h.includes("bucket")) {
            bucketName = val;
          } else if (h.includes("user name") || h.includes("username") || h.includes("profile")) {
            if (val) profileName = val;
          }
        });

        if (!accessKey && !secretKey) {
          if (firstData.length >= 3) {
            profileName = firstData[0] || profileName;
            accessKey = firstData[1];
            secretKey = firstData[2];
          } else if (firstData.length === 2) {
            accessKey = firstData[0];
            secretKey = firstData[1];
          }
        }
      }

      if (!accessKey || !secretKey) {
        alert("Gagal membaca Access Key ID atau Secret Key dari CSV.");
        return;
      }

      setFormData({
        id: undefined,
        name: profileName,
        endpoint_url: endpoint,
        region,
        access_key_id: accessKey,
        secret_access_key: secretKey,
        bucket_name: bucketName,
        prefix: "",
        use_path_style: true,
      });
      setIsEditing(false);
      setIsFormOpen(true);
      setSelectedProfileId(null);
      setTestResult(null);
      setErrorMessage(null);
      setStatusMessage({
        text: `Kredensial dari CSV berhasil dimuat! Silakan tentukan Nama Bucket lalu klik 'Simpan Profil ke DB'.`,
        type: "success",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus profil '${name}' dari SQLite database?`)) {
      return;
    }
    setDeleting(true);
    try {
      await deleteProfile(id);
      await fetchProfiles();
      if (selectedProfileId === id) {
        resetForm();
      }
      setStatusMessage({ text: `Profil '${name}' berhasil dihapus dari database.`, type: "success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ text: `Gagal menghapus profil: ${msg}`, type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-5xl h-[88vh] bg-white dark:bg-[#0c0d14] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        <ProfileModalHeader dbPath={dbPath} onClose={onClose} />

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleImportCSV}
          className="hidden"
        />

        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          <ProfileList
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            loading={loading}
            onSelectProfile={handleSelectProfile}
            onCloneProfile={handleCloneProfile}
            onStartAdd={handleStartAdd}
            onOpenImportCSV={() => fileInputRef.current?.click()}
            onExportCSV={exportProfileToCSV}
            onDeleteProfile={handleDelete}
          />

          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#0c0d14]">
            {!isFormOpen ? (
              <ProfileEmptyState
                onStartAdd={handleStartAdd}
                onOpenImportCSV={() => fileInputRef.current?.click()}
              />
            ) : (
              <ProfileForm
                formData={formData}
                isEditing={isEditing}
                saving={saving}
                testing={testing}
                testResult={testResult}
                errorMessage={errorMessage}
                statusMessage={statusMessage}
                onChangeFormData={setFormData}
                onSave={handleSave}
                onDelete={() => {
                  if (formData.id) {
                    handleDelete(formData.id, formData.name);
                  }
                }}
                onCloseForm={resetForm}
                onTestConnection={handleTestConnection}
                onExportCSV={exportProfileToCSV}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileManagerModal;
export { ProfileManagerModal };
