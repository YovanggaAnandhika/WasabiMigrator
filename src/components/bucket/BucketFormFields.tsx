"use client";

import React, { useState } from "react";
import { Globe, Radio, Key, Lock, Eye, EyeOff, Server, FolderTree } from "lucide-react";
import { BucketConfig } from "@/lib/types";

interface BucketFormFieldsProps {
  config: BucketConfig;
  isSource: boolean;
  disabled: boolean;
  onChangePrefix: (prefix: string) => void;
}

export const BucketFormFields: React.FC<BucketFormFieldsProps> = ({
  config,
  isSource,
  disabled,
  onChangePrefix,
}) => {
  const [showSecret, setShowSecret] = useState(false);

  return (
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
            readOnly
            tabIndex={-1}
            placeholder="Pilih dari Profil Kredensial..."
            value={config.endpoint_url}
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-950/70 px-3 py-2 text-xs font-mono text-slate-700 dark:text-zinc-300 placeholder:text-slate-400 dark:placeholder:text-zinc-600 cursor-default select-all focus:outline-none transition"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 mb-1">
            <Radio className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
            Region
          </label>
          <input
            type="text"
            readOnly
            tabIndex={-1}
            placeholder="-"
            value={config.region}
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-950/70 px-3 py-2 text-xs font-mono text-slate-700 dark:text-zinc-300 placeholder:text-slate-400 dark:placeholder:text-zinc-600 cursor-default select-all focus:outline-none transition"
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
            readOnly
            tabIndex={-1}
            placeholder="Pilih profil untuk memuat..."
            value={config.access_key_id}
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-950/70 px-3 py-2 text-xs font-mono text-slate-700 dark:text-zinc-300 placeholder:text-slate-400 dark:placeholder:text-zinc-600 cursor-default select-all focus:outline-none transition"
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
            readOnly
            tabIndex={-1}
            placeholder="••••••••••••••••••••"
            value={config.secret_access_key}
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-950/70 px-3 py-2 text-xs font-mono text-slate-700 dark:text-zinc-300 placeholder:text-slate-400 dark:placeholder:text-zinc-600 cursor-default select-all focus:outline-none transition"
          />
        </div>
      </div>

      {/* Bucket Name & Prefix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 mb-1">
            <Server className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
            <span>{isSource ? "Source Bucket Name" : "Target Bucket Name"}</span>
          </label>
          <input
            type="text"
            readOnly
            tabIndex={-1}
            placeholder="Pilih profil untuk memuat bucket..."
            value={config.bucket_name}
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-950/70 px-3 py-2 text-xs font-mono text-slate-700 dark:text-zinc-300 placeholder:text-slate-400 dark:placeholder:text-zinc-600 cursor-default select-all focus:outline-none transition font-semibold"
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
            placeholder="folder/subfolder/ (opsional)"
            value={config.prefix}
            onChange={(e) => onChangePrefix(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-xs"
          />
        </div>
      </div>
    </div>
  );
};
