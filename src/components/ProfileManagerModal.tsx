"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Save,
  Trash2,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Server,
  Key,
  Lock,
  FolderTree,
  Edit2,
  Radio,
  FileCheck2,
  HardDrive,
  Folder,
  Upload,
  FileUp,
  FileDown,
} from "lucide-react";
import { ProfileInput, ProfileRecord, TestResult } from "@/lib/types";
import {
  getProfiles,
  saveProfile,
  deleteProfile,
  getDbPath,
  testBucketConnection,
} from "@/lib/tauri";

interface ProfileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectForSource?: (profile: ProfileRecord) => void;
  onSelectForTarget?: (profile: ProfileRecord) => void;
  onProfilesUpdated?: (profiles: ProfileRecord[]) => void;
}

const PRESETS = [
  { label: "Wasabi SG", endpoint: "https://s3.ap-southeast-1.wasabisys.com", region: "ap-southeast-1" },
  { label: "Wasabi US-East", endpoint: "https://s3.wasabisys.com", region: "us-east-1" },
  { label: "Wasabi EU-Central", endpoint: "https://s3.eu-central-1.wasabisys.com", region: "eu-central-1" },
  { label: "AWS S3", endpoint: "https://s3.amazonaws.com", region: "us-east-1" },
  { label: "MinIO / Custom", endpoint: "http://localhost:9000", region: "us-east-1" },
];

const INITIAL_FORM: ProfileInput = {
  name: "",
  endpoint_url: "https://s3.ap-southeast-1.wasabisys.com",
  region: "ap-southeast-1",
  access_key_id: "",
  secret_access_key: "",
  bucket_name: "",
  prefix: "",
  use_path_style: true,
};

