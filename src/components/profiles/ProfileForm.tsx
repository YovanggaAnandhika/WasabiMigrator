"use client";

import React, { useState } from "react";
import {
  Edit2,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Server,
  Key,
  Lock,
  Eye,
  EyeOff,
  Folder,
  FolderTree,
  Radio,
  FileDown,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { ProfileInput, ProfileRecord, TestResult } from "@/lib/types";
import { PRESETS } from "./types";

interface ProfileFormProps {
  formData: ProfileInput;
  isEditing: boolean;
  saving: boolean;
  testing: boolean;
  testResult: TestResult | null;
  errorMessage: string | null;
  statusMessage: { text: string; type: "success" | "error" } | null;
  onChangeFormData: (data: ProfileInput) => void;
  onSave: (e: React.FormEvent) => void;
  onDelete?: () => void;
  onCloseForm: () => void;
  onTestConnection: () => void;
  onExportCSV: (profile: ProfileInput | ProfileRecord) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  formData,
  isEditing,
  saving,
  testing,
  testResult,
  errorMessage,
  statusMessage,
  onChangeFormData,
  onSave,
  onDelete,
  onCloseForm,
  onTestConnection,
  onExportCSV,
}) => {
  const [showSecret, setShowSecret] = useState(false);

  return (
    <form onSubmit={onSave} className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800/80">
          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            {isEditing ? <Edit2 className="h-4 w-4 text-blue-500" /> : <Plus className="h-4 w-4 text-emerald-500" />}
            {isEditing ? `Edit Profil: ${formData.name}` : "Buat Profil Kredensial Baru"}
          </h3>
          <div className="flex items-center gap-2">
            {isEditing && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                ID: {formData.id?.slice(0, 8)}...
              </span>
            )}
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 p-1.5 rounded-lg transition"
                title="Hapus profil ini"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onCloseForm}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-lg transition"
              title="Tutup form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
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
            onChange={(e) => onChangeFormData({ ...formData, name: e.target.value })}
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
                  onChangeFormData({
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
                onChange={(e) => onChangeFormData({ ...formData, endpoint_url: e.target.value })}
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
              onChange={(e) => onChangeFormData({ ...formData, region: e.target.value })}
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
                onChange={(e) => onChangeFormData({ ...formData, access_key_id: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 pl-9 pr-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
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
                onChange={(e) => onChangeFormData({ ...formData, secret_access_key: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 pl-9 pr-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Bucket Name & Prefix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              Bucket Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Folder className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                required
                placeholder="contoh: production-backups"
                value={formData.bucket_name || ""}
                onChange={(e) => onChangeFormData({ ...formData, bucket_name: e.target.value })}
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
                onChange={(e) => onChangeFormData({ ...formData, prefix: e.target.value })}
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
            onClick={onTestConnection}
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
            onClick={() => onExportCSV(formData)}
            title="Export kredensial yang sedang diedit ke file CSV"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-semibold shadow-sm transition disabled:opacity-40"
          >
            <FileDown className="h-3.5 w-3.5 text-blue-500" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCloseForm}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            Tutup Form
          </button>
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
  );
};
