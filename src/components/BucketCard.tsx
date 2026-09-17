"use client";

import React, { useState, useRef } from "react";
import {
  Server,
  Key,
  Lock,
  FolderTree,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Radio,
  Globe,
  FileDown,
  Upload,
  Bookmark,
  Plus,
} from "lucide-react";
import { BucketConfig, ProfileRecord, TestResult } from "@/lib/types";
import { testBucketConnection } from "@/lib/tauri";

interface BucketCardProps {
  title: string;
  side: "source" | "target";
  config: BucketConfig;
  onChange: (newConfig: BucketConfig) => void;
  profiles?: ProfileRecord[];
  onOpenProfileManager?: () => void;
  disabled?: boolean;
  className?: string;
}

const PRESETS = [
  { label: "Wasabi SG", endpoint: "https://s3.ap-southeast-1.wasabisys.com", region: "ap-southeast-1" },
  { label: "Wasabi US-East", endpoint: "https://s3.wasabisys.com", region: "us-east-1" },
  { label: "Wasabi EU-Central", endpoint: "https://s3.eu-central-1.wasabisys.com", region: "eu-central-1" },
  { label: "AWS S3", endpoint: "https://s3.amazonaws.com", region: "us-east-1" },
  { label: "MinIO / Custom", endpoint: "http://localhost:9000", region: "us-east-1" },
];