export const ProfileManagerModal: React.FC<ProfileManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectForSource,
  onSelectForTarget,
  onProfilesUpdated,
}) => {
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileInput>(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [dbPath, setDbPath] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testing, setTesting] = useState(false);

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

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

  const resetForm = () => {
    setSelectedProfileId(null);
    setFormData(INITIAL_FORM);
    setIsEditing(false);
    setShowSecret(false);
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
    setShowSecret(false);
    setTestResult(null);
    setErrorMessage(null);
    setStatusMessage(null);
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

    setSaving(true);
    setStatusMessage(null);
    try {
      // Check if saving a new profile that duplicates an existing profile's credentials
      if (!formData.id) {
        const duplicate = profiles.find(
          (p) =>
            p.endpoint_url.trim().toLowerCase() === formData.endpoint_url.trim().toLowerCase() &&
            p.access_key_id.trim() === formData.access_key_id.trim()
        );

        if (duplicate) {
          const confirmOverwrite = confirm(
            `Kredensial ini sudah tersimpan dalam profil '${duplicate.name}'.\nApakah Anda ingin menimpa (update) profil yang sudah ada tersebut?`
          );
          if (!confirmOverwrite) {
            setSaving(false);
            return;
          }
          formData.id = duplicate.id;
        }
      }

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import credentials from Wasabi / AWS CSV with duplicate check
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

      // Check if credentials already exist in SQLite
      const existingMatch = profiles.find(
        (p) =>
          p.access_key_id.trim() === accessKey.trim() &&
          p.endpoint_url.trim().toLowerCase() === endpoint.trim().toLowerCase()
      );

      let targetId: string | undefined = undefined;

      if (existingMatch) {
        const shouldOverwrite = confirm(
          `Kredensial dari file CSV sama persis dengan profil yang sudah ada ('${existingMatch.name}').\n\nApakah Anda ingin menimpa (overwrite) profil tersebut?`
        );
        if (!shouldOverwrite) {
          // User chose not to overwrite: fill form for creating as a new copy
          setFormData({
            name: `${profileName} (Copy)`,
            endpoint_url: endpoint,
            region,
            access_key_id: accessKey,
            secret_access_key: secretKey,
            bucket_name: bucketName,
            prefix: "",
            use_path_style: true,
          });
          setIsEditing(false);
          setStatusMessage({
            text: "Kredensial diisi ke formulir. Silakan sesuaikan nama profil sebelum menyimpan.",
            type: "success",
          });
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
        targetId = existingMatch.id;
        profileName = existingMatch.name;
      }

      // Automatically save imported profile to SQLite
      try {
        setSaving(true);
        const saved = await saveProfile({
          id: targetId,
          name: profileName,
          endpoint_url: endpoint,
          region,
          access_key_id: accessKey,
          secret_access_key: secretKey,
          bucket_name: bucketName,
          prefix: "",
          use_path_style: true,
        });

        await fetchProfiles();
        handleSelectProfile(saved);
        setStatusMessage({
          text: targetId
            ? `Profil '${saved.name}' berhasil ditimpa dari file CSV!`
            : `Profil baru '${saved.name}' berhasil diimpor dari CSV ke SQLite!`,
          type: "success",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        alert(`Gagal menyimpan profil CSV: ${msg}`);
      } finally {
        setSaving(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // Export specific profile or current form data to CSV
  const handleExportProfileCSV = (profile: ProfileRecord | ProfileInput) => {
    if (!profile.access_key_id) {
      alert("Profil ini belum memiliki Access Key ID untuk diexport.");
      return;
    }

    const csvContent =
      "User Name,Access key ID,Secret access key,Endpoint URL,Region,Bucket Name\n" +
      `"${profile.name}","${profile.access_key_id}","${profile.secret_access_key}","${profile.endpoint_url}","${profile.region}","${profile.bucket_name || ""}"\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = (profile.name || "wasabi_profile").toLowerCase().replace(/[^a-z0-9]/g, "_");
    link.setAttribute("href", url);
    link.setAttribute("download", `${safeName}_credentials.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus profil '${name}' dari SQLite database?`)) {
      return;
    }
    setDeleting(true);
    try {
      await deleteProfile(id);
      await fetchProfiles();
      resetForm();
      setStatusMessage({ text: `Profil '${name}' berhasil dihapus.`, type: "success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Gagal menghapus profil: ${msg}`);
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

      {/* Modal Dialog (Expanded & Clean) */}
      <div className="relative w-full max-w-5xl h-[88vh] bg-white dark:bg-[#0c0d14] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 px-6 py-4 shrink-0 bg-slate-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-500">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Manajemen Profil Kredensial (SQLite Database)
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate max-w-lg" title={dbPath}>
                  Lokasi DB: {dbPath || "Memuat..."}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Hidden file input for CSV Import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleImportCSV}
          className="hidden"
        />

        {/* Modal Body: Left side Profiles List, Right side Profile Editor Form */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Panel: List of Profiles (Width ~ 38%) */}
          <div className="w-full md:w-[38%] border-r border-slate-200 dark:border-zinc-800 flex flex-col min-h-0 bg-slate-50/30 dark:bg-zinc-950/40">
            <div className="p-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Profil ({profiles.length})
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Import kredensial dari file CSV (Wasabi / AWS standard)"
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 shadow-xs transition"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Import CSV</span>
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>

            {/* Profiles Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  <span className="text-xs">Memuat profil dari SQLite...</span>
                </div>
              ) : profiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center p-4 border border-dashed border-slate-300 dark:border-zinc-800 rounded-xl">
                  <Database className="h-8 w-8 text-slate-400/50 mb-2" />
                  <p className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                    Belum ada profil tersimpan.
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                    Klik tombol &apos;+ Tambah Profil&apos; untuk menyimpan kredensial Wasabi / S3 pertama Anda.
                  </p>
                </div>
              ) : (
                profiles.map((p) => {
                  const isSelected = selectedProfileId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProfile(p)}
                      className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
                          : "border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 hover:border-slate-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isSelected ? "bg-blue-500" : "bg-slate-400 dark:bg-zinc-600"
                              }`}
                            />
                            {p.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                            {p.bucket_name ? `Bucket: ${p.bucket_name}` : "(Belum ada bucket default)"}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                            {p.endpoint_url} ({p.region})
                          </p>
                        </div>
                      </div>

                      {/* Quick Apply Actions */}
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1">
                          {onSelectForSource && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectForSource(p);
                                onClose();
                              }}
                              title="Gunakan profil ini sebagai Source Bucket"
                              className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition"
                            >
                              Pakai di Source
                            </button>
                          )}
                          {onSelectForTarget && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectForTarget(p);
                                onClose();
                              }}
                              title="Gunakan profil ini sebagai Destination Bucket"
                              className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                            >
                              Pakai di Dest
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportProfileCSV(p);
                            }}
                            title="Export profil ini ke file CSV"
                            className="p-1 rounded-md text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                          >
                            <FileDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(p.id, p.name);
                            }}
                            title="Hapus profil dari database"
                            className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Profile Form Editor (Width ~ 62%) */}
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#0c0d14]">
            <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800/80">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                    {isEditing ? <Edit2 className="h-4 w-4 text-blue-500" /> : <Plus className="h-4 w-4 text-emerald-500" />}
                    {isEditing ? `Edit Profil: ${formData.name}` : "Buat Profil Kredensial Baru"}
                  </h3>
                  {isEditing && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      ID: {formData.id?.slice(0, 8)}...
                    </span>
                  )}
                </div>

                {statusMessage && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      statusMessage.type === "success"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {statusMessage.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{statusMessage.text}</span>
                  </div>
                )}

                {/* Profile Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Nama Profil <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Wasabi Production SG / Backup Storage EU"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1.5">
                    Quick Preset Provider:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            endpoint_url: p.endpoint,
                            region: p.region,
                          })
                        }
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                          formData.endpoint_url === p.endpoint
                            ? "border-blue-500 bg-blue-500/15 text-blue-500 font-semibold"
                            : "border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-400 hover:border-slate-300"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Endpoint URL & Region */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Endpoint URL <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="url"
                        required
                        placeholder="https://s3.ap-southeast-1.wasabisys.com"
                        value={formData.endpoint_url}
                        onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 pl-9 pr-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Region <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ap-southeast-1"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                {/* Access Key ID & Secret Access Key */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Access Key ID <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Wasabi / S3 Access Key ID"
                        value={formData.access_key_id}
                        onChange={(e) => setFormData({ ...formData, access_key_id: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 pl-9 pr-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Secret Access Key <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="text-[11px] text-blue-500 hover:underline flex items-center gap-1"
                      >
                        {showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {showSecret ? "Hide" : "Show"}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type={showSecret ? "text" : "password"}
                        required
                        placeholder="Wasabi / S3 Secret Access Key"
                        value={formData.secret_access_key}
                        onChange={(e) => setFormData({ ...formData, secret_access_key: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 pl-9 pr-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Default Bucket Name & Prefix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Target Bucket Name (Opsional)
                    </label>
                    <div className="relative">
                      <Folder className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="contoh: production-backups"
                        value={formData.bucket_name || ""}
                        onChange={(e) => setFormData({ ...formData, bucket_name: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 pl-9 pr-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Prefix / Folder (Opsional)
                    </label>
                    <div className="relative">
                      <FolderTree className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="contoh: postgres/daily/"
                        value={formData.prefix || ""}
                        onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 pl-9 pr-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Test Connection Banner if run */}
                {testResult && (
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{testResult.message}</span>
                  </div>
                )}
                {errorMessage && (
                  <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Form Footer Actions */}
              <div className="border-t border-slate-200 dark:border-zinc-800 p-4 shrink-0 bg-slate-50/50 dark:bg-zinc-900/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing || !formData.bucket_name}
                    title="Uji koneksi ke Wasabi/S3 dengan kredensial ini"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" /> : <Radio className="h-3.5 w-3.5 text-blue-500" />}
                    <span>{testing ? "Menguji..." : "Test Connection"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={!formData.access_key_id}
                    onClick={() => handleExportProfileCSV(formData)}
                    title="Export kredensial yang sedang diedit ke file CSV"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-semibold shadow-sm transition disabled:opacity-40"
                  >
                    <FileDown className="h-3.5 w-3.5 text-blue-500" />
                    <span>Export CSV</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                    >
                      Batal Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    <span>{saving ? "Menyimpan..." : isEditing ? "Perbarui Profil di DB" : "Simpan Profil ke DB"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