export const BucketCard: React.FC<BucketCardProps> = ({
  title,
  side,
  config,
  onChange,
  profiles = [],
  onOpenProfileManager,
  disabled = false,
  className = "",
}) => {
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSource = side === "source";
  const badgeColor = isSource
    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setErrorMessage(null);

    try {
      const res = await testBucketConnection(config);
      setTestResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setTesting(false);
    }
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    onChange({
      ...config,
      endpoint_url: preset.endpoint,
      region: preset.region,
    });
  };

  // Export credentials to Wasabi / AWS standard CSV format
  const handleExportCSV = () => {
    const csvContent =
      "User Name,Access key ID,Secret access key,Endpoint URL,Region,Bucket Name\n" +
      `"admin","${config.access_key_id}","${config.secret_access_key}","${config.endpoint_url}","${config.region}","${config.bucket_name}"\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `${config.bucket_name || (isSource ? "source" : "target")}_wasabi_credentials.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import credentials from Wasabi / AWS CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length === 0) {
        alert("File CSV kosong.");
        return;
      }

      // Helper to parse a delimited line handling quotes and commas/semicolons/tabs
      const parseCSVLine = (line: string): string[] => {
        // Check delimiter: comma, semicolon, or tab
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
      let endpoint = config.endpoint_url;
      let region = config.region;
      let bucketName = config.bucket_name;

      // Handle Key=Value format or 2-row table format
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
          }
        });

        // Fallback for headerless or standard Wasabi CSV (User Name, Access Key Id, Secret Access Key)
        if (!accessKey && !secretKey) {
          if (firstData.length >= 3) {
            // Wasabi format: [User Name, Access Key Id, Secret Access Key]
            accessKey = firstData[1];
            secretKey = firstData[2];
          } else if (firstData.length === 2) {
            // [Access Key, Secret Key]
            accessKey = firstData[0];
            secretKey = firstData[1];
          }
        }
      }

      onChange({
        ...config,
        access_key_id: accessKey || config.access_key_id,
        secret_access_key: secretKey || config.secret_access_key,
        endpoint_url: endpoint || config.endpoint_url,
        region: region || config.region,
        bucket_name: bucketName || config.bucket_name,
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`relative flex flex-col rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 backdrop-blur-xl p-5 shadow-lg dark:shadow-2xl transition-all duration-300 hover:border-slate-300 dark:hover:border-zinc-700/80 ${className}`}>
      {/* Hidden file input for CSV Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleImportCSV}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
              isSource
                ? "border-blue-500/30 bg-blue-500/10 text-blue-500 dark:text-blue-400"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
            }`}
          >
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              {title}
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${badgeColor}`}>
                {isSource ? "SOURCE" : "DESTINATION"}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {isSource ? "Bucket asal objek yang akan dipindahkan" : "Bucket tujuan tempat objek disimpan"}
            </p>
          </div>
        </div>

        {/* Actions: Presets & CSV Export/Import */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {/* Export CSV button */}
          <button
            type="button"
            disabled={disabled || !config.access_key_id}
            onClick={handleExportCSV}
            title="Export kredensial ke file CSV format Wasabi / AWS"
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/70 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 shadow-xs transition disabled:opacity-40"
          >
            <FileDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <span>Export CSV</span>
          </button>

          {/* Import CSV button */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            title="Import kredensial dari file CSV Wasabi / AWS"
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/70 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 shadow-xs transition disabled:opacity-40"
          >
            <Upload className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>Import CSV</span>
          </button>

          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 dark:text-zinc-400 mx-1">|</span>

          {PRESETS.slice(0, 3).map((p) => (
            <button
              key={p.label}
              type="button"
              disabled={disabled}
              onClick={() => applyPreset(p)}
              className="text-[11px] px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Selector Bar (SQLite Stored Credentials) */}
      <div className="mt-3 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Bookmark className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 shrink-0">
            Profil Tersimpan:
          </span>
          <select
            disabled={disabled}
            value=""
            onChange={(e) => {
              const selected = profiles.find((p) => p.id === e.target.value);
              if (selected) {
                onChange({
                  endpoint_url: selected.endpoint_url,
                  region: selected.region,
                  access_key_id: selected.access_key_id,
                  secret_access_key: selected.secret_access_key,
                  bucket_name: selected.bucket_name || config.bucket_name,
                  prefix: selected.prefix || config.prefix,
                  use_path_style: selected.use_path_style,
                });
              }
            }}
            className="flex-1 text-xs rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="" disabled>
              {profiles.length > 0 ? "-- Pilih Profil Kredensial --" : "(Belum ada profil tersimpan)"}
            </option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.bucket_name ? `(${p.bucket_name})` : ""}
              </option>
            ))}
          </select>
        </div>

        {onOpenProfileManager && (
          <button
            type="button"
            disabled={disabled}
            onClick={onOpenProfileManager}
            className="flex items-center justify-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition shrink-0"
          >
            <Plus className="h-3 w-3" />
            <span>Kelola Profil</span>
          </button>
        )}
      </div>

      {/* Form Fields */}
      <div className="mt-3 space-y-3 flex-1">
        {/* Endpoint URL & Region */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 mb-1">
              <Globe className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
              Endpoint URL
            </label>
            <input
              type="text"
              disabled={disabled}
              placeholder="https://s3.ap-southeast-1.wasabisys.com"
              value={config.endpoint_url}
              onChange={(e) => onChange({ ...config, endpoint_url: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 px-3 py-2 text-xs font-mono text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-blue-500/70 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 mb-1">
              <Radio className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
              Region
            </label>
            <input
              type="text"
              disabled={disabled}
              placeholder="ap-southeast-1"
              value={config.region}
              onChange={(e) => onChange({ ...config, region: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 px-3 py-2 text-xs font-mono text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-blue-500/70 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition"
            />
          </div>
        </div>

        {/* Access Key & Secret Key */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 mb-1">
              <Key className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
              Access Key ID
            </label>
            <input
              type="text"
              disabled={disabled}
              placeholder="AKIA..."
              value={config.access_key_id}
              onChange={(e) => onChange({ ...config, access_key_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 px-3 py-2 text-xs font-mono text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-blue-500/70 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
                Secret Access Key
              </span>
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="text-[10px] text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 flex items-center gap-1"
              >
                {showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showSecret ? "Hide" : "Show"}
              </button>
            </label>
            <input
              type={showSecret ? "text" : "password"}
              disabled={disabled}
              placeholder="••••••••••••••••••••"
              value={config.secret_access_key}
              onChange={(e) => onChange({ ...config, secret_access_key: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 px-3 py-2 text-xs font-mono text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-blue-500/70 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition"
            />
          </div>
        </div>

        {/* Bucket Name & Prefix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 mb-1">
              <Server className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
              Target Bucket Name
            </label>
            <input
              type="text"
              disabled={disabled}
              placeholder="my-bucket-name"
              value={config.bucket_name}
              onChange={(e) => onChange({ ...config, bucket_name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 px-3 py-2 text-xs font-mono text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-blue-500/70 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 mb-1">
              <FolderTree className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
              Prefix / Folder (Opsional)
            </label>
            <input
              type="text"
              disabled={disabled}
              placeholder="folder/subfolder/ (optional)"
              value={config.prefix}
              onChange={(e) => onChange({ ...config, prefix: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 px-3 py-2 text-xs font-mono text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-blue-500/70 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition"
            />
          </div>
        </div>
      </div>

      {/* Footer / Test Button & Status */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800/80 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={disabled || testing}
          onClick={handleTest}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition shadow-lg ${
            isSource
              ? "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 shadow-blue-600/20"
              : "bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-600/20"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {testing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Menguji Koneksi...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Test {isSource ? "Source" : "Target"} Connection
            </>
          )}
        </button>

        {/* Status Indicators */}
        <div className="flex-1 text-right text-xs">
          {testResult && (
            <div className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-2.5 py-1 rounded-md shadow-xs">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate max-w-[260px]">{testResult.message}</span>
            </div>
          )}
          {errorMessage && (
            <div
              title={`${errorMessage}\n(Klik untuk melihat/salin pesan error lengkap)`}
              onClick={() => alert(`Detail Error:\n\n${errorMessage}`)}
              className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/20 px-2.5 py-1 rounded-md shadow-xs cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-500/20 transition"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span className="truncate max-w-[260px]">{errorMessage}</span>
            </div>
          )}
          {!testResult && !errorMessage && !testing && (
            <span className="text-slate-500 dark:text-zinc-400 text-[11px] font-medium">Belum diuji</span>
          )}
        </div>
      </div>
    </div>
  );
};
